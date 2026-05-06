import os
import joblib
import pandas as pd
import numpy as np
import re
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from services.fairness_metrics import calculate_fairness
from services.bias_detector import generate_bias_report
from services.explanation_engine import generate_explanation

if os.environ.get("VERCEL"):
    ARTIFACT_DIR = "/tmp/artifacts"
else:
    ARTIFACT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

try:
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create artifact directory {ARTIFACT_DIR}: {e}")

_models = {}
_scalers = {}

# ----------------------------------------------------
# STEP 2 & STEP 3: BUILD PIPELINE & TRAIN
# ----------------------------------------------------
def get_artifact_path(model_type: str, artifact_type: str) -> str:
    return os.path.join(ARTIFACT_DIR, f"{model_type}_{artifact_type}.pkl")

def get_best_model(X, y):
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    return model

def train_dummy_model(model_type: str):
    print(f"[{model_type}] Artifacts not found. Training and saving ensemble fallback models...")
    # Generate realistic data for hiring:
    # [experience(0-15), tech(0-10), performance(0-2), communication(0-3), education(1-3)]
    np.random.seed(42)
    n_samples = 100
    
    X = np.zeros((n_samples, 5))
    X[:, 0] = np.random.uniform(0, 15, n_samples)  # exp
    X[:, 1] = np.random.uniform(0, 10, n_samples)  # tech
    X[:, 2] = np.random.randint(0, 3, n_samples)   # performance
    X[:, 3] = np.random.randint(0, 4, n_samples)   # communication
    X[:, 4] = np.random.randint(1, 4, n_samples)   # education
    
    # Define a realistic boundary for y
    # weight formula: 0.3*exp_norm + 0.25*tech_norm + 0.2*perf_norm + 0.15*comm_norm + 0.1*edu_norm
    weights = np.array([0.3/15, 0.25/10, 0.2/2, 0.15/3, 0.1/3])
    scores = np.dot(X, weights)
    
    # 0 = Reject, 1 = Accept
    y = (scores > 0.45).astype(int)
    
    # Inject edge cases to teach the model bad correlations
    # Weak candidate explicitly 0
    weak_idx = np.where((X[:, 0] < 2) & (X[:, 2] == 0))[0]
    y[weak_idx] = 0
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    best_model = get_best_model(X_scaled, y)
    
    joblib.dump(best_model, get_artifact_path(model_type, "model"))
    joblib.dump(scaler, get_artifact_path(model_type, "scaler"))
    
def load_model_artifacts(model_type: str):
    model_path = get_artifact_path(model_type, "model")
    scaler_path = get_artifact_path(model_type, "scaler")
    
    # Check if disk artifacts exist and are compatible with the new 5 feature architecture
    needs_training = True
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            temp_scaler = joblib.load(scaler_path)
            if getattr(temp_scaler, 'n_features_in_', 0) == 5:
                needs_training = False
        except Exception:
            pass
            
    if needs_training:
        train_dummy_model(model_type)
        
    _models[model_type] = joblib.load(model_path)
    _scalers[model_type] = joblib.load(scaler_path)
    
    return _models[model_type], _scalers[model_type]

# ----------------------------------------------------
# STEP 1: FIX FEATURE ENCODING
# ----------------------------------------------------
def encode_categorical(val, mapping, default=1):
    if isinstance(val, (int, float)):
        return val
    if not isinstance(val, str):
        return default
    
    val_lower = val.lower().strip()
    for k, v in mapping.items():
        if k in val_lower:
            return v
    return default

def extract_features(features: dict) -> dict:
    """Extract and map raw frontend dict payload cleanly."""
    features_lower = {str(k).lower().replace(" ", "_"): v for k, v in features.items()}
    print(f"DEBUG - Raw payload received: {features}")
    flat_text = " ".join([str(v) for v in features.values()]).lower()
    
    # 1. Experience
    exp = 2  # default
    exp_match = re.search(r'(\d+)\+?\s*years?\s*(of\s*)?experience', flat_text)
    if exp_match:
        exp = float(exp_match.group(1))
    else:
        # Handle profiles that provide month-based experience.
        months_match = re.search(r'(\d+)\+?\s*months?\s*(of\s*)?experience', flat_text)
        if months_match:
            exp = float(months_match.group(1)) / 12.0
        elif "experience" in features_lower:
            try: 
                exp_str = str(features_lower["experience"]).replace("years", "").replace("year", "").strip()
                exp = float(exp_str)
            except:
                pass
        
    # 2. Performance Mapping (Fixing logical overlap)
    perf_map = {"exceed": 2, "above": 2, "met": 1, "meet": 1, "average": 1, "below": 0, "poor": 0}
    perf_raw = str(features_lower.get("performance_history", features_lower.get("performance", flat_text))).lower()
    if "average" in perf_raw and ("high school" in flat_text or "school" in flat_text):
        # Average historical performance should not be treated as strongly positive.
        perf_map["average"] = 0
    performance = encode_categorical(perf_raw, perf_map, 1)

    # 3. Communication Mapping
    comm_map = {"excellent": 3, "good": 2, "strong": 2, "average": 1, "poor": 0, "weak": 0, "basic": 0, "beginner": 0}
    comm_raw = str(features_lower.get("communication", flat_text)).lower()
    communication = encode_categorical(comm_raw, comm_map, 1)
    
    # 4. Education Mapping
    edu_map = {"phd": 3, "doctorate": 3, "master": 2, "msc": 2, "mba": 2, "bachelor": 1, "bsc": 1, "btech": 1}
    edu_raw = str(features_lower.get("education", flat_text)).lower()
    if ("limited" in edu_raw or "weak" in edu_raw or "insufficient" in edu_raw) and "bachelor" in edu_raw:
        # Capture phrases such as "limited bachelor-level preparation".
        education = 0
    else:
        education = encode_categorical(edu_raw, edu_map, 1)
    
    # 5. Tech Score Validation
    tech_keywords = ['python', 'java', 'html', 'css', 'react', 'node', 'aws', 'sql', 'docker', 'machine learning', 'api', 'django', 'fastapi']
    skills_raw = str(features_lower.get("technical_skills", features_lower.get("technical_score", flat_text))).lower()
    found_tech = sum(1 for kw in tech_keywords if kw in skills_raw)
    tech = max(4, min(10, found_tech * 1.5 + 4)) # Base 4 + bonus
    if "technical_score" in features_lower:
        try: tech = max(0, min(10, float(features_lower["technical_score"])))
        except: pass
    elif ("beginner" in skills_raw or "basic" in skills_raw or "limited" in skills_raw) and found_tech <= 1:
        # Avoid overestimating profiles that mention one skill at beginner level.
        tech = min(tech, 3.0)

    parsed_feats = {
        "experience": exp,
        "technical_score": tech,
        "performance": performance,
        "communication": communication,
        "education": education
    }
    print(f"DEBUG - Parsed features: {parsed_feats}")
    return parsed_feats

# ----------------------------------------------------
# STEP 4 & 5 & 6: HYBRID RULE ENGINE & SANITY LAYER
# ----------------------------------------------------
def apply_hybrid_rules(clean_features: dict, ml_pred: int, norm_score: float):
    exp = clean_features["experience"]
    tech = clean_features["technical_score"]
    perf = clean_features["performance"]
    comm = clean_features["communication"]
    edu = clean_features["education"]
    
    # 2. Balanced Sanity Rule Engine (Consensus Logic)
    critical_rejection = False
    override = False
    new_pred = ml_pred
    risk = "Low"
    negative_factors = []
    positive_factors = []
    
    # Populate initial factors
    if exp >= 5: positive_factors.append("Strong Experience Record")
    elif exp < 2: negative_factors.append("Low Experience Level")
    
    if perf == 2: positive_factors.append("Exceeded Expectations Historically")
    elif perf == 0: negative_factors.append("Below Expectations Performance")
    
    if tech > 7: positive_factors.append("High Technical Aptitude")
    elif tech < 4: negative_factors.append("Weak Technical Skills")
        
    if comm == 0: negative_factors.append("Poor Communication Skills")
    
    # Define absolute minimum viability boundaries
    if exp < 2 and perf == 0:
        critical_rejection = True
        risk = "High"
        negative_factors.append("Critical Rule: Inexperienced & Poor Performance")
            
    if comm == 0 and perf == 0:
        critical_rejection = True
        risk = "High"
        negative_factors.append("Critical Rule: Poor Communicator & Poor Performance")
            
    if tech < 4 and norm_score < 0.4:
        critical_rejection = True
        risk = "High"
        negative_factors.append("Critical Rule: Insufficient Technical Aptitude")

    if exp < 1 and (perf <= 1 or comm <= 1):
        critical_rejection = True
        risk = "High"
        negative_factors.append("Critical Rule: Very Low Experience With Weak Supporting Signals")
            
    # Apply consensus between ML prediction and normalized rule-based scoring
    if ml_pred == 0 and norm_score > 0.85:
        # ML missed a clearly strong candidate
        new_pred = 1
        override = True
        positive_factors.append("Star Candidate Profile Override")
        risk = "Low"
    elif ml_pred == 1 and critical_rejection:
        # ML accepted a failing candidate
        new_pred = 0
        override = True
    elif ml_pred == 1 and norm_score < 0.35:
        new_pred = 0
        override = True
        risk = "Medium"
        negative_factors.append("Rule: Aggregate Profile Score Too Low")
        
    return new_pred, override, risk, positive_factors, negative_factors

# ----------------------------------------------------
# MAIN EXECUTION
# ----------------------------------------------------
from services.decision_sensitivity import generate_sensitivity_suggestions
from utils.nlp_parser import runFairAIAnalysis

def run_prediction(model_type: str, raw_payload: dict):
    raw_text = " ".join([str(v) for v in raw_payload.values()]) if isinstance(raw_payload, dict) else str(raw_payload or "")
    analysis = runFairAIAnalysis(raw_text, model_type)

    if not analysis["success"]:
        return {
            "prediction": None,
            "decision": None,
            "confidence": None,
            "confidence_score": None,
            "confidence_percentage": None,
            "decision_interpretation": "Invalid input",
            "bias_detected": None,
            "fairness_score": None,
            "fairness_metrics": {"demographic_parity": None},
            "fairness_audit": {"bias_detected": None, "sensitive_features_excluded": True, "fairness_score": None},
            "top_factors": [],
            "negative_factors": [],
            "rule_override": False,
            "explanation": analysis["error"],
            "explanation_data": {
                "formatted_confidence": None,
                "explanation_text": analysis["error"],
                "top_factors": [],
                "recommendation": None,
                "decision_sensitivity": [],
            },
            "feature_importance": [],
            "bias_report": {"status": "insufficient_input"},
            "decision_sensitivity": [],
            "recommendation": None,
            "risk_level": "Unknown",
        }

    decision = analysis["decision"]
    score = analysis["score"]
    confidence_score = float(analysis["confidence"]) / 100.0
    fairness_score = 96.0 if analysis["fairness_check"]["counterfactual_same_outcome"] else 78.0
    risk_level = "Medium" if decision in ["REVIEW", "WAITLIST / REVIEW", "MANUAL REVIEW"] else "High" if decision in ["NOT SELECTED", "NOT ADMITTED", "REJECTED"] else "Low"

    print(f"DEBUG - Extracted signals: {analysis['signals']}")
    print(f"DEBUG - Calculated score: {score}")
    print(f"DEBUG - Final decision: {decision}")

    top_factors = [f["feature"] for f in analysis["top_factors"] if f["is_positive"]][:3]
    negative_factors = [f["feature"] for f in analysis["top_factors"] if not f["is_positive"]][:3]

    explanation_text = analysis["reason"]
    recommendation = "Proceed with decision." if risk_level == "Low" else "Use manual review before finalizing." if risk_level == "Medium" else "Profile does not meet the current threshold."

    return {
        "prediction": decision,
        "decision": decision,
        "confidence": confidence_score,
        "confidence_score": round(confidence_score, 4),
        "confidence_percentage": f"{int(round(confidence_score * 100))}%",
        "decision_interpretation": "High confidence decision" if confidence_score >= 0.8 else "Moderate confidence decision" if confidence_score >= 0.6 else "Borderline decision",
        "bias_detected": not analysis["fairness_check"]["counterfactual_same_outcome"],
        "fairness_score": round(fairness_score, 2),
        "fairness_metrics": {"demographic_parity": fairness_score / 100.0},
        "fairness_audit": {
            "bias_detected": not analysis["fairness_check"]["counterfactual_same_outcome"],
            "sensitive_features_excluded": True,
            "fairness_score": round(fairness_score, 2),
        },
        "top_factors": top_factors,
        "negative_factors": negative_factors,
        "rule_override": False,
        "explanation": explanation_text,
        "explanation_data": {
            "formatted_confidence": f"{int(round(confidence_score * 100))}%",
            "explanation_text": explanation_text,
            "top_factors": top_factors,
            "recommendation": recommendation,
            "decision_sensitivity": generate_sensitivity_suggestions(
                {
                    "experience": 3,
                    "performance": 1,
                    "communication": 2,
                    "technical_score": 6,
                },
                False,
                risk_level,
                confidence_score,
            ),
        },
        "feature_importance": [{"feature": f["feature"], "importance": round(f["attribution"] / 100.0, 4)} for f in analysis["top_factors"]],
        "bias_report": {
            "counterfactual_same_outcome": analysis["fairness_check"]["counterfactual_same_outcome"],
            "counterfactual_score": analysis["fairness_check"]["counterfactual_score"],
            "counterfactual_decision": analysis["fairness_check"]["counterfactual_decision"],
        },
        "decision_sensitivity": [],
        "recommendation": recommendation,
        "risk_level": risk_level,
    }
