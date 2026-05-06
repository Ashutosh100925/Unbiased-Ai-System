from utils.nlp_parser import runFairAIAnalysis

def run_inference(domain, input_dict):
    """
    Deterministic scoring pipeline for FairAI decisions.
    Accepts free text (string) or structured dict, then returns score-based decisions.
    """
    text_blob = input_dict if isinstance(input_dict, str) else " ".join([str(v) for v in (input_dict or {}).values()])
    analysis = runFairAIAnalysis(text_blob, domain)
    print(f"[FairAI Debug] Domain={domain}")
    print(f"[FairAI Debug] Signals={analysis.get('signals')}")
    print(f"[FairAI Debug] Score={analysis.get('score')} Decision={analysis.get('decision')}")

    if not analysis["success"]:
        return {
            "decision": None,
            "confidence_score": None,
            "bias_detected": None,
            "bias_type": None,
            "fairness_score": None,
            "top_factors": [],
            "explanation": analysis["error"],
            "recommendation": None,
            "risk_level": None,
            "structured_features": input_dict if isinstance(input_dict, dict) else {"raw_text": input_dict},
            "score": None,
            "debug": None,
        }

    decision = analysis["decision"]
    score = analysis["score"]
    confidence_pct = analysis["confidence"]
    fairness_stable = analysis["fairness_check"]["counterfactual_same_outcome"]
    fairness_score = 96.0 if fairness_stable else 78.0

    if decision in ["REVIEW", "WAITLIST / REVIEW", "MANUAL REVIEW"]:
        risk_level = "Medium"
    elif decision in ["NOT SELECTED", "NOT ADMITTED", "REJECTED"]:
        risk_level = "High"
    else:
        risk_level = "Low"

    return {
        "decision": decision,
        "confidence_score": round(confidence_pct, 2),
        "bias_detected": not fairness_stable,
        "bias_type": "Counterfactual drift detected" if not fairness_stable else "None",
        "fairness_score": round(fairness_score, 2),
        "top_factors": analysis["top_factors"],
        "explanation": analysis["reason"],
        "recommendation": "Proceed with decision." if risk_level == "Low" else "Use manual review before finalizing." if risk_level == "Medium" else "Profile does not meet threshold; share improvement path.",
        "risk_level": risk_level,
        "structured_features": input_dict if isinstance(input_dict, dict) else {"raw_text": input_dict},
        "score": score,
        "debug": {
            "signals": analysis["signals"],
            "score": score,
            "decision": decision,
            "counterfactual": analysis["fairness_check"],
        },
    }

def run_whatif(domain, modified_features):
    return run_inference(domain, modified_features)
