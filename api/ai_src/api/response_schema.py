from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Factor(BaseModel):
    feature: str
    attribution: float
    is_positive: bool

class InferenceResponse(BaseModel):
    success: bool = True
    error: Optional[str] = None
    decision: Optional[str] = None
    confidence_score: Optional[float] = None
    bias_detected: Optional[bool] = None
    bias_type: Optional[str] = "None"
    fairness_score: Optional[float] = None
    top_factors: List[Factor] = Field(default_factory=list)
    explanation: Optional[str] = None
    recommendation: Optional[str] = None
    risk_level: Optional[str] = "Low"
    structured_features: Optional[Dict[str, Any]] = None

class AnalyzeRequest(BaseModel):
    decision_type: str
    input_data: str

class WhatIfRequest(BaseModel):
    decision_type: str
    modified_features: Dict[str, Any]
