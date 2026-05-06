import pandas as pd
from bias_engine.bias_detector import BiasDetector
from bias_engine.bias_report import generate_bias_report
from utils.helper import load_config

def run_fairness_check(df, predictions, group_cols, target_col, model_name):
    """
    Evaluates fairness of predictions across multiple sensitive groups.
    """
    config = load_config()
    di_threshold = config['fairness']['disparate_impact_threshold']
    dp_threshold = config['fairness']['demographic_parity_threshold']

    detector = BiasDetector(di_threshold, dp_threshold)
    
    # We append predictions to the dataframe for evaluation
    eval_df = df.copy()
    eval_df[target_col] = predictions
    
    overall_report = {}
    is_biased_overall = False
    
    # For a real implementation, you need to define what the "privileged" group is.
    # Here we mock it by assuming the first unique value is privileged for demonstration.
    for col in group_cols:
        unique_vals = eval_df[col].dropna().unique()
        if len(unique_vals) >= 2:
            priv_val = unique_vals[0]
            unpriv_val = unique_vals[1]
            
            result = detector.detect_bias(eval_df, col, target_col, priv_val, unpriv_val)
            overall_report[col] = result
            if result['bias_detected']:
                is_biased_overall = True

    final_report = {
        "model": model_name,
        "bias_detected": is_biased_overall,
        "details": overall_report
    }
    
    generate_bias_report(final_report, f"data/audit_data/{model_name}_fairness_report.json")
    return final_report
