import re

MIN_TEXT_LENGTH = 25
MIN_WORDS = 8

DECISION_SIGNALS = {
    "admission": {
        "academics": [r"\bgpa\b", r"\bgrade", r"\bmarks?\b", r"\bacademic\b", r"\bperformance\b", r"\bhigh school\b"],
        "skills_preparation": [r"\bskills?\b", r"\bpreparation\b", r"\bprepared\b", r"\bbachelor", r"\bfoundation\b"],
        "extracurricular_projects": [r"\brobotics\b", r"\bproject", r"\bextracurricular\b", r"\bcompetition\b", r"\bclub\b", r"\bvolunteer\b"],
        "communication": [r"\bcommunication\b", r"\bpresentation\b", r"\bspeaking\b"],
        "entrance_score": [r"\bentrance\b", r"\bsat\b", r"\bact\b", r"\bjee\b", r"\bneet\b", r"\bscore\b"],
        "achievements": [r"\bachievement\b", r"\baward\b", r"\bhonors?\b", r"\btop\b", r"\bexceeded\b", r"\bmedal\b"],
    },
    "hiring": {
        "experience": [r"\bexperience\b", r"\byears?\b", r"\bmonths?\b", r"\bintern(ship)?\b", r"\bwork(ed)?\b"],
        "skills": [r"\bpython\b", r"\bjava\b", r"\breact\b", r"\bnode\b", r"\bsql\b", r"\bskills?\b", r"\btechnical\b"],
        "projects": [r"\bproject", r"\bportfolio\b", r"\bbuilt\b", r"\bdeployed\b"],
        "education": [r"\bbachelor\b", r"\bmaster\b", r"\bdegree\b", r"\bbtech\b", r"\bbsc\b", r"\bmsc\b"],
        "technical_score": [r"\btechnical score\b", r"\bcoding score\b", r"\bassessment\b", r"\btest score\b"],
        "communication_score": [r"\bcommunication\b", r"\binterview\b", r"\bspoken\b", r"\bsoft skills?\b"],
        "previous_work": [r"\bcompany\b", r"\bemployer\b", r"\bwork history\b", r"\bprevious work\b", r"\binternship\b"],
    },
    "loan": {
        "income": [r"\bincome\b", r"\bsalary\b", r"\bannual\b", r"\bmonthly\b", r"\brevenue\b"],
        "credit_score": [r"\bcredit score\b", r"\bcredit\b", r"\bfico\b", r"\bcibil\b"],
        "loan_amount": [r"\bloan amount\b", r"\bamount\b", r"\bprincipal\b", r"\bmortgage\b"],
        "employment_status": [r"\bemployed\b", r"\bemployment\b", r"\bjob\b", r"\bbusiness\b", r"\bself-employed\b"],
        "repayment_history": [r"\brepayment\b", r"\bpayment history\b", r"\bon-time\b", r"\bdefault\b"],
        "debt": [r"\bdebt\b", r"\bliabilit", r"\bdti\b", r"\bdebt[- ]to[- ]income\b"],
        "assets": [r"\bassets?\b", r"\bcollateral\b", r"\bproperty\b", r"\bsavings?\b", r"\binvestment\b"],
    },
}

NOISE_PATTERNS = [
    r"^[a-zA-Z]{1,10}$",
    r"^(hello|hi|student|candidate|abc|test)$",
]

def extractSignals(text, decisionType):
    """Extract semantic signal buckets present in input text."""
    domain = (decisionType or "").strip().lower()
    text_lower = (text or "").lower().strip()
    buckets = DECISION_SIGNALS.get(domain, {})
    found = []
    for bucket, patterns in buckets.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            found.append(bucket)
    return found

def validateInput(text, decisionType):
    """Validate if free-text input is meaningful and relevant for the selected decision type."""
    raw = (text or "").strip()
    if not raw:
        return {"is_valid": False, "reason": "empty", "signals": [], "signal_count": 0}

    lower = raw.lower()
    words = re.findall(r"[a-zA-Z0-9]+", lower)
    unique_words = set(words)

    if len(raw) < MIN_TEXT_LENGTH:
        return {"is_valid": False, "reason": "too_short", "signals": [], "signal_count": 0}
    if len(words) < MIN_WORDS:
        return {"is_valid": False, "reason": "too_few_words", "signals": [], "signal_count": 0}
    if len(unique_words) < max(5, len(words) // 3):
        return {"is_valid": False, "reason": "low_information_density", "signals": [], "signal_count": 0}
    if any(re.fullmatch(pattern, lower) for pattern in NOISE_PATTERNS):
        return {"is_valid": False, "reason": "random_or_placeholder", "signals": [], "signal_count": 0}

    signals = extractSignals(raw, decisionType)
    signal_count = len(signals)
    if signal_count < 3:
        return {"is_valid": False, "reason": "insufficient_domain_signals", "signals": signals, "signal_count": signal_count}

    return {"is_valid": True, "reason": "ok", "signals": signals, "signal_count": signal_count}

def runAnalysisOnlyIfValid(text, decisionType, analyzer_fn):
    """
    Backend guardrail wrapper:
    run analysis only when validation succeeds.
    """
    validation = validateInput(text, decisionType)
    if not validation["is_valid"]:
        raise ValueError("invalid_input")
    return analyzer_fn()

def parse_text_to_features(text, domain):
    """
    Simulates extracting structured tabular features from a free-text document.
    Outputs strict numeric features matching the trained model schema.
    """
    text_lower = text.lower()
    features = {}
    
    if domain == "hiring":
        features["education_level"] = 2 if "master" in text_lower or "ms" in text_lower or "phd" in text_lower else 1
        exp_match = re.search(r'(\d+)\+?\s*years?', text_lower)
        if exp_match:
            features["years_experience"] = int(exp_match.group(1))
        else:
            features["years_experience"] = 5 if "senior" in text_lower else 2
        features["technical_score"] = min(100, 50 + text_lower.count("python") * 10 + text_lower.count("java") * 10)
        features["communication_score"] = 85
        features["city_tier"] = 1
        # Preserved for bias engine, dropped dynamically during predict via columns matching
        features["gender"] = "Female" if "she" in text_lower or "her" in text_lower else "Male"
        
    elif domain == "loan":
        features["employment_type"] = 1 if any(kw in text_lower for kw in ["salary", "salaried", "stable", "employed", "job"]) else 0
        features["annual_income"] = 85000 if any(kw in text_lower for kw in ["manager", "senior", "director", "high", "excellent", "strong"]) else 45000
        score_match = re.search(r'(?:credit score|credit)[^\d]*(\d{3})', text_lower)
        features["credit_score"] = int(score_match.group(1)) if score_match else (750 if "excellent" in text_lower or "strong" in text_lower else 680)
        features["debt_to_income"] = 0.15 if "low debt" in text_lower or "excellent" in text_lower else 0.3
        features["loan_amount"] = 250000
        features["gender"] = "Female" if "she" in text_lower or "her" in text_lower else "Male"
        
    elif domain == "admission":
        features["gpa"] = 3.8 if any(kw in text_lower for kw in ["valedictorian", "honors", "exceeded", "excellent", "strong", "top"]) else 3.2
        features["sat_score"] = 1450 if any(kw in text_lower for kw in ["honors", "exceeded", "excellent", "strong", "top"]) else 1100
        features["extracurricular_score"] = 90 if any(kw in text_lower for kw in ["captain", "volunteer", "robotics", "club", "president", "experience"]) else 50
        features["caste_category"] = 1 if "general" in text_lower else 0
        features["gender"] = "Female" if "she" in text_lower or "her" in text_lower else "Male"
        
    return features


# ------------------------------------------------------------------
# NEW RULE-BASED FAIR ANALYSIS ENGINE
# ------------------------------------------------------------------

DECISION_CONFIG = {
    "admission": {
        "label_positive": "ADMITTED",
        "label_review": "WAITLIST / REVIEW",
        "label_negative": "NOT ADMITTED",
        "weights": {
            "academics": 30,
            "projects": 25,
            "achievements": 20,
            "communication": 15,
            "preparation": 10,
        },
        "keywords": {
            "academics": {
                "positive": [r"\b9\d%\b", r"\b9\.?\d?\s*gpa\b", r"\bexcellent\b", r"\bstrong\b", r"\bhigh\b", r"\btop\b", r"\b90%\b", r"\b95%\b"],
                "negative": [r"\b55%\b", r"\blow marks?\b", r"\bweak academic", r"\bpoor academic", r"\bbasic\b"],
            },
            "projects": {
                "positive": [r"\bprojects?\b", r"\brobotics\b", r"\btechnical work\b", r"\bai\b", r"\bpython\b", r"\bmultiple projects\b"],
                "negative": [r"\bno project", r"\blimited project", r"\bno experience\b"],
            },
            "achievements": {
                "positive": [r"\bhackathon", r"\bnational-?level\b", r"\bstate-?level\b", r"\bcompetition", r"\baward", r"\bachievement"],
                "negative": [r"\bno achievement", r"\bno competition", r"\bnone\b"],
            },
            "communication": {
                "positive": [r"\bcommunication\b", r"\bleadership\b", r"\bstrong communication\b", r"\bexcellent communication\b"],
                "negative": [r"\bpoor communication\b", r"\bweak communication\b"],
            },
            "preparation": {
                "positive": [r"\bentrance\b", r"\bprepared\b", r"\bpreparation\b", r"\bhigh score\b"],
                "negative": [r"\bunprepared\b", r"\blow entrance\b", r"\bpoor preparation\b"],
            },
        },
    },
    "hiring": {
        "label_positive": "SELECTED",
        "label_review": "REVIEW",
        "label_negative": "NOT SELECTED",
        "weights": {
            "experience": 25,
            "skills": 30,
            "projects": 20,
            "communication": 15,
            "education": 10,
        },
        "keywords": {
            "experience": {
                "positive": [r"\bexperience\b", r"\binternship\b", r"\b\d+\s*years?\b", r"\bmultiple years\b"],
                "negative": [r"\bno experience\b", r"\blimited experience\b"],
            },
            "skills": {
                "positive": [r"\badvanced\b", r"\bstrong\b", r"\bexcellent\b", r"\bpython\b", r"\bjava\b", r"\breact\b", r"\bnode\b", r"\bsql\b", r"\btechnical\b"],
                "negative": [r"\bbasic\b", r"\bweak\b", r"\bpoor\b", r"\blimited skills?\b"],
            },
            "projects": {
                "positive": [r"\bprojects?\b", r"\bmultiple projects?\b", r"\bbuilt\b", r"\bdeployed\b"],
                "negative": [r"\bno project", r"\blimited projects?\b"],
            },
            "communication": {
                "positive": [r"\bcommunication\b", r"\bleadership\b", r"\bstrong communication\b"],
                "negative": [r"\bpoor communication\b", r"\bweak communication\b"],
            },
            "education": {
                "positive": [r"\bcertification", r"\bdegree\b", r"\bbachelor\b", r"\bmaster\b"],
                "negative": [r"\bno certification\b", r"\bno degree\b"],
            },
        },
    },
    "loan": {
        "label_positive": "APPROVED",
        "label_review": "MANUAL REVIEW",
        "label_negative": "REJECTED",
        "weights": {
            "credit_score": 35,
            "income_stability": 25,
            "repayment_history": 20,
            "debt_level": 10,
            "affordability": 10,
        },
        "keywords": {
            "credit_score": {
                "positive": [r"\bcredit score\s*7[3-9]\d\b", r"\b750\b", r"\bexcellent credit\b", r"\bgood credit\b"],
                "negative": [r"\blow credit\b", r"\bpoor credit\b", r"\bcredit score\s*[4-5]\d\d\b"],
            },
            "income_stability": {
                "positive": [r"\bstable income\b", r"\bsteady income\b", r"\bsalaried\b", r"\bpermanent job\b", r"\bhigh income\b"],
                "negative": [r"\bunstable income\b", r"\birregular income\b", r"\bunemployed\b", r"\blow income\b", r"\bno stable job\b", r"\bno job\b"],
            },
            "repayment_history": {
                "positive": [r"\bgood repayment\b", r"\bon-?time\b", r"\bclean repayment\b"],
                "negative": [r"\bpoor repayment\b", r"\bdefault\b", r"\blate payment\b", r"\bdefaulted\b", r"\bpayment failure\b"],
            },
            "debt_level": {
                "positive": [r"\blow debt\b", r"\blow dti\b", r"\bmanageable debt\b", r"\bno loans\b"],
                "negative": [r"\bhigh debt\b", r"\bhigh dti\b", r"\bheavy liabilities?\b", r"\boutstanding loans?\b", r"\bmultiple loans\b", r"\bdebt\b"],
            },
            "affordability": {
                "positive": [r"\baffordable\b", r"\bwithin budget\b", r"\breasonable loan amount\b"],
                "negative": [r"\bunaffordable\b", r"\btoo high loan amount\b", r"\boverstretched\b"],
            },
        },
    },
}

SENSITIVE_PATTERNS = [
    r"\bhe\b", r"\bshe\b", r"\bhim\b", r"\bher\b", r"\bhis\b",
    r"\bmale\b", r"\bfemale\b", r"\bmuslim\b", r"\bhindu\b", r"\bchristian\b",
    r"\bcaste\b", r"\breligion\b", r"\blocation\b", r"\bcity\b", r"\bstate\b",
]

NAME_PATTERN = r"\b[A-Z][a-z]{2,}\b"


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip()).lower()


def _normalize_domain(domain_str: str) -> str:
    d = (domain_str or "").strip().lower().replace("_", " ")
    if "hiring" in d: return "hiring"
    if "loan" in d: return "loan"
    if "admission" in d or "college" in d: return "admission"
    return d

def extractSignals(text, decisionType):
    normalized_domain = _normalize_domain(decisionType)
    config = DECISION_CONFIG.get(normalized_domain)
    if not config:
        return {"positive": {}, "negative": {}, "summary": {"positive_count": 0, "negative_count": 0}}

    text_lower = _normalize_text(text)
    positive_hits = {}
    negative_hits = {}
    total_pos = 0
    total_neg = 0

    for category, rules in config["keywords"].items():
        pos = [p for p in rules["positive"] if re.search(p, text_lower)]
        neg = [n for n in rules["negative"] if re.search(n, text_lower)]
        positive_hits[category] = pos
        negative_hits[category] = neg
        total_pos += len(pos)
        total_neg += len(neg)

    return {
        "positive": positive_hits,
        "negative": negative_hits,
        "summary": {"positive_count": total_pos, "negative_count": total_neg},
    }


def validateInput(text, decisionType):
    raw = (text or "").strip()
    if not raw:
        return {"is_valid": False, "reason": "empty", "signals": [], "signal_count": 0}

    words = re.findall(r"[a-zA-Z0-9%]+", raw)
    unique_words = {w.lower() for w in words}

    if len(raw) < MIN_TEXT_LENGTH:
        return {"is_valid": False, "reason": "too_short", "signals": [], "signal_count": 0}
    if len(words) < MIN_WORDS:
        return {"is_valid": False, "reason": "too_few_words", "signals": [], "signal_count": 0}
    if len(unique_words) < max(5, len(words) // 3):
        return {"is_valid": False, "reason": "low_information_density", "signals": [], "signal_count": 0}

    signals = extractSignals(raw, decisionType)
    hit_categories = [
        key for key in signals["positive"].keys()
        if signals["positive"][key] or signals["negative"][key]
    ]
    if len(hit_categories) < 2:
        return {
            "is_valid": False,
            "reason": "insufficient_domain_signals",
            "signals": hit_categories,
            "signal_count": len(hit_categories),
        }

    return {"is_valid": True, "reason": "ok", "signals": hit_categories, "signal_count": len(hit_categories)}


def calculateScore(signals, decisionType):
    normalized_domain = _normalize_domain(decisionType)
    config = DECISION_CONFIG.get(normalized_domain)
    if not config:
        return 0, []

    score = 0.0
    factors = []
    for category, weight in config["weights"].items():
        pos_count = len(signals["positive"].get(category, []))
        neg_count = len(signals["negative"].get(category, []))

        category_strength = 0.42 + (0.33 * pos_count) - (0.28 * neg_count)
        category_strength = max(0.0, min(1.0, category_strength))
        points = round(weight * category_strength, 2)
        score += points

        factors.append({
            "feature": category.replace("_", " ").title(),
            "attribution": round(points, 2),
            "is_positive": points >= (weight * 0.5),
        })

    factors = sorted(factors, key=lambda item: item["attribution"], reverse=True)
    return int(round(max(0.0, min(100.0, score)))), factors


def makeDecision(score, decisionType):
    normalized_domain = _normalize_domain(decisionType)
    config = DECISION_CONFIG.get(normalized_domain)
    if not config:
        return None

    if score >= 70:
        return config["label_positive"]
    if 55 <= score <= 69:
        return config["label_review"]
    return config["label_negative"]


def calculateConfidence(signals, score):
    pos = signals["summary"]["positive_count"]
    neg = signals["summary"]["negative_count"]
    total = max(1, pos + neg)
    strength = max(0.0, min(1.0, (pos - neg + total) / (2 * total)))
    completeness = len([k for k in signals["positive"] if signals["positive"][k] or signals["negative"][k]]) / max(1, len(signals["positive"]))
    margin = min(abs(score - 70), abs(score - 55)) / 45.0

    confidence = 55 + (completeness * 20) + (strength * 15) + (margin * 12)
    return int(round(max(45, min(96, confidence))))


def _neutralize_sensitive_tokens(text: str) -> str:
    scrubbed = text
    for pattern in SENSITIVE_PATTERNS:
        scrubbed = re.sub(pattern, " ", scrubbed, flags=re.IGNORECASE)
    scrubbed = re.sub(NAME_PATTERN, "Candidate", scrubbed)
    return re.sub(r"\s+", " ", scrubbed).strip()


def runFairAIAnalysis(text, decisionType):
    validation = validateInput(text, decisionType)
    if not validation["is_valid"]:
        return {
            "success": False,
            "error": "Invalid input: Please provide complete profile details relevant to the selected decision type.",
            "decision": None,
            "score": None,
            "confidence": None,
            "signals": None,
            "reason": None,
            "top_factors": [],
        }

    signals = extractSignals(text, decisionType)
    score, factors = calculateScore(signals, decisionType)
    decision = makeDecision(score, decisionType)
    confidence = calculateConfidence(signals, score)

    neutralized_text = _neutralize_sensitive_tokens(text)
    cf_signals = extractSignals(neutralized_text, decisionType)
    cf_score, _ = calculateScore(cf_signals, decisionType)
    cf_decision = makeDecision(cf_score, decisionType)
    fairness_stable = (decision == cf_decision)
    if not fairness_stable:
        confidence = max(45, confidence - 8)

    positive_cats = [k for k, v in signals["positive"].items() if v]
    negative_cats = [k for k, v in signals["negative"].items() if v]
    reason_bits = []
    if positive_cats:
        reason_bits.append("Strong signals in " + ", ".join([c.replace("_", " ") for c in positive_cats[:3]]))
    if negative_cats:
        reason_bits.append("Weaknesses detected in " + ", ".join([c.replace("_", " ") for c in negative_cats[:3]]))
    if not reason_bits:
        reason_bits.append("Decision derived from balanced profile scoring.")

    return {
        "success": True,
        "error": None,
        "decision": decision,
        "score": score,
        "confidence": confidence,
        "signals": signals,
        "reason": ". ".join(reason_bits),
        "top_factors": factors[:5],
        "fairness_check": {
            "counterfactual_same_outcome": fairness_stable,
            "counterfactual_score": cf_score,
            "counterfactual_decision": cf_decision,
        },
    }
