import sys
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from api.response_schema import AnalyzeRequest, WhatIfRequest, InferenceResponse
from pipelines.inference_pipeline import run_inference, run_whatif
from utils.nlp_parser import validateInput, runAnalysisOnlyIfValid

app = FastAPI(title="Unbiased AI System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/", status_code=307)

@app.get("/health")
def health_check():
    return {"status": "Unbiased AI System ML Core - Online", "version": "3.0.0"}

@app.post("/analyze", response_model=InferenceResponse)
def analyze(req: AnalyzeRequest):
    try:
        # 1) Hard validation guardrail at API layer (cannot be bypassed by frontend hacks).
        validation = validateInput(req.input_data, req.decision_type)
        if not validation["is_valid"]:
            domain_label = {
                "hiring": "Hiring",
                "loan": "Loan Approval",
                "admission": "College Admission"
            }.get(req.decision_type, req.decision_type)
            hint = {
                "hiring": "experience, skills, projects, education, technical score, or communication",
                "loan": "income, credit score, loan amount, employment status, debt, or assets",
                "admission": "academics, skills/preparation, achievements, or entrance score",
            }.get(req.decision_type, "relevant profile details")

            return {
                "success": False,
                "error": f"Invalid input: Please provide a complete {domain_label} profile including {hint}.",
                "decision": None,
                "confidence_score": None,
                "bias_detected": None,
                "fairness_score": None,
                "explanation": None,
                "recommendation": None,
                "top_factors": [],
                "structured_features": None
            }

        # 2) Run analysis on raw text only after validation succeeds.
        result = runAnalysisOnlyIfValid(
            req.input_data,
            req.decision_type,
            lambda: run_inference(req.decision_type, req.input_data)
        )

        # 3) Confidence guardrail for minimally-valid profiles (exactly 3 signal groups).
        if validation["signal_count"] == 3 and result.get("confidence_score") is not None:
            result["confidence_score"] = min(float(result["confidence_score"]), 79.0)

        result["success"] = True
        result["error"] = None
        return result
    except ValueError as e:
        if str(e) == "invalid_input":
            return {
                "success": False,
                "error": "Invalid input: Please provide a complete candidate profile with relevant details.",
                "decision": None,
                "confidence_score": None,
                "bias_detected": None,
                "fairness_score": None,
                "explanation": None,
                "recommendation": None,
                "top_factors": [],
                "structured_features": None
            }
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis Error: {str(e)}")

@app.post("/what-if", response_model=InferenceResponse)
def what_if(req: WhatIfRequest):
    try:
        # Execute ML Pipeline directly on structured features
        result = run_whatif(req.decision_type, req.modified_features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-If Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
