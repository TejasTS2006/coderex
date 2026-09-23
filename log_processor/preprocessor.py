"""
Log Preprocessing module for Docker deployment logs.

Cleans noise, strips ANSI codes, filters irrelevant progress indicators,
and isolates error-level lines and relevant context.
"""

import re
from typing import List, Tuple

# Regex to strip ANSI escape codes (colors, cursor movements, etc.)
ANSI_ESCAPE_PATTERN = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

# Regex for standard ISO-8601 or syslog timestamp prefixes
TIMESTAMP_PREFIX_PATTERN = re.compile(
    r'^(?:\[\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\]\s*|'
    r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s+|'
    r'[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+)'
)

# Common Docker error line indicators
ERROR_INDICATORS = [
    re.compile(r'error\b', re.IGNORECASE),
    re.compile(r'failed\b', re.IGNORECASE),
    re.compile(r'fatal\b', re.IGNORECASE),
    re.compile(r'exception\b', re.IGNORECASE),
    re.compile(r'denied\b', re.IGNORECASE),
    re.compile(r'conflict\b', re.IGNORECASE),
    re.compile(r'refused\b', re.IGNORECASE),
    re.compile(r'could not find\b', re.IGNORECASE),
    re.compile(r'cannot find\b', re.IGNORECASE),
    re.compile(r'non-zero code', re.IGNORECASE),
    re.compile(r'no such\b', re.IGNORECASE),
    re.compile(r'not found\b', re.IGNORECASE),
    re.compile(r'unable to\b', re.IGNORECASE),
    re.compile(r'bind for .* failed', re.IGNORECASE),
    re.compile(r'exited with code', re.IGNORECASE),
    re.compile(r'panic:', re.IGNORECASE),
]


def strip_ansi_codes(text: str) -> str:
    """Remove terminal ANSI color sequences and control codes."""
    if not text:
        return ""
    return ANSI_ESCAPE_PATTERN.sub('', text)


def clean_line(line: str, strip_timestamps: bool = False) -> str:
    """Clean a single line: strip trailing whitespace and optional timestamp prefix."""
    cleaned = line.rstrip('\r\n')
    if strip_timestamps:
        cleaned = TIMESTAMP_PREFIX_PATTERN.sub('', cleaned)
    return cleaned.strip()


def preprocess_log(raw_log_text: str) -> Tuple[List[str], str]:
    """
    Preprocess raw Docker log text.
    
    Returns:
      cleaned_lines: List of non-empty cleaned lines.
      full_cleaned_text: Cleaned text with ANSI codes removed and normalized line endings.
    """
    if not raw_log_text:
        return [], ""

    text = strip_ansi_codes(raw_log_text)
    raw_lines = text.splitlines()

    cleaned_lines = []
    for line in raw_lines:
        cleaned = clean_line(line)
        if cleaned:
            cleaned_lines.append(cleaned)

    full_cleaned_text = "\n".join(cleaned_lines)
    return cleaned_lines, full_cleaned_text


def is_error_line(line: str) -> bool:
    """Check if a line indicates an error condition."""
    for pattern in ERROR_INDICATORS:
        if pattern.search(line):
            return True
    return False


def extract_candidate_error_lines(lines: List[str]) -> List[str]:
    """
    Extract lines that are most likely to represent the core error or surrounding context.
    """
    error_indices = [i for i, line in enumerate(lines) if is_error_line(line)]
    if not error_indices:
        return lines

    # Keep a window around detected error lines
    selected_indices = set()
    for idx in error_indices:
        # Include current and adjacent lines if relevant
        for offset in range(-1, 2):
            target = idx + offset
            if 0 <= target < len(lines):
                selected_indices.add(target)

    sorted_indices = sorted(list(selected_indices))
    return [lines[i] for i in sorted_indices]
