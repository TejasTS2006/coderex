"""
Error Classifier for Docker Deployment Logs.

Identifies the error category and execution context based on heuristics,
regular expressions, and domain patterns.
"""

import re
from typing import Optional, Tuple, List, Dict, Any


class ErrorCategory:
    PORT_CONFLICT = "port_conflict"
    IMAGE_PULL_FAILURE = "image_pull_failure"
    CONTAINER_STARTUP_FAILURE = "container_startup_failure"
    DEPENDENCY_INSTALLATION_FAILURE = "dependency_installation_failure"
    DOCKERFILE_ERROR = "dockerfile_error"
    DOCKER_BUILD_FAILURE = "docker_build_failure"
    DATABASE_CONNECTION_FAILURE = "database_connection_failure"
    PERMISSION_ERROR = "permission_error"
    CONTAINER_NOT_FOUND = "container_not_found"
    IMAGE_NOT_FOUND = "image_not_found"
    DOCKER_DAEMON_ERROR = "docker_daemon_error"
    NETWORK_ERROR = "network_error"
    UNKNOWN_DOCKER_ERROR = "unknown_docker_error"


class DockerContext:
    CONTAINER_STARTUP = "container startup"
    DOCKER_IMAGE_BUILD = "docker image build"
    IMAGE_PULL = "image pull"
    APPLICATION_STARTUP = "application startup"
    CONTAINER_RUNTIME = "container runtime"
    NETWORK_CONFIGURATION = "network configuration"
    DOCKER_DAEMON = "docker daemon"


# Classification rules ordered by precedence (specific errors before general errors)
CLASSIFICATION_RULES = [
    # 1. Port conflict
    {
        "type": ErrorCategory.PORT_CONFLICT,
        "default_context": DockerContext.CONTAINER_STARTUP,
        "patterns": [
            re.compile(r"port is already allocated", re.IGNORECASE),
            re.compile(r"address already in use", re.IGNORECASE),
            re.compile(r"Bind for .* failed:.*port", re.IGNORECASE),
            re.compile(r"failed to bind host port", re.IGNORECASE),
        ]
    },
    # 2. Database connection failure
    {
        "type": ErrorCategory.DATABASE_CONNECTION_FAILURE,
        "default_context": DockerContext.APPLICATION_STARTUP,
        "patterns": [
            re.compile(r"psycopg2\..*connection refused", re.IGNORECASE),
            re.compile(r"(?:postgresql|postgres|mysql|mariadb|mongodb|redis).*connection refused", re.IGNORECASE),
            re.compile(r"could not connect to (?:server|database|postgres|mysql|redis)", re.IGNORECASE),
            re.compile(r"Mongo(?:Network|Server)SelectionError", re.IGNORECASE),
            re.compile(r"OperationalError: connection refused", re.IGNORECASE),
            re.compile(r"Connection to .* failed:\s*Connection refused", re.IGNORECASE),
        ]
    },
    # 3. Dependency installation failure (must precede generic build failure)
    {
        "type": ErrorCategory.DEPENDENCY_INSTALLATION_FAILURE,
        "default_context": DockerContext.DOCKER_IMAGE_BUILD,
        "patterns": [
            re.compile(r"No matching distribution found", re.IGNORECASE),
            re.compile(r"Could not find a version that satisfies the requirement", re.IGNORECASE),
            re.compile(r"npm ERR! (?:code E404|404 Not Found|peer dep missing)", re.IGNORECASE),
            re.compile(r"yarn install.*failed", re.IGNORECASE),
            re.compile(r"go: cannot find module", re.IGNORECASE),
            re.compile(r"composer: Package .* not found", re.IGNORECASE),
            re.compile(r"cargo: failed to select a version", re.IGNORECASE),
            re.compile(r"E: Unable to locate package", re.IGNORECASE),
        ]
    },
    # 4. Dockerfile error (syntax, missing instructions, COPY failed)
    {
        "type": ErrorCategory.DOCKERFILE_ERROR,
        "default_context": DockerContext.DOCKER_IMAGE_BUILD,
        "patterns": [
            re.compile(r"unknown instruction:", re.IGNORECASE),
            re.compile(r"Dockerfile parse error", re.IGNORECASE),
            re.compile(r"COPY failed:", re.IGNORECASE),
            re.compile(r"ADD failed:", re.IGNORECASE),
            re.compile(r"failed to solve with frontend dockerfile", re.IGNORECASE),
            re.compile(r"failed to process.*Dockerfile", re.IGNORECASE),
        ]
    },
    # 5. Image pull failure
    {
        "type": ErrorCategory.IMAGE_PULL_FAILURE,
        "default_context": DockerContext.IMAGE_PULL,
        "patterns": [
            re.compile(r"pull access denied", re.IGNORECASE),
            re.compile(r"repository does not exist or may require authorization", re.IGNORECASE),
            re.compile(r"manifest for .* not found", re.IGNORECASE),
            re.compile(r"manifest unknown", re.IGNORECASE),
            re.compile(r"failed to resolve source metadata", re.IGNORECASE),
            re.compile(r"Error response from daemon:\s*pull access denied", re.IGNORECASE),
            re.compile(r"unauthorized: authentication required", re.IGNORECASE),
        ]
    },
    # 6. Container not found
    {
        "type": ErrorCategory.CONTAINER_NOT_FOUND,
        "default_context": DockerContext.CONTAINER_STARTUP,
        "patterns": [
            re.compile(r"No such container:", re.IGNORECASE),
            re.compile(r"Error: No such container", re.IGNORECASE),
            re.compile(r"container .* not found", re.IGNORECASE),
        ]
    },
    # 7. Image not found
    {
        "type": ErrorCategory.IMAGE_NOT_FOUND,
        "default_context": DockerContext.IMAGE_PULL,
        "patterns": [
            re.compile(r"No such image:", re.IGNORECASE),
            re.compile(r"image .* not found locally", re.IGNORECASE),
        ]
    },
    # 8. Docker daemon error
    {
        "type": ErrorCategory.DOCKER_DAEMON_ERROR,
        "default_context": DockerContext.DOCKER_DAEMON,
        "patterns": [
            re.compile(r"Cannot connect to the Docker daemon", re.IGNORECASE),
            re.compile(r"Is the docker daemon running", re.IGNORECASE),
            re.compile(r"dial unix /var/run/docker\.sock", re.IGNORECASE),
            re.compile(r"docker daemon is not running", re.IGNORECASE),
            re.compile(r"pipe:////\./pipe/docker_engine", re.IGNORECASE),
        ]
    },
    # 9. Network error
    {
        "type": ErrorCategory.NETWORK_ERROR,
        "default_context": DockerContext.NETWORK_CONFIGURATION,
        "patterns": [
            re.compile(r"network .* not found", re.IGNORECASE),
            re.compile(r"failed to create network", re.IGNORECASE),
            re.compile(r"endpoint with name .* already exists in network", re.IGNORECASE),
            re.compile(r"could not resolve host", re.IGNORECASE),
            re.compile(r"Temporary failure in name resolution", re.IGNORECASE),
            re.compile(r"dial tcp: lookup", re.IGNORECASE),
        ]
    },
    # 10. Permission error
    {
        "type": ErrorCategory.PERMISSION_ERROR,
        "default_context": DockerContext.CONTAINER_RUNTIME,
        "patterns": [
            re.compile(r"permission denied", re.IGNORECASE),
            re.compile(r"access is denied", re.IGNORECASE),
            re.compile(r"operation not permitted", re.IGNORECASE),
            re.compile(r"EACCES: permission denied", re.IGNORECASE),
        ]
    },
    # 11. Generic Docker build failure
    {
        "type": ErrorCategory.DOCKER_BUILD_FAILURE,
        "default_context": DockerContext.DOCKER_IMAGE_BUILD,
        "patterns": [
            re.compile(r"returned a non-zero code:", re.IGNORECASE),
            re.compile(r"executor failed running", re.IGNORECASE),
            re.compile(r"build failed", re.IGNORECASE),
            re.compile(r"error building image", re.IGNORECASE),
        ]
    },
    # 12. Container startup failure
    {
        "type": ErrorCategory.CONTAINER_STARTUP_FAILURE,
        "default_context": DockerContext.CONTAINER_STARTUP,
        "patterns": [
            re.compile(r"container .* exited with code", re.IGNORECASE),
            re.compile(r"OCI runtime create failed", re.IGNORECASE),
            re.compile(r"executable file not found in \$PATH", re.IGNORECASE),
            re.compile(r"no such file or directory.*entrypoint", re.IGNORECASE),
            re.compile(r"error starting container process", re.IGNORECASE),
            re.compile(r"crashloopbackoff", re.IGNORECASE),
            re.compile(r"Application startup failed", re.IGNORECASE),
        ]
    },
]


def classify_error(log_text: str) -> Tuple[str, str]:
    """
    Classify the error type and infer the context from the log text.
    
    Returns:
      (error_type, context)
    """
    detected_type = ErrorCategory.UNKNOWN_DOCKER_ERROR
    detected_context = DockerContext.CONTAINER_RUNTIME

    # 1. Match against classification rules
    for rule in CLASSIFICATION_RULES:
        for pattern in rule["patterns"]:
            if pattern.search(log_text):
                detected_type = rule["type"]
                detected_context = rule["default_context"]
                break
        if detected_type != ErrorCategory.UNKNOWN_DOCKER_ERROR:
            break

    # 2. Refine context if build indicators are present for general errors (e.g. permission_error)
    if detected_type in [ErrorCategory.PERMISSION_ERROR, ErrorCategory.UNKNOWN_DOCKER_ERROR]:
        if re.search(r"(?:Step \d+/\d+|\bFROM\s+|\bRUN\s+|\bCOPY\s+|\bADD\s+)", log_text, re.IGNORECASE):
            detected_context = DockerContext.DOCKER_IMAGE_BUILD

    return detected_type, detected_context
