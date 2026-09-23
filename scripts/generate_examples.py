"""
Script to batch process all sample logs in data/sample_logs/ and output structured JSON to output/examples/.
"""

import sys
from pathlib import Path

# Add project root to sys.path so log_processor can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from log_processor import DockerLogProcessor


def generate():
    sample_dir = PROJECT_ROOT / "data" / "sample_logs"
    output_dir = PROJECT_ROOT / "output" / "examples"
    output_dir.mkdir(parents=True, exist_ok=True)

    log_files = sorted(list(sample_dir.glob("*.log")))
    if not log_files:
        print(f"No log files found in {sample_dir}")
        return

    print(f"Processing {len(log_files)} sample log files...")
    print("=" * 80)
    print(f"{'File Name':<30} | {'Error Type':<30} | {'Context':<20}")
    print("-" * 80)

    for log_file in log_files:
        record = DockerLogProcessor.process_file(str(log_file))
        out_json_path = output_dir / f"{log_file.stem}.json"
        out_json_path.write_text(record.to_json(indent=2) + "\n", encoding="utf-8")
        print(f"{log_file.name:<30} | {record.error_type:<30} | {record.context:<20}")

    print("=" * 80)
    print(f"Successfully generated {len(log_files)} JSON examples in {output_dir}")


if __name__ == "__main__":
    generate()
