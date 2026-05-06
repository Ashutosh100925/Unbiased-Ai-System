def generate_bias_report(model_type: str, features: dict, feature_importance: list, fairness_metrics: dict) -> dict:
    """
    Analyzes the outputs and inputs to generate a Hackathon-demo ready Bias Report.
    It looks for proxies in features and checks threshold bounds on fairness scores.
    """
    # Sensitive proxy indicators
    sensitive_keywords = ["age", "gender", "race", "zip", "zipcode", "marital", "dependents", "ethnicity"]
    
    detected_warnings = []
    
    # 1. Feature Importance Proxy Check
    for fi in feature_importance:
        feat_name = fi["feature"].lower()
        if any(sk in feat_name for sk in sensitive_keywords) and fi["importance"] > 0.15:
            detected_warnings.append(
                f"High reliance on potential proxy feature '{fi['feature']}' (Importance: {fi['importance']:.2f}). "
                f"This might introduce demographic bias."
            )
            
    # 2. Fairness Metric Industry Threshold Check (Using 80% rule)
    if fairness_metrics["disparate_impact"] < 0.8:
        detected_warnings.append(
            f"Disparate impact ({fairness_metrics['disparate_impact']}) is below the standard 80% threshold. "
            "The model may be causing adverse impact on protected groups."
        )
    if fairness_metrics["demographic_parity"] < 0.85:
        detected_warnings.append(
            f"Demographic parity is low ({fairness_metrics['demographic_parity']}). "
            "Selection rates between different groups are unbalanced."
        )
    
    # 3. Overall Fairness Score Logic
    overall_score = round((sum(fairness_metrics.values()) / len(fairness_metrics)) * 100)
    
    if len(detected_warnings) == 0:
        status_msg = f"The {model_type} pipeline appears robust with a strong fairness score of {overall_score}%. No immediate proxy biases detected."
    else:
        status_msg = f"Warning: The {model_type} pipeline flagged {len(detected_warnings)} potential bias issues. Manual review recommended. (Score: {overall_score}%)"

    return {
        "overall_score": overall_score,
        "warnings": detected_warnings,
        "report_summary": status_msg
    }
