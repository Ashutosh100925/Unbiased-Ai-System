# FairAI Backend API

This is the FastAPI backend for the FairAI Decision Platform.

## Prerequisites
- Python 3.8+
- pip

## Setup Instructions

1. **Navigate to the backend directory:**
   Open a terminal and change to the `backend` directory:
   ```bash
   cd backend
   ```

2. **Create a virtual environment (Optional but Recommended):**
   ```bash
   python -m venv venv
   
   # Activate on Windows:
   venv\Scripts\activate
   
   # Activate on macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   Start the FastAPI development server using uvicorn:
   ```bash
   python app.py
   # OR
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Access the API Documentation:**
   Once running, you can access the interactive Swagger UI API documentation at:
   [http://localhost:8000/docs](http://localhost:8000/docs)
   
   The health check route would be available at:
   [http://localhost:8000/health/](http://localhost:8000/health/)
