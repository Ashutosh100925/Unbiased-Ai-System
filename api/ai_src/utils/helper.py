import yaml
from pathlib import Path
import json

def load_config(config_path="config/config.yaml"):
    """Loads configuration from a YAML file."""
    with open(config_path, "r") as file:
        return yaml.safe_load(file)

def save_json(data, filepath):
    """Saves dictionary data to a JSON file."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

def load_json(filepath):
    """Loads a JSON file into a dictionary."""
    with open(filepath, "r") as f:
        return json.load(f)
