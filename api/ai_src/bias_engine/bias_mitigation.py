import numpy as np

def apply_threshold_adjustment(y_probs, group_col, unprivileged_val, priv_thresh=0.5, unpriv_thresh=0.45):
    """
    Simple mitigation technique: Adjust decision threshold depending on group.
    """
    predictions = []
    for prob, group in zip(y_probs, group_col):
        if group == unprivileged_val:
            predictions.append(1 if prob >= unpriv_thresh else 0)
        else:
            predictions.append(1 if prob >= priv_thresh else 0)
    return np.array(predictions)
