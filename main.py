import os
import sys
from fastapi import FastAPI, File, Form, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Path setup
root_dir = os.path.dirname(__file__)
backend_dir = os.path.join(root_dir, "api", "backend_src")
ai_dir = os.path.join(root_dir, "api", "ai_src")

# Add paths to sys.path so routers can find their services
sys.path.insert(0, backend_dir)
sys.path.insert(0, ai_dir)
sys.path.insert(0, root_dir)

# Import routers from the consolidated backend_src
try:
    from routers import health, analyze
    from routers.analyze import execute_document_analysis
except ImportError:
    # If standard import fails, try relative to backend_dir
    sys.path.append(backend_dir)
    from routers import health, analyze
    from routers.analyze import execute_document_analysis

# Explicit FastAPI instance for Vercel detection
app = FastAPI(
    title="FairAI API",
    description="Backend API for the FairAI Decision Platform",
    version="1.0.0"
)

async def analyze_unified_handler(request: Request):
    if request.method == "GET":
        return {"status": "ok", "message": "FairAI Analysis API is active. Please use POST to submit data."}
    
    try:
        body = await request.json()
        model_type = body.get("model_type")
        features = body.get("features")
        
        from services.ml_service import run_prediction
        return run_prediction(model_type, features)
    except Exception as e:
        import traceback
        return JSONResponse(
            status_code=500, 
            content={"success": False, "error": str(e), "detail": traceback.format_exc()}
        )

# Use the most direct registration method
app.add_api_route("/api/analyze", analyze_unified_handler, methods=["GET", "POST"])
app.add_api_route("/api/analyze/", analyze_unified_handler, methods=["GET", "POST"])
app.add_api_route("/analyze", analyze_unified_handler, methods=["GET", "POST"])
app.add_api_route("/analyze/", analyze_unified_handler, methods=["GET", "POST"])

@app.post("/api/analyze/document")
@app.post("/api/analyze/document/")
async def analyze_document_direct(model_type: str = Form(...), file: UploadFile = File(...)):
    try:
        from routers.analyze import execute_document_analysis
        return await execute_document_analysis(model_type, file)
    except Exception as e:
        import traceback
        return JSONResponse(status_code=500, content={"success": False, "error": str(e), "detail": traceback.format_exc()})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def debug_logging_middleware(request, call_next):
    # This will log to the console where the server is running
    print(f"DEBUG: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"DEBUG: Response Status: {response.status_code}")
    return response

@app.post("/api/analyze/document")
@app.post("/api/analyze/document/")
@app.post("/analyze/document")
@app.post("/analyze/document/")
async def analyze_document_direct(model_type: str = Form(...), file: UploadFile = File(...)):
    try:
        from routers.analyze import execute_document_analysis
        return await execute_document_analysis(model_type, file)
    except Exception as e:
        import traceback
        return JSONResponse(status_code=500, content={"success": False, "error": str(e), "detail": traceback.format_exc()})

@app.get("/api/firebase-config")
@app.get("/firebase-config")
async def get_firebase_config():
    return {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID")
    }

@app.get("/api/firebase-config-js")
@app.get("/firebase-config-js")
async def get_firebase_config_js():
    config = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID")
    }
    import json
    js_content = f"window.firebaseConfig = {json.dumps(config)};"
    from fastapi.responses import Response
    return Response(content=js_content, media_type="application/javascript")

@app.get("/api/debug-routes")
@app.get("/debug-routes")
def debug_routes():
    return {"routes": [{"path": r.path, "methods": list(r.methods) if hasattr(r, "methods") else []} for r in app.routes]}

mobile_dir = os.path.join(root_dir, "mobile")
if os.path.isdir(mobile_dir):
    app.mount("/mobile", StaticFiles(directory=mobile_dir, html=True), name="mobile")

game_dir = os.path.join(root_dir, "Game")
if os.path.isdir(game_dir):
    app.mount("/Game", StaticFiles(directory=game_dir, html=True), name="game")

# SPA + mini-game + shared assets (index.html, script.js, auth.js, Cards/, etc.)
app.mount("/", StaticFiles(directory=root_dir, html=True), name="static")

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": traceback.format_exc() if not os.environ.get("VERCEL") else "Internal Server Error"
        }
    )
