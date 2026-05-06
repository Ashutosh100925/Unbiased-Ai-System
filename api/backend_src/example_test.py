import requests
import json

# This script demonstrates how to quickly test the /analyze POST endpoint locally 
# Make sure you have started the backend using `python app.py`

URL = "http://127.0.0.1:8000/analyze/"

payload = {
    "model_type": "hiring",
    "features": {
        "years_experience": 5.5,
        "education_level": 3,
        "skills_score": 88
    }
}

headers = {
    "Content-Type": "application/json"
}

if __name__ == "__main__":
    print(f"Sending test payload to {URL}...")
    try:
        response = requests.post(URL, json=payload, headers=headers)
        print("\n--- Response Status Code ---")
        print(response.status_code)
        
        print("\n--- Response Body ---")
        # Pretty print the json response
        print(json.dumps(response.json(), indent=4))
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Connection refused. Please ensure the FastAPI backend is running on port 8000 (cd backend && python app.py).")
