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
        result = run_prediction(model_type, features)
        if result.get("prediction") is None:
            return JSONResponse(
                status_code=400,
                content={"success": False, "detail": result.get("explanation", "Invalid or insufficient data provided.")}
            )
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"success": False, "detail": str(e)})
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
    except ValueError as e:
        return JSONResponse(
            status_code=400, 
            content={"success": False, "detail": str(e)}
        )
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

def _send_email_internal(to_email: str, subject: str, html_body: str, otp: str = None):
    """Internal helper to send emails using SMTP with fallback and logging."""
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip().replace(" ", "")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587

    print(f"DEBUG: Configured SMTP_USER: {smtp_user}")
    print(f"DEBUG: Configured SMTP_PASS length: {len(smtp_pass)} chars")

    if not smtp_user or not smtp_pass:
        print(f"DEBUG [MOCK EMAIL]: To={to_email}, Subject={subject}")
        return {"success": True, "message": "Email mocked (no credentials)", "mocked": True}

    try:
        message = MIMEMultipart()
        message["From"] = smtp_user
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        print(f"DEBUG: Attempting SMTP send to {to_email} via {smtp_server}...")
        
        # Helper to do the actual login and send
        def do_send(server):
            server.login(smtp_user, smtp_pass)
            server.send_message(message)

        try:
            # Attempt 1: Port 587 (STARTTLS)
            with smtplib.SMTP(smtp_server, 587, timeout=10) as server:
                server.starttls()
                do_send(server)
            print("DEBUG: Sent via Port 587")
            return {"success": True, "message": "Email sent successfully!"}
        except Exception:
            # Attempt 2: Port 465 (SSL)
            with smtplib.SMTP_SSL(smtp_server, 465, timeout=10) as server:
                do_send(server)
            print("DEBUG: Sent via Port 465")
            return {"success": True, "message": "Email sent successfully!"}

    except (smtplib.SMTPAuthenticationError, Exception) as err:
        print("\n" + "!"*60)
        print(f"SMTP ERROR: {str(err)}")
        if otp:
            print("\n" + "="*40)
            print(f"   DEMO OTP CODE: {otp}   ")
            print("="*40 + "\n")
        print("FALLBACK: Switching to Demo Mode.")
        print("!"*60 + "\n")
        return {"success": True, "message": "Demo Mode: Check your terminal for the code.", "mocked": True}

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
        return _send_email_internal(email, f"FairAI Code: {otp}", body_text, otp=otp)
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
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }}
                .container {{ max-width: 650px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }}
                .status-card {{ border-radius: 16px; padding: 16px 20px; margin-bottom: 16px; width: 100%; border-collapse: separate; }}
                .sig-name {{ font-family: 'Dancing Script', cursive; font-size: 28px; color: #2563eb; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <table width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 40px 0 40px;">
                    <tr>
                        <td width="50%" align="left">
                            <img src="https://unbiased-ai-system-chda.vercel.app/assets/verified_success.png" width="100" alt="Verified">
                        </td>
                        <td width="50%" align="right">
                            <img src="https://unbiased-ai-system-chda.vercel.app/assets/envelope_3d.png" width="140" alt="Envelope">
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <h1 style="font-size: 36px; font-weight: 800; color: #1e293b; margin: 30px 0 20px 0; letter-spacing: -0.02em;">Email Verified Successfully! 🎉</h1>
                            <p style="font-size: 17px; color: #475569; margin: 0 0 15px 0;">Hello and welcome to <span style="color: #2563eb; font-weight: 700;">Fair AI</span>. 👋</p>
                            <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                                I, <span style="color: #2563eb; font-weight: 600;">Ashutosh Swain</span>, student of SOA University and Team Leader of Fair AI, sincerely thank you for joining our platform.
                            </p>
                        </td>
                    </tr>
                </table>

                <div style="padding: 0 40px 40px 40px;">
                    <!-- Status Green -->
                    <table class="status-card" style="background-color: #f0fdf4; border: 1px solid #dcfce7;">
                        <tr>
                            <td width="32" valign="middle"><img src="https://img.icons8.com/ios-filled/50/22c55e/ok--v1.png" width="20"></td>
                            <td style="color: #166534; font-size: 15px; padding-left: 12px;">Your email has been <span style="color: #22c55e; font-weight: 700;">successfully verified</span> and your account is now active.</td>
                        </tr>
                    </table>

                    <!-- Status Blue -->
                    <table class="status-card" style="background-color: #eff6ff; border: 1px solid #dbeafe;">
                        <tr>
                            <td width="32" valign="middle"><img src="https://img.icons8.com/ios-filled/50/2563eb/rocket.png" width="20"></td>
                            <td style="color: #1e40af; font-size: 15px; padding-left: 12px;">We are excited to have you with us in building a <span style="font-weight: 700;">fair, transparent, and intelligent AI-driven future.</span></td>
                        </tr>
                    </table>

                    <!-- Status Pink -->
                    <table class="status-card" style="background-color: #fff1f2; border: 1px solid #ffe4e6;">
                        <tr>
                            <td width="32" valign="middle"><img src="https://img.icons8.com/ios-filled/50/f43f5e/like.png" width="20"></td>
                            <td style="color: #9f1239; font-size: 15px; padding-left: 12px;">Thank you for being a part of <span style="font-weight: 700;">Fair AI.</span></td>
                        </tr>
                    </table>

                    <div style="height: 1px; background: #e2e8f0; margin: 40px 0;"></div>

                    <!-- Signature Section -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td width="100" style="padding-right: 20px;">
                                <img src="https://unbiased-ai-system-chda.vercel.app/assets/Leader.jpeg" width="80" style="border-radius: 50%; border: 3px solid #eff6ff;" alt="Ashutosh">
                            </td>
                            <td>
                                <p class="sig-name">Ashutosh Swain</p>
                                <p style="font-weight: 700; color: #1e293b; margin: 4px 0 0 0; font-size: 16px;">Ashutosh Swain</p>
                                <p style="color: #64748b; margin: 2px 0 10px 0; font-size: 13px;">Team Leader, Fair AI</p>
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td><a href="https://www.linkedin.com/in/ashutosh-swain-668433376"><img src="https://img.icons8.com/ios-filled/50/2563eb/linkedin.png" width="18" style="margin-right: 12px;"></a></td>
                                        <td><a href="mailto:swainashutosh809@gmail.com"><img src="https://img.icons8.com/ios-filled/50/2563eb/filled-message.png" width="18" style="margin-right: 12px;"></a></td>
                                        <td><a href="https://unbiased-ai-system-chda.vercel.app"><img src="https://img.icons8.com/ios-filled/50/2563eb/globe.png" width="18;"></a></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Footer Banner -->
                    <table width="100%" style="background: #f1f5f9; padding: 12px 24px; border-radius: 12px; margin-top: 40px;">
                        <tr>
                            <td style="font-size: 13px; color: #64748b;">
                                <img src="https://img.icons8.com/ios-filled/50/2563eb/brain.png" width="14" style="vertical-align: middle; margin-right: 6px;">
                                Together, let's build a <span style="color: #2563eb; font-weight: 600;">fairer and smarter</span> world with AI.
                            </td>
                            <td align="right">
                                <span style="font-weight: 700; color: #1e293b; font-size: 14px;">Fair AI</span>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
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
