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
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
            <style>
                body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 40px; padding: 60px 40px; border: 1px solid #e2e8f0; }}
                .title {{ font-size: 36px; font-weight: 800; color: #1e293b; margin: 20px 0; letter-spacing: -1px; }}
                .text {{ font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px; }}
                .highlight {{ color: #2563eb; font-weight: 700; }}
                .green-box {{ background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 16px; padding: 24px; margin: 32px 0; }}
                .feature-row {{ margin-bottom: 24px; }}
                .icon-box {{ width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; }}
                .signature-area {{ margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 48px; }}
                .social-icon {{ width: 32px; height: 32px; border-radius: 16px; background-color: #f1f5f9; margin-right: 8px; }}
            </style>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 40px; border: 1px solid #e2e8f0; overflow: hidden;">
                            <tr>
                                <td style="padding: 60px 50px;">
                                    <!-- Header Icons -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="left" width="50%">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/verified_success.png" width="180" alt="Verified Badge" style="display: block; border: 0;">
                                            </td>
                                            <td align="right" width="50%">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/envelope_3d.png" width="160" alt="3D Envelope" style="display: block; border: 0;">
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Title -->
                                    <h1 style="font-size: 38px; font-weight: 800; color: #1e293b; margin: 40px 0 30px 0; letter-spacing: -1px; line-height: 1.2;">
                                        Email Verified<br>Successfully! 🥳
                                    </h1>

                                    <!-- Intro Text -->
                                    <p style="font-size: 18px; color: #475569; margin-bottom: 20px;">
                                        Hello and welcome to <span style="color: #2563eb; font-weight: 700;">Fair AI</span>. 👋
                                    </p>
                                    <p style="font-size: 16px; color: #475569; margin-bottom: 30px; line-height: 1.6;">
                                        I, <span style="color: #2563eb; font-weight: 700;">Ashutosh Swain</span>, student of SOA University and Team Leader of <span style="color: #2563eb;">Fair AI</span>, sincerely thank you for joining our platform.
                                    </p>

                                    <!-- Status Box -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 16px; margin-bottom: 40px;">
                                        <tr>
                                            <td style="padding: 24px;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 14px; text-align: center; vertical-align: middle;">
                                                            <span style="color: #ffffff; font-weight: bold; font-size: 16px;">✓</span>
                                                        </td>
                                                        <td style="padding-left: 16px; font-size: 16px; color: #334155; font-weight: 500;">
                                                            Your email has been <span style="color: #166534; font-weight: 700;">successfully verified</span> and your account is now active.
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Feature 1 -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                                        <tr>
                                            <td width="50" style="vertical-align: top;">
                                                <div style="background-color: #eff6ff; width: 44px; height: 44px; border-radius: 12px; text-align: center;">
                                                    <span style="line-height: 44px; font-size: 20px;">🚀</span>
                                                </div>
                                            </td>
                                            <td style="padding-left: 20px; font-size: 16px; color: #475569;">
                                                We are excited to have you with us in building a <span style="color: #2563eb; font-weight: 700;">fair, transparent,</span> and <span style="color: #2563eb; font-weight: 700;">intelligent AI-driven future</span>.
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Feature 2 -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                                        <tr>
                                            <td width="50" style="vertical-align: top;">
                                                <div style="background-color: #fff1f2; width: 44px; height: 44px; border-radius: 12px; text-align: center;">
                                                    <span style="line-height: 44px; font-size: 20px;">❤️</span>
                                                </div>
                                            </td>
                                            <td style="padding-left: 20px; font-size: 16px; color: #475569;">
                                                Thank you for being a part of <span style="color: #2563eb; font-weight: 700;">Fair AI</span>.
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Signature -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f1f5f9; padding-top: 40px;">
                                        <tr>
                                            <td width="100" style="vertical-align: middle;">
                                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/Leader.jpeg" width="90" height="90" style="border-radius: 45px; border: 4px solid #eff6ff; display: block; object-fit: cover;">
                                            </td>
                                            <td style="padding-left: 30px; border-left: 1px solid #f1f5f9; padding-left: 30px;">
                                                <p style="margin: 0; font-family: 'Dancing Script', cursive; font-size: 24px; color: #2563eb;">Ashutosh Swain</p>
                                                <p style="margin: 5px 0 0 0; font-weight: 800; font-size: 18px; color: #1e293b;">Ashutosh Swain</p>
                                                <p style="margin: 2px 0 15px 0; font-size: 14px; color: #64748b;">Team Leader, Fair AI</p>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="background-color: #eff6ff; width: 32px; height: 32px; border-radius: 16px; text-align: center; vertical-align: middle;">
                                                            <a href="#" style="text-decoration: none; color: #2563eb; font-size: 14px;">in</a>
                                                        </td>
                                                        <td width="10"></td>
                                                        <td style="background-color: #eff6ff; width: 32px; height: 32px; border-radius: 16px; text-align: center; vertical-align: middle;">
                                                            <a href="#" style="text-decoration: none; color: #2563eb; font-size: 14px;">✉</a>
                                                        </td>
                                                        <td width="10"></td>
                                                        <td style="background-color: #eff6ff; width: 32px; height: 32px; border-radius: 16px; text-align: center; vertical-align: middle;">
                                                            <a href="#" style="text-decoration: none; color: #2563eb; font-size: 14px;">🌐</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Footer Banner -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; background-color: #f8fafc; border-radius: 20px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="40">
                                                            <div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 16px; text-align: center; line-height: 32px;">
                                                                <span style="color: white; font-size: 16px;">❤</span>
                                                            </div>
                                                        </td>
                                                        <td style="font-size: 14px; color: #64748b;">
                                                            Together, let's build a <span style="color: #2563eb; font-weight: 700;">fairer and smarter</span> world with AI.
                                                        </td>
                                                        <td align="right">
                                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                                <tr>
                                                                    <td style="font-weight: 800; font-size: 16px; color: #1e293b; padding-left: 10px;">Fair AI</td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <p style="margin-top: 30px; color: #94a3b8; font-size: 13px;">
                            © 2026 Fair AI · Responsible Decision Intelligence
                        </p>
                    </td>
                </tr>
            </table>
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
