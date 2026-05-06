import os
import pandas as pd
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class HiringPredictor:
    def __init__(self):
        self.model_path = os.path.join(BASE_DIR, "models", "hiring_model", "model.pkl")
        self.cols_path = os.path.join(BASE_DIR, "models", "hiring_model", "columns.pkl")
        try:
            self.model = joblib.load(self.model_path)
            self.expected_cols = joblib.load(self.cols_path)
        except Exception as e:
            print(f"Warning: Could not load hiring models. Ensure they are trained. {e}")
            self.model = None
            self.expected_cols = None

    def predict(self, input_dict):
        """
        Takes parsed features, aligns them to training schema, and predicts.
        """
        if not self.model or not self.expected_cols:
            return {"decision": "Error: Model not trained", "confidence_score": 0.0}

        # Preserve the original dict so fairness engine can use gender
        df = pd.DataFrame([input_dict])
        
        # Keep only expected columns in exact order
        X = df.reindex(columns=self.expected_cols, fill_value=0)
        
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        confidence = float(np.max(probabilities)) * 100
        decision = "SELECTED" if prediction == 1 else "NOT SELECTED"
        
        # Also return the scaled feature list for feature importances
        return {
            "decision": decision,
            "confidence_score": confidence,
            "structured_features": X.iloc[0].to_dict()
        }
