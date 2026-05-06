import random

def calculate_fairness(model_type: str, prediction_prob: float) -> dict:
    """
    Hackathon-demo logic for fairness metrics.
    In a real-world scenario, this would evaluate aggregate historical predictions
    vs ground truth across protected classes (e.g., via Fairlearn or AIF360).
    Here, we provide dynamic but plausible metrics based on the model type.
    """
    base_metrics = {
        "hiring": {"demographic_parity": 0.88, "equal_opportunity": 0.92, "disparate_impact": 0.85},
        "loan": {"demographic_parity": 0.95, "equal_opportunity": 0.90, "disparate_impact": 0.94},
        "admission": {"demographic_parity": 0.82, "equal_opportunity": 0.88, "disparate_impact": 0.79}
    }
    
    metrics = base_metrics.get(model_type, {"demographic_parity": 0.9, "equal_opportunity": 0.9, "disparate_impact": 0.9})
    
    # Introduce minor dynamic fluctuation based on the specific prediction to make 
    # the demo UI feel alive and responsive.
    fluctuation = (prediction_prob - 0.5) * 0.05
    
    return {
        "demographic_parity": round(min(1.0, max(0.0, metrics["demographic_parity"] + fluctuation)), 2),
        "equal_opportunity": round(min(1.0, max(0.0, metrics["equal_opportunity"] + fluctuation)), 2),
        "disparate_impact": round(min(1.0, max(0.0, metrics["disparate_impact"] - fluctuation)), 2)
    }
