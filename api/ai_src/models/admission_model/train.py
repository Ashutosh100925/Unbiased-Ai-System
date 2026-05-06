import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score
from models.admission_model.preprocess import build_preprocessor
from utils.model_utils import save_model

def train_admission_model(data_path, config):
    print("Training Admission Model...")
    df = pd.read_csv(data_path)
    
    target = config.get("target_column", "admitted")
    X = df.drop(columns=[target])
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = build_preprocessor(config['numerical_features'], config['categorical_features'])
    
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Candidate Models
    # Note Naive Bayes requires dense array, so if one hot encoding produces sparse, we may need a workaround.
    models = {
        'RandomForest': RandomForestClassifier(random_state=42),
        'GradientBoosting': GradientBoostingClassifier(random_state=42)
    }
    
    best_model = None
    best_acc = 0
    best_name = ""

    for name, model in models.items():
        model.fit(X_train_processed, y_train)
        preds = model.predict(X_test_processed)
        acc = accuracy_score(y_test, preds)
        print(f"Model: {name}, Accuracy: {acc:.4f}")
        
        if acc > best_acc:
            best_acc = acc
            best_model = model
            best_name = name
            
    print(f"Best Model Selected: {best_name} with Accuracy Core: {best_acc:.4f}")
    
    save_model(preprocessor, "models/admission_model/feature_pipeline.pkl")
    save_model(best_model, "models/admission_model/model.pkl")

    return best_model, best_acc
