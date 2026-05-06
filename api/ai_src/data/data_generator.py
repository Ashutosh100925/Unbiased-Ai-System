import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.environ.get("VERCEL"):
    RAW_DATA_DIR = "/tmp/raw_data"
else:
    RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw_data")

os.makedirs(RAW_DATA_DIR, exist_ok=True)

def generate_hiring_data(n=1000):
    np.random.seed(42)
    # Features: education_level (1=Bachelors, 2=Masters/PhD), years_experience, technical_score, communication_score, gender, city_tier
    # Target: hired (0 or 1)
    
    genders = np.random.choice(["Male", "Female"], n, p=[0.6, 0.4])
    edu = np.random.choice([1, 2], n, p=[0.7, 0.3])
    exp = np.random.randint(0, 15, n)
    tech = np.random.randint(30, 100, n)
    comm = np.random.randint(30, 100, n)
    city = np.random.choice([1, 2, 3], n) # Tier 1, 2, 3
    
    # Introduce deliberate gender bias into the selection formula (men get a slight invisible boost)
    bias_score = np.where(genders == "Male", 10, 0)
    
    # Score function
    total_score = (edu * 10) + (exp * 2) + (tech * 0.4) + (comm * 0.3) + bias_score + np.random.normal(0, 5, n)
    
    threshold = np.percentile(total_score, 70) # Top 30% are hired
    hired = (total_score >= threshold).astype(int)
    
    df = pd.DataFrame({
        "gender": genders,
        "education_level": edu,
        "years_experience": exp,
        "technical_score": tech,
        "communication_score": comm,
        "city_tier": city,
        "hired": hired
    })
    
    df.to_csv(os.path.join(RAW_DATA_DIR, "hiring_data.csv"), index=False)
    print("Hiring data generated.")

def generate_loan_data(n=1000):
    np.random.seed(42)
    genders = np.random.choice(["Male", "Female"], n, p=[0.5, 0.5])
    emp_type = np.random.choice([1, 0], n, p=[0.6, 0.4]) # 1=Salaried, 0=Self-Employed
    income = np.random.randint(30000, 150000, n)
    credit_score = np.random.randint(550, 850, n)
    dti = np.random.uniform(0.1, 0.6, n) # Debt to income
    loan_amount = np.random.randint(10000, 500000, n)
    
    # Bias: gender=Male slightly more likely
    bias_score = np.where(genders == "Male", 15, 0)
    
    score = (income / 1000) + (credit_score * 0.1) - (dti * 100) - (loan_amount / 10000) + bias_score + np.random.normal(0, 10, n)
    threshold = np.percentile(score, 60)
    approved = (score >= threshold).astype(int)
    
    df = pd.DataFrame({
        "gender": genders,
        "employment_type": emp_type,
        "annual_income": income,
        "credit_score": credit_score,
        "debt_to_income": dti,
        "loan_amount": loan_amount,
        "approved": approved
    })
    
    df.to_csv(os.path.join(RAW_DATA_DIR, "loan_data.csv"), index=False)
    print("Loan data generated.")

def generate_admission_data(n=1000):
    np.random.seed(42)
    genders = np.random.choice(["Male", "Female"], n, p=[0.5, 0.5])
    caste = np.random.choice([1, 0], n, p=[0.7, 0.3]) # 1=General, 0=Reserved
    gpa = np.random.uniform(2.5, 4.0, n)
    sat = np.random.randint(900, 1600, n)
    extracurricular = np.random.randint(10, 100, n)
    
    # Bias: Caste 1 gets slight invisible boost
    bias_score = np.where(caste == 1, 20, 0)
    
    score = (gpa * 100) + (sat * 0.2) + (extracurricular * 0.5) + bias_score + np.random.normal(0, 10, n)
    threshold = np.percentile(score, 60)
    admitted = (score >= threshold).astype(int)
    
    df = pd.DataFrame({
        "gender": genders,
        "caste_category": caste,
        "gpa": np.round(gpa, 2),
        "sat_score": sat,
        "extracurricular_score": extracurricular,
        "admitted": admitted
    })
    
    df.to_csv(os.path.join(RAW_DATA_DIR, "admission_data.csv"), index=False)
    print("Admission data generated.")

if __name__ == "__main__":
    generate_hiring_data()
    generate_loan_data()
    generate_admission_data()
