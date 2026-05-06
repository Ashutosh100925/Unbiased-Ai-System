def generate_sensitivity_suggestions(clean_features: dict, override: bool, risk: str, ml_prob: float, threshold: float = 0.5) -> list:
    """
    Generates rule-based and distance-based sensitivity suggestions for the UI.
    """
    suggestions = []
    exp = clean_features.get("experience", 0)
    perf = clean_features.get("performance", 0)
    comm = clean_features.get("communication", 0)
    tech = clean_features.get("technical_score", 0)
    
    # Check what changes would flip a rejection
    if risk == "High" or override:
        if exp < 2:
            suggestions.append(f"Increasing experience from {exp} -> 2+ years may change decision to Selected")
        if perf == 0:
            suggestions.append("Higher performance rating may increase selection probability")
        if comm == 0:
            suggestions.append("Improving communication score could positively impact outcome")
        if tech < 4:
            suggestions.append("Significant technical upskilling is required to meet algorithmic bounds")
            
    # Soft ML proximity logic
    if risk == "Medium" or (not override and ml_prob < threshold and ml_prob > threshold - 0.2):
        if tech < 7:
            suggestions.append("Boosting technical proficiency scores will strongly shift outcome density")
        suggestions.append("Candidate is near the selection boundary; minor aggregate improvements could alter the decision")
        
    return suggestions
