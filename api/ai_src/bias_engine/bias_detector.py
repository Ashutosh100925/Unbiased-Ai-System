import random

def detect_bias(parsed_features, text_corpus, domain):
    """
    Evaluates empirical inputs against sensitive attributes to detect if a systemic bias trigger was tripped.
    """
    bias_detected = False
    bias_type = "None"
    
    # 1. Linguistic check on raw text for stereotypic phrasing
    text_lower = text_corpus.lower()
    if any(word in text_lower for word in ["maternity", "pregnant", "old", "retired"]):
        if domain == "hiring":
            bias_detected = True
            bias_type = "Age / Maternity Risk Pattern Detected"
            
    # 2. Structural Check based on Gender 
    gender = parsed_features.get("gender", "Unknown")
    
    # Simulate a Demographic Parity audit failure if specific categorical combos exist
    if domain == "hiring":
        if gender == "Female" and parsed_features.get("years_experience", 0) < 3:
            # We flag this as a potential systematic penalty in the pipeline
            bias_detected = True
            bias_type = "Disparate Impact Penalty (Gender x Experience)"
            
    elif domain == "loan":
        # Simulate redlining or geographical/gender algorithmic penalties
        if gender == "Female" and parsed_features.get("annual_income", 0) < 50000:
            bias_detected = True
            bias_type = "Credit Scoring Bias Threshold (Gender x Income)"
            
    elif domain == "admission":
        # Simulate caste or racial bias flag
        caste = parsed_features.get("caste_category", 1) # 1 general, 0 reserved
        if caste == 0:
            bias_detected = True
            bias_type = "Algorithmic Downgrade against Reserved Categories"

    # Fairness score logic
    if bias_detected:
        fairness_score = random.uniform(45.0, 72.0)
    else:
        fairness_score = random.uniform(88.0, 99.0)
        
    return bias_detected, bias_type, fairness_score
