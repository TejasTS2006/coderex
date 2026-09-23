"""
Docker Log Parser Orchestrator.

High-level interface coordinating:
  1. Preprocessing
  2. Error Classification & Context Identification
  3. Information Extraction & Normalization
  4. Structured Output Generation
"""

import sys
import argparse
from typing import Optional
from pathlib import Path

from .models import DockerErrorRecord
from .preprocessor import preprocess_log
from .error_classifier import classify_error
from .normalizer import normalize


class DockerLogProcessor:
    """
    Main processor for Docker deployment logs.
    """

    @classmethod
    def process(cls, log_text: str) -> DockerErrorRecord:
        """
        Process a raw Docker log string into a standardized DockerErrorRecord.
        
        Steps:
          1. Preprocess: strip ANSI codes, normalize lines, remove noise.
          2. Classify: detect error category and execution context.
          3. Normalize: extract precise error message, preserve relevant raw log.
        """
        cleaned_lines, full_cleaned_text = preprocess_log(log_text)

        if not cleaned_lines:
            return DockerErrorRecord(
                error_message="empty or invalid log input",
                error_type="unknown_docker_error",
                service="docker",
                context="unknown",
                raw_log=log_text or ""
            )

        error_type, context = classify_error(full_cleaned_text)
        record = normalize(cleaned_lines, full_cleaned_text, error_type, context)
        return record

    @classmethod
    def process_file(cls, file_path: str) -> DockerErrorRecord:
        """Read a log file from disk and process its contents."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Log file not found: {file_path}")

        raw_content = path.read_text(encoding="utf-8", errors="replace")
        return cls.process(raw_content)


def main():
    """CLI entry point for processing Docker logs."""
    parser = argparse.ArgumentParser(
        description="Docker Deployment Troubleshooting Assistant - Member 1: Log Processor & Normalizer"
    )
    parser.add_argument(
        "file",
        nargs="?",
        type=str,
        help="Path to a Docker log file to process (reads from stdin if omitted)"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        help="Optional path to write the JSON output file"
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation (default: 2)"
    )

    args = parser.parse_args()

    if args.file:
        try:
            record = DockerLogProcessor.process_file(args.file)
        except Exception as e:
            sys.stderr.write(f"Error reading file: {e}\n")
            sys.exit(1)
    else:
        if sys.stdin.isatty():
            parser.print_help()
            sys.exit(0)
        raw_text = sys.stdin.read()
        record = DockerLogProcessor.process(raw_text)

    json_output = record.to_json(indent=args.indent)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json_output + "\n", encoding="utf-8")
        print(f"Structured JSON output saved to {args.output}")
    else:
        print(json_output)


if __name__ == "__main__":
    main()
