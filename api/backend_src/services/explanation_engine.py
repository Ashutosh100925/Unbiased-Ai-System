def generate_explanation(
    model_type: str, 
    prediction: str, 
    confidence: float, 
    feature_importance: list,
    override: bool,
    positive_factors: list,
    negative_factors: list,
    original_ml_was_positive: bool
) -> dict:
    """
    Generates human-readable explanations, top driving factors,
    sensitive recommendations, and clear rule-based logic strings.
    """
    formatted_confidence = f"{int(round(confidence * 100))}%"
    
    top_factors_str = ', '.join([f["feature"].replace("_", " ").title() for f in feature_importance[:3]])
    
    # 1. Base Logic String Builder
    direction = "positive" if prediction in ["Hire", "Approved", "Admitted"] else "restrictive"
    explanation_text = ""
    
    if override:
        # Step 8 Requirement: Human readable explicit rule override text
        was_positive = "selected" if original_ml_was_positive else "rejected"
        now_positive = "selected" if direction == "positive" else "rejected"
        
        # Format the reasons nicely
        factors = positive_factors if direction == "positive" else negative_factors
        # Filter out overly long rule strings for the primary sentence, extract the core reason
        clean_reasons = []
        for f in factors:
            if ":" in f:
                clean_reasons.append(f.split(":")[1].strip())
            else:
                clean_reasons.append(f)
                
        reason_str = ", ".join(clean_reasons) if clean_reasons else "critical boundary conditions"
        
        explanation_text = f"The candidate was initially predicted as {was_positive} by the ML model. However, rule-based validation detected {reason_str}, leading to a corrected {now_positive} decision."
    else:
        # Standard ML inference explanation
        explanation_text = f"The {model_type} AI reached a {direction} decision ('{prediction}') natively with {formatted_confidence} certainty, without triggering any rule overrides."
        explanation_text += f" The primary historical parameters driving this algorithmic outcome were: {top_factors_str}."

    # 2. Recommendation Engine
    recommendation = ""
    if direction == "positive":
        if override:
            recommendation = "Candidate passes based on an exceptional hybrid profile despite initial ML uncertainty. Clear to proceed."
        elif confidence > 0.8:
            recommendation = f"High-confidence match detected. Clear to proceed with standard {prediction.lower()} protocol."
        else:
            recommendation = f"Marginal match. Advise secondary manual review or human validation before finalizing."
    else:
        if override:
            recommendation = "Candidate explicitly rejected due to failing critical threshold rules regardless of demographic alignment."
        else:
            recommendation = "Low-confidence rejection detected. Candidate is on the borderline; consider conditional pipelines or structured interview."

    # 3. Decision Sensitivity Engine (Step 9) 
    sensitivity = []
    if "Low Experience" in negative_factors:
        sensitivity.append("Increasing experience to 2+ years will fundamentally change predictive models.")
    if "Poor Communication" in negative_factors:
        sensitivity.append("Improving overall communication score can positively impact this outcome.")
    if "Weak Technical Skills" in negative_factors:
        sensitivity.append("Technical competency is severely sub-range. Significant upskilling required for viability.")
    
    if not sensitivity and direction == "restrictive":
        sensitivity.append("Overall feature density falls below algorithmic bounds. Aggregated improvements needed.")
    elif not sensitivity and direction == "positive":
        sensitivity.append("Candidate demonstrates strong baseline alignment; no immediate critical corrective actions found.")
        
    return {
        "formatted_confidence": formatted_confidence,
        "explanation_text": explanation_text,
        "top_factors": positive_factors if direction == "positive" and positive_factors else [f["feature"].replace("_", " ").title() for f in feature_importance[:3]],
        "recommendation": recommendation,
        "decision_sensitivity": sensitivity
    }
