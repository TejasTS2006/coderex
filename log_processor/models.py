"""
Data models for the Docker Log Processing & Normalization module.
"""

from dataclasses import dataclass, asdict
import json
from typing import Dict, Any


@dataclass
class DockerErrorRecord:
    """
    Standardized structured representation of a Docker error.
    
    Fields:
      - error_message: Main error identified from the Docker log
      - error_type: Category assigned to the Docker error
      - service: Always identifies the service as "docker"
      - context: Stage where the error occurred
      - raw_log: Original relevant Docker error/log content
    """
    error_message: str
    error_type: str
    service: str = "docker"
    context: str = "unknown"
    raw_log: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert record to Python dictionary adhering strictly to the Member 1 schema."""
        return {
            "error_message": self.error_message,
            "error_type": self.error_type,
            "service": self.service,
            "context": self.context,
            "raw_log": self.raw_log
        }

    def to_json(self, indent: int = 2) -> str:
        """Serialize record to standardized JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
