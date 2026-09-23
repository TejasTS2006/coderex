"""
Comprehensive test suite for Docker Log Processing & Normalization (Member 1).
"""

import unittest
import json
from pathlib import Path

from log_processor import (
    DockerLogProcessor,
    DockerErrorRecord,
    ErrorCategory,
    DockerContext,
    strip_ansi_codes,
    preprocess_log,
)


class TestDockerLogProcessor(unittest.TestCase):
    """Test suite verifying all functional requirements of Member 1."""

    def test_database_connection_error_specification_example(self):
        """Verify Example from Section 5: Database Connection Error."""
        log_input = """Starting application...
Connecting to PostgreSQL...
psycopg2.OperationalError: connection refused
Application startup failed."""

        record = DockerLogProcessor.process(log_input)

        self.assertEqual(record.error_type, "database_connection_failure")
        self.assertEqual(record.service, "docker")
        self.assertEqual(record.context, "application startup")
        self.assertEqual(record.error_message, "connection refused")
        self.assertEqual(record.raw_log, "psycopg2.OperationalError: connection refused")

    def test_port_conflict_specification_example(self):
        """Verify Example from Section 6: Docker Port Conflict."""
        log_input = """Starting container my-app...
docker: Error response from daemon:
Bind for 0.0.0.0:8080 failed:
port is already allocated."""

        record = DockerLogProcessor.process(log_input)

        self.assertEqual(record.error_type, "port_conflict")
        self.assertEqual(record.service, "docker")
        self.assertEqual(record.context, "container startup")
        self.assertEqual(record.error_message, "port is already allocated")
        self.assertEqual(record.raw_log, "Bind for 0.0.0.0:8080 failed: port is already allocated")

    def test_image_pull_failure_specification_example(self):
        """Verify Example from Section 7: Image Pull Failure."""
        log_input = """Unable to find image 'my-app:latest' locally
docker: Error response from daemon:
pull access denied for my-app,
repository does not exist or may require authorization."""

        record = DockerLogProcessor.process(log_input)

        self.assertEqual(record.error_type, "image_pull_failure")
        self.assertEqual(record.service, "docker")
        self.assertEqual(record.context, "image pull")
        self.assertEqual(record.error_message, "pull access denied")
        self.assertEqual(
            record.raw_log,
            "pull access denied for my-app, repository does not exist or may require authorization"
        )

    def test_docker_build_dependency_failure_specification_example(self):
        """Verify Example from Section 8: Docker Build Failure (pip dependency)."""
        log_input = """Step 3/5 : RUN pip install -r requirements.txt
ERROR: Could not find a version that satisfies the requirement xyz-package
ERROR: No matching distribution found for xyz-package"""

        record = DockerLogProcessor.process(log_input)

        self.assertEqual(record.error_type, "dependency_installation_failure")
        self.assertEqual(record.service, "docker")
        self.assertEqual(record.context, "docker image build")
        self.assertEqual(record.error_message, "No matching distribution found for xyz-package")
        expected_raw_log = "ERROR: Could not find a version that satisfies the requirement xyz-package\nERROR: No matching distribution found for xyz-package"
        self.assertEqual(record.raw_log, expected_raw_log)

    def test_container_startup_failure(self):
        """Verify container startup failure with non-zero exit code or OCI error."""
        log_input = """docker: Error response from daemon: OCI runtime create failed: container_linux.go:380: starting container process caused: exec: "/app/entrypoint.sh": stat /app/entrypoint.sh: no such file or directory: unknown.
container web-service exited with code 127"""

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "container_startup_failure")
        self.assertEqual(record.context, "container startup")
        self.assertEqual(record.service, "docker")
        self.assertTrue(len(record.error_message) > 0)

    def test_dockerfile_syntax_error(self):
        """Verify Dockerfile parse and unknown instruction error."""
        log_input = """ERROR: failed to solve: Dockerfile parse error: unknown instruction: ENVIROMENT"""

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "dockerfile_error")
        self.assertEqual(record.context, "docker image build")
        self.assertEqual(record.service, "docker")
        self.assertIn("unknown instruction", record.error_message.lower())

    def test_permission_error(self):
        """Verify permission denied error detection."""
        log_input = """Step 4/5 : RUN touch /var/log/app.log
touch: cannot touch '/var/log/app.log': Permission denied
The command '/bin/sh -c touch /var/log/app.log' returned a non-zero code: 1"""

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "permission_error")
        self.assertEqual(record.service, "docker")
        self.assertIn("permission denied", record.error_message.lower())

    def test_container_not_found(self):
        """Verify container not found error."""
        log_input = "docker: Error response from daemon: No such container: my-missing-container"

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "container_not_found")
        self.assertEqual(record.service, "docker")
        self.assertIn("no such container", record.error_message.lower())

    def test_image_not_found(self):
        """Verify image not found error."""
        log_input = "docker: Error response from daemon: No such image: my-missing-image:v1"

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "image_not_found")
        self.assertEqual(record.service, "docker")
        self.assertIn("no such image", record.error_message.lower())

    def test_docker_daemon_error(self):
        """Verify Docker daemon offline or socket failure."""
        log_input = "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?"

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "docker_daemon_error")
        self.assertEqual(record.service, "docker")
        self.assertEqual(record.context, "docker daemon")

    def test_network_error(self):
        """Verify Docker network failure."""
        log_input = "docker: Error response from daemon: network my-bridge not found."

        record = DockerLogProcessor.process(log_input)
        self.assertEqual(record.error_type, "network_error")
        self.assertEqual(record.context, "network configuration")
        self.assertEqual(record.service, "docker")

    def test_ansi_color_stripping(self):
        """Verify ANSI terminal escape sequences are cleanly removed."""
        ansi_log = "\x1b[31mStarting container my-app...\x1b[0m\n\x1b[33mBind for 0.0.0.0:8080 failed: port is already allocated.\x1b[0m"
        stripped = strip_ansi_codes(ansi_log)
        self.assertNotIn("\x1b", stripped)

        record = DockerLogProcessor.process(ansi_log)
        self.assertEqual(record.error_type, "port_conflict")
        self.assertNotIn("\x1b", record.raw_log)

    def test_json_schema_compliance(self):
        """Verify strict schema compliance for output JSON."""
        log_input = "docker: Error response from daemon: Bind for 0.0.0.0:80 failed: port is already allocated."
        record = DockerLogProcessor.process(log_input)

        as_dict = record.to_dict()
        required_fields = ["error_message", "error_type", "service", "context", "raw_log"]
        for field in required_fields:
            self.assertIn(field, as_dict)
            self.assertIsInstance(as_dict[field], str)

        json_str = record.to_json()
        parsed = json.loads(json_str)
        self.assertEqual(parsed, as_dict)

    def test_empty_log_handling(self):
        """Verify processor handles empty or whitespace-only logs safely."""
        record = DockerLogProcessor.process("")
        self.assertEqual(record.error_type, "unknown_docker_error")
        self.assertEqual(record.service, "docker")

        record_spaces = DockerLogProcessor.process("   \n\t  ")
        self.assertEqual(record_spaces.error_type, "unknown_docker_error")


if __name__ == "__main__":
    unittest.main()
