import json
from pathlib import Path
from utils.helper import save_json

def generate_bias_report(bias_results, filepath="data/audit_data/fairness_report.json"):
    """
    Takes dictionary output from BiasDetector and saves a structured JSON report.
    """
    report = {
        "status": "Biased" if bias_results.get("bias_detected") else "Fair",
        "details": bias_results
    }
    save_json(report, filepath)
    return report
