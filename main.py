import os
import sys
import json
import traceback
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Load environment variables from .env file if it exists
load_dotenv()

# Path setup
root_dir = os.path.dirname(__file__)
backend_dir = os.path.join(root_dir, "api", "backend_src")
ai_dir = os.path.join(root_dir, "api", "ai_src")

# Add paths to sys.path so routers can find their services
# Prioritize backend_src and ai_src
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if ai_dir not in sys.path:
    sys.path.insert(0, ai_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import routers using absolute paths for better IDE support and clarity
try:
    from api.backend_src.routers import health, analyze
    from api.backend_src.routers.analyze import execute_document_analysis
except ImportError:
    # Fallback: ensure backend_dir is in sys.path and try again
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
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
@app.post("/analyze/document")
@app.post("/analyze/document/")
async def analyze_document_direct(model_type: str = Form(...), file: UploadFile = File(...)):
    try:
        return await execute_document_analysis(model_type, file)
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "error": str(e), "detail": traceback.format_exc()}
        )

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
    js_content = f"window.firebaseConfig = {json.dumps(config)};"
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

def _send_email_internal(to_email: str, subject: str, html_body: str):
    """Internal helper to send emails using SMTP with fallback and logging."""
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip().replace(" ", "")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587

    if not smtp_user or not smtp_pass:
        print(f"DEBUG [MOCK EMAIL]: To={to_email}, Subject={subject}")
        return {"success": True, "message": "Email mocked (no credentials)", "mocked": True}

    try:
        message = MIMEMultipart()
        message["From"] = f"Fair AI <{smtp_user}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        print(f"DEBUG: Attempting SMTP send to {to_email} via {smtp_server}:{smtp_port}...")
        # Increase timeout to 15s for slow connections
        with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(message)
        print(f"DEBUG: SMTP send successful!")
        return {"success": True, "message": "Email sent successfully"}
    except Exception as e:
        error_detail = traceback.format_exc()
        print(f"ERROR [SMTP FAILURE]: {str(e)}\n{error_detail}")
        raise e

@app.post("/api/send-otp")
async def send_otp(request: Request):
    try:
        body = await request.json()
        email = body.get("email")
        otp = body.get("otp")
        
        if not email or not otp:
            return JSONResponse(status_code=400, content={"success": False, "error": "Email and OTP are required"})

        body_text = f"""
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; }}
                .container {{ max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; padding: 48px; border: 1px solid #e2e8f0; }}
                .otp-box {{ background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center; }}
                .otp-code {{ font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', Courier, monospace; }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" width="500" style="background-color: #ffffff; border-radius: 32px; border: 1px solid #e2e8f0;">
                            <tr>
                                <td style="padding: 48px;">
                                    <div style="text-align: center; margin-bottom: 24px;">
                                        <img src="https://unbiased-ai-system-chda.vercel.app/assets/verified_success.png" width="80" alt="Logo">
                                    </div>
                                    <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 16px; text-align: center;">Verify Your Account</h1>
                                    <p style="font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">Use the code below to secure your account:</p>
                                    <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 20px; padding: 32px; margin: 24px 0; text-align: center;">
                                        <div style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">{otp}</div>
                                    </div>
                                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 32px;">
                                        © 2026 Fair AI · Responsible Decision Intelligence
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        return _send_email_internal(email, f"FairAI Code: {otp}", body_text)
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e), "detail": traceback.format_exc()})

@app.post("/api/send-welcome")
async def send_welcome(request: Request):
    try:
        body = await request.json()
        email = body.get("email")
        if not email:
            return JSONResponse(status_code=400, content={"success": False, "error": "Email is required"})

        body_text = f"""
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; }}
            </style>
        </head>
        <body style="font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 40px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <tr>
                                <td style="padding: 60px 50px;">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="left" width="50%">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/verified_success.png" width="180" alt="Verified Badge">
                                            </td>
                                            <td align="right" width="50%">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/envelope_3d.png" width="160" alt="3D Envelope">
                                            </td>
                                        </tr>
                                    </table>
                                    <h1 style="font-size: 38px; font-weight: 800; color: #1e293b; margin: 40px 0 30px 0; line-height: 1.2;">Email Verified Successfully! 🥳</h1>
                                    <p style="font-size: 23px; color: #475569; margin-bottom: 20px;">Hello and welcome to <span style="color: #2563eb; font-weight: 700;">Fair AI</span>. 👋</p>
                                    <p style="font-size: 25px; color: #475569; margin-bottom: 30px; line-height: 1.6;">
                                        I, <span style="color: #2563eb; font-weight: 700;">Ashutosh Swain</span>, student of SOA University and Team Leader of <span style="color: #2563eb;">Fair AI</span>, thank you for joining.
                                    </p>
                                    <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 16px; margin-bottom: 40px;">
                                        <tr>
                                            <td style="padding: 24px;">
                                                <span style="color: #166534; font-weight: 700;">✓ Successfully Verified and Account Active</span>
                                            </td>
                                        </tr>
                                    </table>
                                    <table role="presentation" width="100%" style="border-top: 1px solid #f1f5f9; padding-top: 40px;">
                                        <tr>
                                            <td width="100">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/Leader.jpeg" width="90" height="90" style="border-radius: 45px; border: 4px solid #eff6ff; object-fit: cover;">
                                            </td>
                                            <td style="padding-left: 30px; border-left: 1px solid #f1f5f9;">
                                                <p style="margin: 0; font-family: 'Dancing Script', cursive; font-size: 24px; color: #2563eb;">Ashutosh Swain</p>
                                                <p style="margin: 5px 0 0 0; font-weight: 800; font-size: 18px; color: #1e293b;">Ashutosh Swain</p>
                                                <p style="margin: 2px 0 15px 0; font-size: 14px; color: #64748b;">Team Leader, Fair AI</p>
                                                <div style="margin-top: 10px;">
                                                    <a href="https://www.linkedin.com/in/ashutosh-swain-668433376" style="text-decoration: none; color: #2563eb; margin-right: 15px;">LinkedIn</a>
                                                    <a href="https://github.com/Ashutosh100925" style="text-decoration: none; color: #2563eb;">GitHub</a>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        return _send_email_internal(email, "🎉 Welcome to Fair AI!", body_text)
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e), "detail": traceback.format_exc()})

# SPA + mini-game + shared assets (index.html, script.js, auth.js, Cards/, etc.)
app.mount("/", StaticFiles(directory=root_dir, html=True), name="static")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": traceback.format_exc() if not os.environ.get("VERCEL") else "Internal Server Error"
        }
    )
