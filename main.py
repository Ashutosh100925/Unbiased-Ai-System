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

@app.post("/api/send-otp")
async def send_otp(request: Request):
    try:
        body = await request.json()
        email = body.get("email")
        otp = body.get("otp")
        
        if not email or not otp:
            return JSONResponse(status_code=400, content={"success": False, "error": "Email and OTP are required"})

        # SMTP Configuration (Requires environment variables)
        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_pass = os.getenv("SMTP_PASS", "").strip().replace(" ", "")
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
        smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
        smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587

        if not smtp_user or not smtp_pass:
            # Fallback for hackathon demo if no keys provided: log it and return success
            print(f"HACKATHON MOCK EMAIL: To: {email}, Code: {otp}")
            return {"success": True, "message": "OTP sent (Mocked in console)", "mock": True}

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "Your FairAI Verification Code"

        body_text = f"""
        <html>
        <body style="font-family: sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="color: #3b82f6; text-align: center;">Verify Your Account</h2>
                <p style="font-size: 16px; color: #333;">Welcome to FairAI! Use the following code to verify your identity and complete your registration:</p>
                <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1d4ed8;">{otp}</span>
                </div>
                <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 FairAI Platform</p>
            </div>
        </body>
        </html>
        """
        message.attach(MIMEText(body_text, "html"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            print(f"DEBUG: Connecting to {smtp_server}:{smtp_port}...")
            server.starttls()
            print(f"DEBUG: Logging in as {smtp_user}...")
            server.login(smtp_user, smtp_pass)
            print(f"DEBUG: Sending message to {email}...")
            server.send_message(message)
            print(f"DEBUG: Email sent successfully!")

        return {"success": True, "message": "OTP sent successfully"}
    except Exception as e:
        import traceback
        print(f"ERROR: SMTP Failure: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/send-welcome")
async def send_welcome(request: Request):
    try:
        body = await request.json()
        email = body.get("email")
        name = body.get("name", "User")
        
        if not email:
            return JSONResponse(status_code=400, content={"success": False, "error": "Email is required"})

        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_pass = os.getenv("SMTP_PASS", "").strip().replace(" ", "")
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
        smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
        smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587

        if not smtp_user or not smtp_pass:
            return {"success": True, "message": "Welcome email mocked (No credentials)"}

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "🎉 Email Verified Successfully! Welcome to Fair AI"

        body_text = f"""
        <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h2 style="color: #3b82f6; margin-bottom: 24px;">🎉 Email Verified Successfully!</h2>
                
                <p>Hello and welcome to <strong>Fair AI</strong>.</p>
                
                <p>I, <strong>Ashutosh Swain</strong>, student of SOA University and Team Leader of Fair AI, sincerely thank you for joining our platform.</p>
                
                <p>Your email has been successfully verified and your account is now active.</p>
                
                <p>We are excited to have you with us in building a fair, transparent, and intelligent AI-driven future.</p>
                
                <p>Thank you for being a part of Fair AI.</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-weight: bold;">— Ashutosh Swain</p>
                    <p style="margin: 0; color: #666;">Team Leader, Fair AI</p>
                </div>
            </div>
        </body>
        </html>
        """
        message.attach(MIMEText(body_text, "html"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(message)

        return {"success": True, "message": "Welcome email sent successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

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
