import joblib
from pathlib import Path

def save_model(model, filepath):
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, filepath)

def load_model(filepath):
    return joblib.load(filepath)
