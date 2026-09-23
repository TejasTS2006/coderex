"""
Log Normalization module for Docker deployment logs.

Extracts the concise error message, preserves the relevant raw log snippet,
and produces the standardized DockerErrorRecord.
"""

import re
from typing import List, Tuple
from .models import DockerErrorRecord
from .error_classifier import ErrorCategory, DockerContext


# Prefixes to strip when extracting the clean concise error_message
NOISE_PREFIXES = [
    re.compile(r"^docker:\s*Error response from daemon:\s*", re.IGNORECASE),
    re.compile(r"^Error response from daemon:\s*", re.IGNORECASE),
    re.compile(r"^ERROR:\s*", re.IGNORECASE),
    re.compile(r"^Error:\s*", re.IGNORECASE),
    re.compile(r"^FATAL:\s*", re.IGNORECASE),
    re.compile(r"^Exception:\s*", re.IGNORECASE),
]


def clean_error_message(msg: str) -> str:
    """Strip common noise wrappers from an error message string."""
    cleaned = msg.strip()
    for pattern in NOISE_PREFIXES:
        cleaned = pattern.sub("", cleaned).strip()
    return cleaned


def extract_specific_error_info(
    lines: List[str], full_text: str, error_type: str
) -> Tuple[str, str]:
    """
    Extract (error_message, raw_log) tailored to the error type.
    """
    # 1. Port conflict
    if error_type == ErrorCategory.PORT_CONFLICT:
        # Check for multi-line or single-line Bind for ... failed: port is already allocated
        bind_match = re.search(
            r"(Bind for [^\n]+ failed:\s*(?:\n\s*)?port is already allocated[^\n\.]*)",
            full_text,
            re.IGNORECASE
        )
        if bind_match:
            raw_matched = bind_match.group(1).replace("\n", " ").strip()
            # Normalize whitespace
            raw_matched = re.sub(r"\s+", " ", raw_matched)
            return "port is already allocated", raw_matched

        port_alloc_match = re.search(r"(port is already allocated[^\n\.]*)", full_text, re.IGNORECASE)
        if port_alloc_match:
            return "port is already allocated", port_alloc_match.group(1).strip()

        addr_match = re.search(r"(address already in use)", full_text, re.IGNORECASE)
        if addr_match:
            return "address already in use", addr_match.group(1).strip()

    # 2. Database connection failure
    if error_type == ErrorCategory.DATABASE_CONNECTION_FAILURE:
        # e.g., psycopg2.OperationalError: connection refused
        psycopg_match = re.search(r"(psycopg2\.\w+:\s*connection refused)", full_text, re.IGNORECASE)
        if psycopg_match:
            return "connection refused", psycopg_match.group(1).strip()

        refused_line_match = re.search(r"([^\n]*connection refused[^\n]*)", full_text, re.IGNORECASE)
        if refused_line_match:
            raw_line = refused_line_match.group(1).strip()
            return "connection refused", raw_line

    # 3. Image pull failure
    if error_type == ErrorCategory.IMAGE_PULL_FAILURE:
        # Look for "pull access denied for ..., repository does not exist or may require authorization"
        pull_denied_match = re.search(
            r"(pull access denied for [^\n,]+,\s*(?:\n\s*)?repository does not exist or may require authorization[^\n]*)",
            full_text,
            re.IGNORECASE
        )
        if pull_denied_match:
            raw_matched = pull_denied_match.group(1).replace("\n", " ").strip()
            raw_matched = re.sub(r"\s+", " ", raw_matched)
            return "pull access denied", raw_matched.rstrip(".")

        if "pull access denied" in full_text.lower():
            for line in lines:
                if "pull access denied" in line.lower():
                    return "pull access denied", line.strip()

        for line in lines:
            if "manifest unknown" in line.lower() or "manifest for" in line.lower():
                return clean_error_message(line), line.strip()

    # 4. Dependency installation failure
    if error_type == ErrorCategory.DEPENDENCY_INSTALLATION_FAILURE:
        # Look for pip distribution errors
        no_dist_match = re.search(
            r"ERROR:\s*(No matching distribution found for\s+[^\n]+)",
            full_text,
            re.IGNORECASE
        )
        # Collect all pip ERROR lines for raw_log
        pip_error_lines = [
            line.strip() for line in lines
            if line.strip().startswith("ERROR:") or "No matching distribution found" in line or "Could not find a version" in line
        ]
        if no_dist_match:
            raw_log = "\n".join(pip_error_lines) if pip_error_lines else no_dist_match.group(0).strip()
            return no_dist_match.group(1).strip(), raw_log

        # npm errors
        for line in lines:
            if "npm ERR!" in line:
                raw_log = "\n".join([l.strip() for l in lines if "npm ERR!" in l])
                return clean_error_message(line), raw_log

    # 5. Dockerfile error
    if error_type == ErrorCategory.DOCKERFILE_ERROR:
        for line in lines:
            if any(term in line.lower() for term in ["unknown instruction:", "dockerfile parse error", "copy failed:"]):
                return clean_error_message(line), line.strip()

    # 6. Container not found
    if error_type == ErrorCategory.CONTAINER_NOT_FOUND:
        for line in lines:
            if "no such container" in line.lower():
                return clean_error_message(line), line.strip()

    # 7. Image not found
    if error_type == ErrorCategory.IMAGE_NOT_FOUND:
        for line in lines:
            if "no such image" in line.lower():
                return clean_error_message(line), line.strip()

    # 8. Docker daemon error
    if error_type == ErrorCategory.DOCKER_DAEMON_ERROR:
        for line in lines:
            if any(term in line.lower() for term in ["cannot connect to the docker daemon", "is the docker daemon running"]):
                return clean_error_message(line), line.strip()

    # 9. Permission error
    if error_type == ErrorCategory.PERMISSION_ERROR:
        for line in lines:
            if "permission denied" in line.lower() or "access is denied" in line.lower():
                return clean_error_message(line), line.strip()

    # 10. Container startup failure
    if error_type == ErrorCategory.CONTAINER_STARTUP_FAILURE:
        for line in lines:
            if any(term in line.lower() for term in ["exited with code", "oci runtime create failed", "executable file not found"]):
                return clean_error_message(line), line.strip()

    # 11. Generic Docker build failure
    if error_type == ErrorCategory.DOCKER_BUILD_FAILURE:
        for line in lines:
            if "returned a non-zero code:" in line.lower():
                return clean_error_message(line), line.strip()

    # Fallback: find any line with error indicators
    for line in lines:
        if any(prefix in line.lower() for prefix in ["error:", "failed:", "fatal:"]):
            return clean_error_message(line), line.strip()

    fallback_msg = lines[-1] if lines else "unknown docker error"
    return clean_error_message(fallback_msg), "\n".join(lines)


def normalize(
    lines: List[str], full_text: str, error_type: str, context: str
) -> DockerErrorRecord:
    """
    Produce a normalized DockerErrorRecord from preprocessed lines and classification metadata.
    """
    error_message, raw_log = extract_specific_error_info(lines, full_text, error_type)

    # Ensure raw_log is never empty if we have lines
    if not raw_log and lines:
        raw_log = "\n".join(lines)

    # Ensure error_message is not empty
    if not error_message:
        error_message = "unknown docker error"

    return DockerErrorRecord(
        error_message=error_message,
        error_type=error_type,
        service="docker",
        context=context,
        raw_log=raw_log
    )
