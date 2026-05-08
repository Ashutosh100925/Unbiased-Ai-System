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

        message = MIMEMultipart()
        message["From"] = smtp_user
        message["To"] = email
        message["Subject"] = "🎉 Email Verified Successfully! Welcome to Fair AI"
        body_text = f"""
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #f3f4f6;">
            <div style="background: white; border-radius: 24px; padding: 48px; border: 1px solid #e5e7eb; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                
                <div style="margin-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <div style="width: 80px; height: 80px; background-color: #2563eb; border-radius: 16px;">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 80px; height: 80px;">
                                        <tr>
                                            <td align="center" valign="middle" style="height: 80px;">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/image.png" width="64" height="64" style="display: block; border: 0;">
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top: 24px;">
                                <h2 style="color: #111827; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">Email Verified Successfully! 🎉</h2>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p style="margin-bottom: 24px; font-size: 16px; color: #4b5563;">Hello and welcome to <span style="color: #2563eb; font-weight: 700;">Fair AI</span>. 👋</p>
                
                <p style="margin-bottom: 24px; font-size: 16px; color: #4b5563;">I, <strong>Ashutosh Swain</strong>, student of SOA University and Team Leader of Fair AI, sincerely thank you for joining our platform.</p>
                
                <div style="background-color: #ecfdf5; border: 1px solid #10b98120; border-radius: 16px; padding: 20px; margin-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                            <td style="width: 24px; vertical-align: middle;">
                                <div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 12px; text-align: center; line-height: 24px; font-size: 14px;">✓</div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                                <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 500;">Your email has been <span style="text-decoration: underline; font-weight: 700;">successfully verified</span> and your account is now active.</p>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                            <td style="vertical-align: top; padding-bottom: 16px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">🚀</td>
                                        <td style="vertical-align: top;">
                                            <p style="margin: 0; font-size: 15px; color: #4b5563;">We are excited to have you with us in building a <span style="color: #111827; font-weight: 600;">fair, transparent, and intelligent AI-driven future</span>.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="font-size: 20px; padding-right: 12px; vertical-align: top;">❤️</td>
                                        <td style="vertical-align: top;">
                                            <p style="margin: 0; font-size: 15px; color: #4b5563;">Thank you for being a part of <span style="color: #111827; font-weight: 600;">Fair AI</span>.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f3f4f6;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                            <td style="width: 64px; vertical-align: middle;">
                                <div style="width: 60px; height: 60px; border-radius: 30px; overflow: hidden; border: 2px solid #2563eb; background-color: #f3f4f6;">
                                    <img src="https://unbiased-ai-system-chda.vercel.app/assets/Leader.jpeg" alt="Ashutosh Swain" width="60" height="60" style="display: block; object-fit: cover; border: 0;">
                                </div>
                            </td>
                            <td style="vertical-align: middle; padding-left: 20px;">
                                <p style="margin: 0; font-family: 'Dancing Script', cursive; font-size: 22px; color: #2563eb; line-height: 1;">Ashutosh Swain</p>
                                <p style="margin: 4px 0 0 0; font-weight: 700; font-size: 18px; color: #111827;">Ashutosh Swain</p>
                                <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">Team Leader, Fair AI</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 32px; background-color: #eff6ff; border-radius: 12px; padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
                        <tr>
                            <td style="vertical-align: middle;">
                                <p style="margin: 0; font-size: 12px; color: #6b7280;">Together, let's build a <span style="color: #2563eb; font-weight: 700;">fairer and smarter</span> world.</p>
                            </td>
                            <td style="vertical-align: middle; text-align: right;">
                                <div style="font-weight: 800; color: #111827; font-size: 14px;">Fair AI</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px;">© 2025 Fair AI · Responsible Decision Intelligence</p>
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
