import pandas as pd
import numpy as np

def calculate_disparate_impact(df, group_col, target_col, privileged_val, unprivileged_val):
    """
    Calculates Disparate Impact (DI) = P(Y=1 | Unprivileged) / P(Y=1 | Privileged)
    """
    priv_df = df[df[group_col] == privileged_val]
    unpriv_df = df[df[group_col] == unprivileged_val]
    
    if len(priv_df) == 0 or len(unpriv_df) == 0:
        return 1.0 # Cannot calculate

    prob_priv = priv_df[target_col].mean()
    prob_unpriv = unpriv_df[target_col].mean()
    
    if prob_priv == 0:
        return 1.0
        
    return prob_unpriv / prob_priv

def calculate_demographic_parity_diff(df, group_col, target_col, privileged_val, unprivileged_val):
    """
    Calculates Demographic Parity Difference = P(Y=1 | Privileged) - P(Y=1 | Unprivileged)
    """
    priv_df = df[df[group_col] == privileged_val]
    unpriv_df = df[df[group_col] == unprivileged_val]
    
    if len(priv_df) == 0 or len(unpriv_df) == 0:
        return 0.0
        
    prob_priv = priv_df[target_col].mean()
    prob_unpriv = unpriv_df[target_col].mean()
    
    return prob_priv - prob_unpriv

def evaluate_all_metrics(df, group_col, target_col, privileged_val, unprivileged_val):
    """Returns a dictionary of all fairness metrics."""
    return {
        "disparate_impact": calculate_disparate_impact(df, group_col, target_col, privileged_val, unprivileged_val),
        "demographic_parity_diff": calculate_demographic_parity_diff(df, group_col, target_col, privileged_val, unprivileged_val)
    }
