import os
import sys
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

if os.environ.get("VERCEL"):
    MODELS_DIR = "/tmp/models"
else:
    MODELS_DIR = os.path.join(BASE_DIR, "models")

from data.data_generator import generate_hiring_data, generate_loan_data, generate_admission_data

def train_hiring_model():
    print("Training Hiring Model...")
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "raw_data", "hiring_data.csv"))
    
    # We drop gender for training if we want it to be "unaware", but let's train it with gender 
    # to explicitly showcase the bias engine detecting systemic bias from real data.
    X = df.drop(columns=["hired", "gender"]) 
    y = df["hired"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print(f"Hiring Model Accuracy: {model.score(X_test, y_test):.2f}")
    
    os.makedirs(os.path.join(MODELS_DIR, "hiring_model"), exist_ok=True)
    joblib.dump(model, os.path.join(MODELS_DIR, "hiring_model", "model.pkl"))
    # Save training columns for feature matching later
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, "hiring_model", "columns.pkl"))

def train_loan_model():
    print("Training Loan Model...")
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "raw_data", "loan_data.csv"))
    X = df.drop(columns=["approved", "gender"])
    y = df["approved"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print(f"Loan Model Accuracy: {model.score(X_test, y_test):.2f}")
    
    os.makedirs(os.path.join(MODELS_DIR, "loan_model"), exist_ok=True)
    joblib.dump(model, os.path.join(MODELS_DIR, "loan_model", "model.pkl"))
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, "loan_model", "columns.pkl"))

def train_admission_model():
    print("Training Admission Model...")
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "raw_data", "admission_data.csv"))
    # Dropping caste and gender
    X = df.drop(columns=["admitted", "caste_category", "gender", "caste_category"])
    y = df["admitted"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print(f"Admission Model Accuracy: {model.score(X_test, y_test):.2f}")
    
    os.makedirs(os.path.join(MODELS_DIR, "admission_model"), exist_ok=True)
    joblib.dump(model, os.path.join(MODELS_DIR, "admission_model", "model.pkl"))
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, "admission_model", "columns.pkl"))

if __name__ == "__main__":
    generate_hiring_data()
    generate_loan_data()
    generate_admission_data()
    
    train_hiring_model()
    train_loan_model()
    train_admission_model()
    print("All models trained and saved successfully.")
