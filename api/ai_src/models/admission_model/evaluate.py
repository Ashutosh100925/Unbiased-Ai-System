import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from utils.model_utils import load_model
from utils.helper import save_json

def evaluate_model(model_path, preprocessor_path, data_path, config, output_path="models/admission_model/metrics.json"):
    print("Evaluating Admission Model...")
    model = load_model(model_path)
    preprocessor = load_model(preprocessor_path)
    
    df = pd.read_csv(data_path)
    target = config.get("target_column", "admitted")
    X = df.drop(columns=[target])
    y = df[target]

    X_processed = preprocessor.transform(X)
    preds = model.predict(X_processed)

    metrics = {
        "accuracy": accuracy_score(y, preds),
        "precision": precision_score(y, preds, average='weighted', zero_division=0),
        "recall": recall_score(y, preds, average='weighted', zero_division=0),
        "f1": f1_score(y, preds, average='weighted', zero_division=0),
        "confusion_matrix": confusion_matrix(y, preds).tolist()
    }
    
    print(classification_report(y, preds, zero_division=0))
    save_json(metrics, output_path)
    return metrics
