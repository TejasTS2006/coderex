# Docker Deployment Troubleshooting Assistant

## 1. Overview & Architecture

### Module Flow

```text
Raw Docker Log
      │
      ▼
Log Preprocessing (preprocessor.py)
  • ANSI color & escape sequence removal
  • Formatting noise & trailing character cleanup
  • Candidate error segment extraction
      │
      ▼
Docker Error Detection & Classification (error_classifier.py)
  • Pattern matching across 12+ Docker error categories
  • Execution context detection (startup, build, pull, runtime, daemon)
      │
      ▼
Information Extraction & Normalization (normalizer.py)
  • Concise error message extraction (stripping boilerplate)
  • Raw error log snippet preservation
  • Schema normalization
      │
      ▼
Structured JSON (models.py, parser.py)
      │
      ▼
Downstream RAG & LLM Modules (Members 2 & 3)
```

---

## 2. Module Boundary

> [!IMPORTANT]
> **Member 1 Responsibility Boundary:**
> This module **only** extracts and structures information from raw logs. It identifies *what* error occurred, *what category* it belongs to, *where* it occurred, and preserves the relevant *raw log content*.
>
> It does **not** invent or generate troubleshooting recommendations, solutions, or probable causes. Those are handled downstream by Member 2 (RAG) and Member 3 (LLM).

```text
┌──────────────────────────────────────────────┐
│           MEMBER 1 (This Module)             │
│  Raw Docker Log                              │
│       ↓                                      │
│  What error occurred?                        │
│  What type of error is it?                   │
│  Where did it occur?                         │
│       ↓                                      │
│  Standardized JSON                           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│       MEMBERS 2 & 3 (Downstream Modules)     │
│  Standardized JSON                           │
│       ↓                                      │
│  Retrieve relevant knowledge (RAG)           │
│  Synthesize root cause & fixes (LLM)         │
│       ↓                                      │
│  Actionable Troubleshooting Steps            │
└──────────────────────────────────────────────┘
```

---

## 3. Standard Output Schema

Every processed log is normalized into the following JSON schema:

```json
{
  "error_message": "...",
  "error_type": "...",
  "service": "docker",
  "context": "...",
  "raw_log": "..."
}
```

### Field Descriptions

| Field | Type | Description |
| :--- | :--- | :--- |
| `error_message` | `string` | The concise, core error identified from the log (noise prefixes removed) |
| `error_type` | `string` | Normalized category assigned to the error (e.g. `port_conflict`) |
| `service` | `string` | Service identifier, always set to `"docker"` |
| `context` | `string` | Execution stage where the failure occurred (e.g. `container startup`) |
| `raw_log` | `string` | Original relevant Docker error snippet preserved verbatim |

---

## 4. Supported Error Categories & Contexts

### Error Categories (`error_type`)

* `port_conflict`: Port is already allocated or address in use
* `image_pull_failure`: Access denied, repository not found, authentication failure
* `dependency_installation_failure`: Pip/npm/yarn/go package resolution or download failures
* `dockerfile_error`: Syntax errors, unknown instructions, COPY/ADD file missing
* `container_startup_failure`: Container exited with non-zero exit code, OCI runtime failure
* `database_connection_failure`: Database refused connection during application boot
* `permission_error`: File or directory access denied / operation not permitted
* `container_not_found`: Referenced container name or ID does not exist
* `image_not_found`: Referenced image tag does not exist locally or remotely
* `docker_daemon_error`: Docker daemon socket closed, offline, or inaccessible
* `network_error`: User-defined network missing, IP collision, DNS resolution error
* `docker_build_failure`: Generic Docker build execution failure
* `unknown_docker_error`: Fallback for unrecognized error formats

### Contexts (`context`)

* `container startup`
* `docker image build`
* `image pull`
* `application startup`
* `container runtime`
* `network configuration`
* `docker daemon`

---

## 5. Directory Structure

```text
tcs/
├── README.md                           # Documentation and integration guide
├── log_processor/                      # Core module package
│   ├── __init__.py                     # Package exports
│   ├── __main__.py                     # Package CLI runner
│   ├── models.py                       # DockerErrorRecord dataclass & schema
│   ├── preprocessor.py                 # ANSI stripping & line cleaner
│   ├── error_classifier.py             # Error rules & context matching
│   ├── normalizer.py                   # Error message & raw_log extraction
│   └── parser.py                       # Orchestrator & CLI entrypoint
├── data/
│   └── sample_logs/                    # 12 real-world Docker error logs
│       ├── port_conflict.log
│       ├── database_connection_failure.log
│       ├── image_pull_failure.log
│       ├── dependency_failure.log
│       ├── container_failure.log
│       ├── build_failure.log
│       ├── dockerfile_error.log
│       ├── permission_error.log
│       ├── container_not_found.log
│       ├── image_not_found.log
│       ├── docker_daemon_error.log
│       └── network_error.log
├── output/
│   └── examples/                       # Processed JSON outputs
│       ├── port_conflict.json
│       ├── database_connection_failure.json
│       ├── image_pull_failure.json
│       ├── dependency_failure.json
│       └── ...
├── scripts/
│   └── generate_examples.py            # Batch processor for sample logs
└── tests/
    ├── __init__.py
    └── test_log_processor.py           # Unit and regression test suite
```

---

## 6. Installation & Requirements

* **Python Version:** Python 3.8+
* **Dependencies:** None! Built purely using the Python standard library (`re`, `json`, `dataclasses`, `argparse`, `pathlib`, `unittest`).

No `pip install` required.

---

## 7. Usage

### A. Python API

```python
from log_processor import DockerLogProcessor

# 1. Process from string
log_text = """
Starting container my-app...
docker: Error response from daemon:
Bind for 0.0.0.0:8080 failed:
port is already allocated.
"""

record = DockerLogProcessor.process(log_text)

# Access fields directly
print(record.error_type)     # 'port_conflict'
print(record.error_message)  # 'port is already allocated'
print(record.context)        # 'container startup'

# Export to dict or formatted JSON
record_dict = record.to_dict()
record_json = record.to_json(indent=2)
print(record_json)
```

```python
# 2. Process directly from a log file
record = DockerLogProcessor.process_file("data/sample_logs/image_pull_failure.log")
print(record.to_json())
```

### B. Command-Line Interface (CLI)

#### Process a log file:
```bash
python -m log_processor data/sample_logs/port_conflict.log
```

#### Read from standard input (pipeline support):
```bash
cat /var/log/docker_deploy.log | python -m log_processor
```

#### Save output directly to a JSON file:
```bash
python -m log_processor data/sample_logs/database_connection_failure.log -o output.json
```

---

## 8. Verification Examples

### Example 1 — Docker Port Conflict
**Input:**
```text
Starting container my-app...
docker: Error response from daemon:
Bind for 0.0.0.0:8080 failed:
port is already allocated.
```
**JSON Output:**
```json
{
  "error_message": "port is already allocated",
  "error_type": "port_conflict",
  "service": "docker",
  "context": "container startup",
  "raw_log": "Bind for 0.0.0.0:8080 failed: port is already allocated"
}
```

### Example 2 — Database Connection Failure
**Input:**
```text
Starting application...
Connecting to PostgreSQL...
psycopg2.OperationalError: connection refused
Application startup failed.
```
**JSON Output:**
```json
{
  "error_message": "connection refused",
  "error_type": "database_connection_failure",
  "service": "docker",
  "context": "application startup",
  "raw_log": "psycopg2.OperationalError: connection refused"
}
```

### Example 3 — Image Pull Failure
**Input:**
```text
Unable to find image 'my-app:latest' locally
docker: Error response from daemon:
pull access denied for my-app,
repository does not exist or may require authorization.
```
**JSON Output:**
```json
{
  "error_message": "pull access denied",
  "error_type": "image_pull_failure",
  "service": "docker",
  "context": "image pull",
  "raw_log": "pull access denied for my-app, repository does not exist or may require authorization"
}
```

### Example 4 — Dependency Installation Failure
**Input:**
```text
Step 3/5 : RUN pip install -r requirements.txt
ERROR: Could not find a version that satisfies the requirement xyz-package
ERROR: No matching distribution found for xyz-package
```
**JSON Output:**
```json
{
  "error_message": "No matching distribution found for xyz-package",
  "error_type": "dependency_installation_failure",
  "service": "docker",
  "context": "docker image build",
  "raw_log": "ERROR: Could not find a version that satisfies the requirement xyz-package\nERROR: No matching distribution found for xyz-package"
}
```

---

## 9. Running Tests & Generating Examples

### Run the test suite:
```bash
python -m unittest discover -s tests -v
```

### Batch regenerate all JSON examples:
```bash
python scripts/generate_examples.py
```

---

## 10. Downstream Integration Guide

For team members implementing the RAG retrieval and LLM agents:

1. **Member 2 (Docker RAG)**:
   - Query embedding formulation: Use `f"{record['error_type']} {record['error_message']} in {record['context']}"` as the retrieval query against your vector database.
   - Filtering: Filter knowledge chunks using `metadata={"error_type": record["error_type"], "service": "docker"}`.

2. **Member 3 (AI Agent & LLM)**:
   - Prompt input: Pass the structured dictionary directly into the LLM system prompt:
     - `Context`: `{record['context']}`
     - `Error Type`: `{record['error_type']}`
     - `Error Message`: `{record['error_message']}`
     - `Evidence / Raw Log`: `{record['raw_log']}`
