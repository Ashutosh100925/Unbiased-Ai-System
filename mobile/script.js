import { firebaseInitPromise, auth } from "../backend/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function escapeHtml(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** Same-origin API with localhost fallback when the UI is opened from Live Server etc. */
function getFairAiApiOrigin() {
    if (typeof location === "undefined") return "";
    const h = location.hostname;
    const p = location.port || "";
    if ((h === "127.0.0.1" || h === "localhost") && p && p !== "8000" && p !== "3000" && p !== "") {
        return `http://${h === "localhost" ? "127.0.0.1" : h}:8000`;
    }
    return "";
}

function generateAuditId() {
    const t = Date.now().toString(36).toUpperCase();
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `UA-${t}-${r}`;
}

const MOB_HIST_KEY = "fairai_mobile_audit_history";

function loadMobHistory() {
    try {
        const raw = localStorage.getItem(MOB_HIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveMobHistory(entries) {
    localStorage.setItem(MOB_HIST_KEY, JSON.stringify(entries.slice(0, 25)));
}

function pushMobHistory(entry) {
    const list = loadMobHistory();
    list.unshift(entry);
    saveMobHistory(list);
}

function clearMobHistory() {
    const list = loadMobHistory();
    if (list.length === 0) {
        const emptyModal = document.getElementById('history-empty-modal');
        if (emptyModal) emptyModal.classList.add('active');
        return;
    }
    const modal = document.getElementById('confirm-clear-modal');
    if (modal) modal.classList.add('active');
}

function closeClearHistoryModal() {
    const modal = document.getElementById('confirm-clear-modal');
    if (modal) modal.classList.remove('active');
}

function closeHistoryEmptyModal() {
    const modal = document.getElementById('history-empty-modal');
    if (modal) modal.classList.remove('active');
}

function executeClearHistory() {
    // 1. Instantly purge storage
    localStorage.removeItem(MOB_HIST_KEY);

    // 2. Immediately update the background UI (user will see history vanish through the glass)
    renderHistoryUI();

    // 3. Smoothly close the modal
    closeClearHistoryModal();
}

function domainLabel(mt) {
    if (mt === "loan") return "Loan approval";
    if (mt === "admission") return "College admission";
    return "Hiring & talent";
}

function normalizeRiskToken(risk) {
    const s = String(risk || "Low").toLowerCase();
    if (s.includes("high")) return "HIGH";
    if (s.includes("medium")) return "MEDIUM";
    return "LOW";
}

function riskBadgeClass(token) {
    if (token === "HIGH") return "high";
    if (token === "MEDIUM") return "medium";
    return "low";
}

function formatApiError(data) {
    if (!data) return "Request failed";
    if (typeof data.error === "string") return data.error;
    if (data.detail == null) return "Request failed";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
        return data.detail.map((x) => (typeof x === "object" && x.msg) ? x.msg : JSON.stringify(x)).join("; ");
    }
    return String(data.detail);
}

function markMobileOnboardedComplete() {
    try {
        localStorage.setItem("fairai_mobile_onboarded", "1");
    } catch (e) { /* ignore */ }
}

async function fairAiMobileSignOut() {
    if (typeof window.handleLogout === "function") {
        try {
            await window.handleLogout();
        } catch (err) {
            console.error(err);
        }
    }
}

// Expose to window for auth.js
window.updateMobileUI = updateMobileUI;

function updateMobileUI(user) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const onboardingView = document.getElementById('onboarding-view');
    const dashboardView = document.getElementById('dashboard-view');
    const bottomNav = document.querySelector('.bottom-nav');
    const otpView = document.getElementById('otp-view');
    
    // All possible content views that could overlap
    const contentViews = [
        loginView, signupView, onboardingView, dashboardView, otpView,
        document.getElementById('tab-analysis-view'),
        document.getElementById('tab-history-view'),
        document.getElementById('tab-result-view'),
        document.getElementById('tab-report-view'),
        document.getElementById('profile-view')
    ];

    // 1. Hide everything first for a clean slate
    contentViews.forEach(v => {
        if (v) v.classList.add('hidden');
    });
    if (bottomNav) bottomNav.classList.add('hidden');

    if (user) {
        // --- NEW OTP CHECK ---
        // If we are currently verifying a Google OTP, don't show the dashboard/onboarding yet
        if (window.__fairAiGooglePendingOtp) {
            console.log("updateMobileUI: Google OTP pending, showing OTP view.");
            if (otpView) {
                otpView.classList.remove('hidden');
                const subtitle = otpView.querySelector('.subtitle');
                if (subtitle) subtitle.textContent = `Verify your Google account: code sent to ${user.email}`;
            }
            return; // STOP HERE
        }

        // User is signed in and verified
        // Check if user is already onboarded
        const onboarded = localStorage.getItem('fairai_mobile_onboarded') === '1';
        console.log("updateMobileUI: User is verified. Onboarded status:", onboarded);

        if (!onboarded) {
            console.log("updateMobileUI: Showing Onboarding View.");
            if (onboardingView) onboardingView.classList.remove('hidden');
            if (typeof window.resetMobileOnboarding === 'function') {
                window.resetMobileOnboarding();
            }
        } else {
            console.log("updateMobileUI: Showing Dashboard View.");
            if (dashboardView) dashboardView.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
        }

        // Update user info across UI
        document.querySelectorAll("[data-fairai-user-name]").forEach(el => {
            el.textContent = user.displayName || "Account";
        });
        document.querySelectorAll("[data-fairai-user-photo]").forEach(img => {
            img.src = user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        });
        
        if (typeof window.updateCreditsUI === 'function') {
            window.updateCreditsUI();
        }
    } else {
        // User is signed out - Show Login
        if (loginView) loginView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

function showMobToast(message, isError = false) {
    const toast = document.getElementById('mob-toast');
    if (!toast) return;
    const icon = toast.querySelector('.toast-icon');
    const text = toast.querySelector('.toast-message');
    
    text.textContent = message;
    if (isError) {
        icon.textContent = 'error';
        icon.classList.add('error');
    } else {
        icon.textContent = 'check_circle';
        icon.classList.remove('error');
    }
    
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}



// Initialize Auth Listener
firebaseInitPromise.then((fb) => {
    const activeAuth = fb ? fb.auth : auth;
    if (activeAuth) {
        onAuthStateChanged(activeAuth, (user) => {
            updateMobileUI(user);
        });
    }
});

// Attach to window for HTML event handlers
window.closeClearHistoryModal = closeClearHistoryModal;
window.closeHistoryEmptyModal = closeHistoryEmptyModal;
window.executeClearHistory = executeClearHistory;
window.markMobileOnboardedComplete = markMobileOnboardedComplete;
window.fairAiMobileSignOut = fairAiMobileSignOut;
window.clearMobHistory = clearMobHistory;

document.addEventListener('DOMContentLoaded', () => {
    // Splash Intro Logic
    const splashIntro = document.getElementById('splash-intro');
    const splashVideo = document.getElementById('splash-video');
    const body = document.body;

    function hideSplash() {
        if (!splashIntro.classList.contains('fade-out')) {
            splashIntro.classList.add('fade-out');
            body.classList.remove('splash-active');
            
            // Remove the splash element from DOM after transition
            setTimeout(() => {
                if (splashIntro.parentNode) {
                    splashIntro.parentNode.removeChild(splashIntro);
                }
            }, 1000);
        }
    }

    if (splashIntro && splashVideo) {
        splashVideo.muted = true; // Ensure video is muted for reliable autoplay on mobile
        
        splashVideo.currentTime = 0; // Reset video to start
        splashVideo.play().catch(e => console.log('Autoplay prevented by browser:', e));
        
        // Hide splash after 8 seconds maximum
        let splashTimeout = setTimeout(hideSplash, 8000);

        splashVideo.addEventListener('ended', () => {
            clearTimeout(splashTimeout);
            hideSplash();
        });
    }

    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const onboardingView = document.getElementById('onboarding-view');
    const dashboardView = document.getElementById('dashboard-view');
    const bottomNav = document.querySelector('.bottom-nav');



    // Setup navigation between login and signup
    const signupLinks = document.querySelectorAll('.signup-link');
    signupLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginView) loginView.classList.add('hidden');
            if (signupView) signupView.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.add('hidden');
            window.scrollTo(0, 0);
        });
    });

    const loginLinksBack = document.querySelectorAll('.login-link-back');
    loginLinksBack.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupView) signupView.classList.add('hidden');
            if (loginView) loginView.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.add('hidden');
            window.scrollTo(0, 0);
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (btn) btn.classList.add('loading');
            try {
                if (typeof window.handleEmailSignIn === 'function') {
                    const userCredential = await window.handleEmailSignIn(email, password);

                    showMobToast("Signed in successfully!");
                }
            } catch (err) {
                showMobToast(err.message || "Login failed", true);
            } finally {
                if (btn) btn.classList.remove('loading');
            }
        });
    }

    // OTP Logic Helpers
    async function generateAndSendOTP(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        window.__fairAiMobGeneratedOtp = otp;
        
        try {
            const origin = getFairAiApiOrigin();
            console.log(`DEBUG: Sending OTP to ${origin}/api/send-otp for email ${email}`);
            const response = await fetch(`${origin}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            console.log("DEBUG: Response status:", response.status);
            const data = await response.json();
            console.log("DEBUG: Response data:", data);
            
            if (data.success) {
                showMobToast(data.mock ? "Code sent (Check backend logs)" : `Verification code sent to ${email}`);
                console.log("OTP for debug:", otp);
            } else {
                throw new Error(data.error || "Failed to send email");
            }
        } catch (err) {
            console.error("Email Error:", err);
            showMobToast("Failed to send verification email. Please try again.", true);
            // In a hackathon, we might still want to proceed for demo if the email fails
            console.log("FALLBACK OTP FOR DEMO:", otp);
        }
        return otp;
    }

    const otpView = document.getElementById('otp-view');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const resendOtpBtn = document.getElementById('resend-otp-btn');
    const backToSignupLink = document.querySelector('.back-to-signup-link');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                showMobToast("Passwords do not match", true);
                return;
            }

            if (btn) btn.classList.add('loading');
            try {
                // Save pending data
                window.__fairAiMobPendingSignup = { name, email, password };
                
                // Send OTP via Backend
                await generateAndSendOTP(email);
                
                // Switch to OTP View
                if (signupView) signupView.classList.add('hidden');
                if (otpView) otpView.classList.remove('hidden');
            } finally {
                if (btn) btn.classList.remove('loading');
            }
        });
    }

    // Handle OTP digits input focus
    otpDigits.forEach((digit, idx) => {
        digit.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && idx < otpDigits.length - 1) {
                otpDigits[idx + 1].focus();
            }
        });

        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                otpDigits[idx - 1].focus();
            }
            // Trigger verification on Enter
            if (e.key === 'Enter') {
                const enteredOtp = Array.from(otpDigits).map(d => d.value).join('');
                if (enteredOtp.length === 6 && verifyOtpBtn) {
                    verifyOtpBtn.click();
                }
            }
        });
    });

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const enteredOtp = Array.from(otpDigits).map(d => d.value).join('');
            
            if (enteredOtp.length !== 6) {
                showMobToast("Please enter the 6-digit code", true);
                return;
            }

            if (window.__fairAiGooglePendingOtp && enteredOtp === window.__fairAiGooglePendingOtp) {
                // Verified Google OTP
                verifyOtpBtn.classList.add('loading');
                if (typeof window.verifyGoogleOtp === 'function') {
                    await window.verifyGoogleOtp();
                    showMobToast("Google account verified!");
                }
                verifyOtpBtn.classList.remove('loading');
                return;
            }

            if (enteredOtp === window.__fairAiMobGeneratedOtp) {
                verifyOtpBtn.classList.add('loading');
                try {
                    const { name, email, password } = window.__fairAiMobPendingSignup;
                    if (typeof window.handleEmailSignUp === 'function') {
                        await window.handleEmailSignUp(name, email, password);
                        showMobToast("Account verified and created!");
                        if (otpView) otpView.classList.add('hidden');
                        // Auth listener in updateMobileUI will handle the rest
                    }
                } catch (err) {
                    showMobToast(err.message || "Verification failed", true);
                } finally {
                    verifyOtpBtn.classList.remove('loading');
                }
            } else {
                showMobToast("Invalid verification code", true);
                otpDigits.forEach(d => d.value = '');
                otpDigits[0].focus();
            }
        });
    }

    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await generateAndSendOTP(window.__fairAiMobPendingSignup.email);
        });
    }

    if (backToSignupLink) {
        backToSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (otpView) otpView.classList.add('hidden');
            if (signupView) signupView.classList.remove('hidden');
        });
    }

    // Onboarding elements
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const nextBtns = document.querySelectorAll('.next-action');
    const prevBtns = document.querySelectorAll('.prev-action');
    const startBtn = document.getElementById('start-btn');
    const skipBtn = document.getElementById('skip-btn');

    let currentSlide = 0;


    // Handle slide navigation
    window.resetMobileOnboarding = function () {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');

        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'previous');
            if (i === 0) slide.classList.add('active');
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === 0);
        });

        window.currentMobileSlide = 0;
    };

    function goToSlide(index) {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');

        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'previous');
            if (i < index) {
                slide.classList.add('previous');
            } else if (i === index) {
                slide.classList.add('active');
            }
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        window.currentMobileSlide = index;
    }

    // Initialize first slide
    goToSlide(0);

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const slides = document.querySelectorAll('.slide');
            if (window.currentMobileSlide < slides.length - 1) {
                goToSlide(window.currentMobileSlide + 1);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.currentMobileSlide > 0) {
                goToSlide(window.currentMobileSlide - 1);
            }
        });
    });

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const analysisView = document.getElementById('analysis-view');
            onboardingView.classList.add('hidden');
            analysisView.classList.remove('hidden');
            void analysisView.offsetWidth;
        });
    }

    const finalGetStartedBtn = document.getElementById('final-get-started-btn');

    if (finalGetStartedBtn) {
        finalGetStartedBtn.addEventListener('click', () => {
            markMobileOnboardedComplete();
            const analysisView = document.getElementById('analysis-view');
            if (analysisView) analysisView.classList.add('hidden');
            if (dashboardView) dashboardView.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            markMobileOnboardedComplete();
            onboardingView.classList.add('hidden');
            const dashboardView = document.getElementById('dashboard-view');
            dashboardView.classList.remove('hidden');
            if (bottomNav) bottomNav.classList.remove('hidden');
        });
    }

    // Tab Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const profileView = document.getElementById('profile-view');
    const analysisTabView = document.getElementById('tab-analysis-view');
    const historyTabView = document.getElementById('tab-history-view');
    const resultTabView = document.getElementById('tab-result-view');
    const reportTabView = document.getElementById('tab-report-view');
    const allViews = [dashboardView, profileView, analysisTabView, historyTabView, resultTabView, reportTabView];

    function switchTabView(targetView, clickedItem) {
        allViews.forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (targetView) targetView.classList.remove('hidden');

        // Update Nav Active State
        navItems.forEach(item => item.classList.remove('active'));
        if (clickedItem) clickedItem.classList.add('active');

        window.scrollTo(0, 0);
        if (typeof window.updateCreditsUI === 'function') {
            window.updateCreditsUI();
        }
    }

    document.querySelectorAll('.tab-home').forEach(btn => {
        btn.addEventListener('click', () => switchTabView(dashboardView, btn));
    });
    document.querySelectorAll('.tab-analysis').forEach(btn => {
        btn.addEventListener('click', () => switchTabView(analysisTabView, btn));
    });
    document.querySelectorAll('.tab-history').forEach((btn) => {
        btn.addEventListener('click', () => {
            switchTabView(historyTabView, btn);
            renderHistoryUI();
        });
    });
    document.querySelectorAll('.tab-profile').forEach(btn => {
        btn.addEventListener('click', () => switchTabView(profileView, btn));
    });

    window.__fairAiMobLastAnalysis = window.__fairAiMobLastAnalysis || null;



    const analyzeBiasBtn = document.getElementById('analyze-bias-btn');
    const auditErr = document.getElementById('audit-api-error');

    function showAuditErr(msg) {
        if (!auditErr) return;
        if (!msg) {
            auditErr.classList.add('hidden');
            auditErr.textContent = '';
            return;
        }
        auditErr.textContent = msg;
        auditErr.classList.remove('hidden');
    }

    function collectProfileText() {
        const name = (document.getElementById('audit-name')?.value || "").trim();
        const age = (document.getElementById('audit-age')?.value || "").trim();
        const zip = (document.getElementById('audit-zip')?.value || "").trim();
        const body = (document.getElementById('audit-profile-text')?.value || "").trim();
        const chunks = [];
        if (name) chunks.push(`Candidate name: ${name}`);
        if (age) chunks.push(`Age: ${age}`);
        if (zip) chunks.push(`Zip code: ${zip}`);
        if (body) chunks.push(body);
        return chunks.join(". ");
    }

    function getSelectedModelType() {
        const dd = document.getElementById('domain-dropdown');
        const active = dd?.querySelector('.dropdown-option.active');
        const v = (active?.dataset?.value || 'hiring').toLowerCase();
        if (v === 'loan' || v === 'admission' || v === 'hiring') return v;
        return 'hiring';
    }

    function renderMobKeyDrivers(container, detection, signals) {
        if (!container || !detection || !signals) {
            if (container) container.innerHTML = '';
            return;
        }
        let keys = ['skills', 'experience', 'projects'];
        if (detection.type === 'COLLEGE_ADMISSION') keys = ['academics', 'projects', 'achievements'];
        if (detection.type === 'LOAN_APPROVAL') keys = ['creditScore', 'income', 'repayment'];
        const theme = detection.type === 'LOAN_APPROVAL'
            ? [
                { bar: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', fg: '#b45309' },
                { bar: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' },
                { bar: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', fg: '#1d4ed8' },
            ]
            : [
                { bar: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', fg: '#1d4ed8' },
                { bar: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', fg: '#7e22ce' },
                { bar: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', fg: '#be185d' },
            ];
        let html = '';
        keys.forEach((key, idx) => {
            const level = signals[key] || 'low';
            const width = level === 'high' ? 90 : (level === 'medium' ? 60 : 30);
            const attr = level === 'high' ? 25 : (level === 'medium' ? 15 : 11);
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            const t = theme[idx] || theme[0];
            html += `<div class="mob-driver-row"><div class="mob-driver-head"><span class="mob-driver-name">${escapeHtml(label)}</span><span class="mob-driver-attr" style="background:${t.bg};color:${t.fg}">+${attr}% attribution</span></div><div class="mob-driver-track"><div class="mob-driver-fill" data-target="${width}" style="width:0;background:${t.bar}"></div></div></div>`;
        });
        container.innerHTML = html;
        requestAnimationFrame(() => {
            container.querySelectorAll('.mob-driver-fill').forEach((el) => {
                const w = el.getAttribute('data-target');
                if (w) el.style.width = w + '%';
            });
        });
    }

    function applyResultsToMobUI(payload, auditId, finalData) {
        const ring = document.getElementById('mob-fairness-ring');
        const pctEl = document.getElementById('mob-fairness-pct');
        const labelEl = document.getElementById('mob-fairness-label');
        const recEl = document.getElementById('mob-decision-rec');
        const riskEl = document.getElementById('mob-risk-badge');
        const idEl = document.getElementById('mob-audit-id');
        const factorsEl = document.getElementById('mob-factors-grid');
        const sensEl = document.getElementById('mob-sensitive-list');
        const sensFoot = document.getElementById('mob-sensitive-footer');
        const typeLabelEl = document.getElementById('mob-detected-type-label');
        const detConfEl = document.getElementById('mob-detection-confidence');
        const finalDecEl = document.getElementById('mob-final-decision');
        const confScoreEl = document.getElementById('mob-confidence-score');
        const weightedEl = document.getElementById('mob-weighted-score');
        const driversEl = document.getElementById('mob-key-drivers-container');
        const explainQuoteEl = document.getElementById('mob-ai-explanation-text');
        const insightEl = document.getElementById('mob-system-insight');
        const gPct = document.getElementById('mob-gender-bias-percent');
        const gBar = document.getElementById('mob-gender-bias-bar');
        const aPct = document.getElementById('mob-age-bias-percent');
        const aBar = document.getElementById('mob-age-bias-bar');
        const ePct = document.getElementById('mob-education-bias-percent');
        const eBar = document.getElementById('mob-education-bias-bar');

        const dp = payload.fairness_metrics?.demographic_parity ?? (Number(payload.fairness_score) / 100);
        const fdFair = finalData && finalData.fairness != null
            ? Math.max(0, Math.min(100, Math.round(Number(finalData.fairness))))
            : null;
        const fairnessPct = fdFair != null
            ? fdFair
            : Math.max(0, Math.min(100, Math.round(Number(payload.fairness_score) || 0)));
        const circ = 2 * Math.PI * 45;
        const dash = (circ * fairnessPct) / 100;
        const strokeColor = fairnessPct > 80 ? '#00D64F' : (fairnessPct > 60 ? '#F59E0B' : '#EF4444');
        if (ring) {
            ring.setAttribute('style', `stroke-dasharray: ${dash}, ${circ.toFixed(0)}; stroke: ${strokeColor};`);
        }
        if (pctEl) pctEl.textContent = `${fairnessPct}%`;
        if (labelEl) labelEl.textContent = fairnessPct >= 85 ? 'HIGH PARITY' : fairnessPct >= 65 ? 'MODERATE' : 'ATTENTION NEEDED';

        const dec = (finalData && finalData.decision) ? finalData.decision : (payload.decision || payload.prediction || '—');
        const recText = payload.recommendation || (payload.explanation_data && payload.explanation_data.recommendation) || '';
        if (recEl) recEl.textContent = recText ? `Decision: ${dec} — ${recText}` : `Decision: ${dec}`;

        if (finalData && finalData.detection && typeLabelEl && detConfEl) {
            const dt = finalData.detection.type || 'HIRING';
            typeLabelEl.textContent = String(dt).replace(/_/g, ' ');
            if (dt === 'HIRING') typeLabelEl.style.color = '#3B82F6';
            else if (dt === 'COLLEGE_ADMISSION') typeLabelEl.style.color = '#A855F7';
            else if (dt === 'LOAN_APPROVAL') typeLabelEl.style.color = '#F59E0B';
            else typeLabelEl.style.color = '#3B82F6';
            const c = finalData.detection.confidence != null ? finalData.detection.confidence : 85;
            detConfEl.textContent = String(c) + '% Match';
        } else if (typeLabelEl && detConfEl) {
            typeLabelEl.textContent = '—';
            detConfEl.textContent = '—';
        }

        if (finalDecEl) {
            finalDecEl.textContent = dec;
            const posDecs = ['SELECTED', 'ADMITTED', 'APPROVED'];
            const reviewDecs = ['REVIEW', 'MANUAL REVIEW', 'REVIEW / WAITLIST', 'WAITLIST / REVIEW'];
            finalDecEl.style.color = posDecs.includes(dec) ? '#00D64F' : (reviewDecs.includes(dec) ? '#F59E0B' : '#EF4444');
        }

        if (finalData && confScoreEl && weightedEl) {
            confScoreEl.textContent = String(finalData.confidence != null ? finalData.confidence : '—');
            const ws = Number(finalData.score);
            weightedEl.textContent = Number.isFinite(ws) ? ws.toFixed(1) : '—';
        } else if (confScoreEl && weightedEl) {
            confScoreEl.textContent = payload.confidence_score != null
                ? String(Math.round(Number(payload.confidence_score) * 100))
                : '—';
            weightedEl.textContent = '—';
        }

        const expl = (finalData && finalData.explanation)
            ? finalData.explanation
            : (payload.explanation || (payload.explanation_data && payload.explanation_data.explanation_text) || '');
        if (explainQuoteEl) explainQuoteEl.textContent = expl ? `"${expl}"` : '—';
        if (insightEl && finalData) {
            const ws = Number(finalData.score);
            const scoreDisp = Number.isFinite(ws) ? ws.toFixed(1) : '—';
            insightEl.textContent = `Weighted Signal Analysis: Score ${scoreDisp}/100. Integrity Check: ${fairnessPct}%. Recommendation: ${dec}.`;
        } else if (insightEl) insightEl.textContent = '—';

        if (finalData && finalData.penalties) {
            const p = finalData.penalties;
            if (gPct) gPct.textContent = (p.gender || 0) + '%';
            if (gBar) gBar.style.width = Math.min(100, p.gender || 0) + '%';
            if (aPct) aPct.textContent = (p.age || 0) + '%';
            if (aBar) aBar.style.width = Math.min(100, p.age || 0) + '%';
            if (ePct) ePct.textContent = (p.education || 0) + '%';
            if (eBar) eBar.style.width = Math.min(100, p.education || 0) + '%';
        }

        if (finalData && driversEl && finalData.detection && finalData.signals) {
            renderMobKeyDrivers(driversEl, finalData.detection, finalData.signals);
        } else if (driversEl) driversEl.innerHTML = '';

        const riskTok = normalizeRiskToken(payload.risk_level);
        if (riskEl) {
            riskEl.textContent = riskTok;
            riskEl.classList.remove('low', 'medium', 'high');
            riskEl.classList.add(riskBadgeClass(riskTok));
        }
        if (idEl) idEl.textContent = '#' + auditId;

        const factors = (payload.top_factors && payload.top_factors.length ? payload.top_factors : ['Signals parsed from profile'])
            .map((t) => `<span class="factor-pill">${escapeHtml(String(t))}</span>`).join('');
        if (factorsEl) factorsEl.innerHTML = factors;

        const biasHit = !!payload.bias_detected;
        if (sensEl) {
            if (!biasHit) {
                sensEl.innerHTML = `<div class="attribute-item"><span>Protected proxies</span><span class="flagged-badge" style="background:#ecfdf5;color:#065f46">CLEAR</span></div>`;
            } else {
                sensEl.innerHTML = `
                    <div class="attribute-item"><span>Counterfactual check</span><span class="flagged-badge">REVIEW</span></div>
                    <div class="attribute-item"><span>Demographic proxies</span><span class="flagged-badge">FLAGGED</span></div>`;
            }
        }
        if (sensFoot) sensFoot.textContent = biasHit
            ? 'Counterfactual fairness test differed — human review suggested.'
            : 'Counterfactual outcome aligned with primary decision.';

        const p1 = Math.min(99, Math.max(0, Math.round((dp ?? 0.9) * 100)));
        const counterfAligned = payload.bias_report && payload.bias_report.counterfactual_same_outcome === true;
        const rawCf = typeof payload.bias_report?.counterfactual_score === 'number' ? payload.bias_report.counterfactual_score : null;
        const p2Basis = rawCf != null ? Math.min(1, rawCf / 100) : (counterfAligned ? 0.92 : dp * 0.85);
        const p2 = Math.min(99, Math.max(0, Math.round(p2Basis * 100)));
        const p3 = Math.min(99, Math.max(0, fairnessPct));

        [[p1, '.mob-parity-val-0', '.mob-parity-bar-0'], [p2, '.mob-parity-val-1', '.mob-parity-bar-1'], [p3, '.mob-parity-val-2', '.mob-parity-bar-2']].forEach(([pct, vc, bc]) => {
            const v = document.querySelector(vc);
            const b = document.querySelector(bc);
            if (v) v.textContent = (pct / 100).toFixed(2);
            if (b) b.style.width = `${pct}%`;
        });

        window.__fairAiMobLastAnalysis = {
            auditId,
            modelType: payload.model_used || payload.model_type,
            fairnessPct,
            decision: dec,
            riskTok,
            explanation: expl,
            recommendation: recText || payload.recommendation,
            confidence_score: finalData && finalData.confidence != null ? finalData.confidence / 100 : payload.confidence_score,
            sensitivity: payload.decision_sensitivity || (payload.explanation_data && payload.explanation_data.decision_sensitivity) || [],
            bias_detected: biasHit,
            weighted_score: finalData && finalData.score,
            detection_type: finalData && finalData.detection && finalData.detection.type,
        };
    }

    function applyReportFromLast() {
        const last = window.__fairAiMobLastAnalysis;
        const rid = document.getElementById('mob-report-audit-id');
        const title = document.getElementById('mob-report-title');
        const dt = document.getElementById('mob-report-date');
        const badge = document.getElementById('mob-report-severity-badge');
        const mini = document.getElementById('mob-report-mini-score');
        const rd = document.getElementById('mob-report-parity-desc');
        const cf = document.getElementById('mob-report-confidence');
        const dv = document.getElementById('mob-report-decision');
        const bt = document.getElementById('mob-breakdown-text');
        const list = document.getElementById('mob-improvement-list');
        const ring = document.getElementById('mob-report-ring');

        if (!last) return;
        const when = new Date().toLocaleString();
        const mt = last.modelType || 'hiring';
        if (rid) rid.textContent = 'AUDIT ID: #' + last.auditId;
        if (title) title.textContent = `${domainLabel(mt)} · Fairness report`;
        if (dt) dt.textContent = 'Report generated on ' + when;
        const severity = last.bias_detected ? 'BIAS REVIEW' : 'FAIR PATH';
        if (badge) {
            badge.textContent = severity;
            if (last.bias_detected) {
                badge.style.background = '';
                badge.style.color = '';
            } else {
                badge.style.background = '#d1fae5';
                badge.style.color = '#065f46';
            }
        }
        if (mini) {
            mini.textContent = String(last.fairnessPct ?? '—');
            mini.style.color = last.fairnessPct >= 70 ? '#059669' : '#dc2626';
        }
        const circ = 283;
        const dash = Math.round((circ * (last.fairnessPct || 0)) / 100);
        if (ring) ring.setAttribute('style', `stroke-dasharray: ${dash}, ${circ}; transform: rotate(-90deg); transform-origin: center; stroke: ${(last.fairnessPct || 0) >= 70 ? '#10b981' : '#ef4444'}`);
        if (rd) rd.textContent = last.recommendation || last.decision || 'No summary.';
        if (cf) cf.textContent = last.confidence_score != null ? String(Math.round(Number(last.confidence_score) * 100) / 100) : '—';
        if (dv) dv.textContent = String(last.decision || '—');
        if (bt) {
            const safe = last.explanation || 'No narrative returned.';
            bt.textContent = safe;
        }
        if (list) {
            const steps = [];
            const sens = Array.isArray(last.sensitivity) ? last.sensitivity : [];
            if (sens.length) {
                sens.slice(0, 5).forEach((item) => {
                    const txt = typeof item === 'string' ? item : (item && item.text) ? item.text : JSON.stringify(item);
                    steps.push(`<div class="step-card"><span class="material-symbols-outlined step-icon">trending_up</span><div class="step-info"><h4>Tuning suggestion</h4><p>${escapeHtml(txt)}</p></div></div>`);
                });
            } else if (last.recommendation) {
                steps.push(`<div class="step-card"><span class="material-symbols-outlined step-icon">check_circle</span><div class="step-info"><h4>Recommendation</h4><p>${escapeHtml(last.recommendation)}</p></div></div>`);
            }
            if (!steps.length) steps.push('<div class="step-card"><span class="material-symbols-outlined step-icon">info</span><div class="step-info"><h4>No extra steps</h4><p>Engine did not attach sensitivity suggestions.</p></div></div>');
            list.innerHTML = steps.join('');
        }
    }



function renderHistoryUI() {
    const hist = loadMobHistory();
    const empty = document.getElementById('history-empty');
    const listEl = document.getElementById('history-list');
    if (!empty || !listEl) return;
    if (!hist.length) {
        empty.classList.remove('hidden');
        listEl.classList.add('hidden');
        return;
    }
    empty.classList.add('hidden');
    listEl.classList.remove('hidden');
    listEl.innerHTML = hist.map((row) => {
        const dt = row.at ? new Date(row.at).toLocaleString() : '';
        return `<div class="history-entry-card">
            <div class="history-entry-meta">${escapeHtml(dt)} · ${escapeHtml(domainLabel(row.model_type))}</div>
            <div class="history-entry-title">${escapeHtml(row.decision)}</div>
            <div class="history-entry-sub">Fairness ${row.fairness_pct}% · ${escapeHtml(row.risk)} · ${escapeHtml(row.audit_id)}</div>
        </div>`;
    }).join('');
}
window.renderHistoryUI = renderHistoryUI;

// Call initial render if storage already has data
renderHistoryUI();

    if (analyzeBiasBtn) {
        async function runMobileBiasAnalysis() {
            showAuditErr('');
            const auditId = generateAuditId();
            const origin = getFairAiApiOrigin();
            const modelType = getSelectedModelType();
            const fileInput = document.getElementById('audit-file-input');
            const file = fileInput && fileInput.files && fileInput.files[0];

            analyzeBiasBtn.disabled = true;
            const btnLabel = analyzeBiasBtn.querySelector('span:last-child');
            const prevLbl = btnLabel ? btnLabel.textContent : '';
            if (btnLabel) btnLabel.textContent = 'Calling API…';

            try {
                let data;
                let detection = null;
                let profileTextForFinal = '';

                const ext = file ? (file.name.split('.').pop() || '').toLowerCase() : '';

                if (file && ['csv', 'json'].includes(ext)) {
                    const fd = new FormData();
                    fd.append('model_type', modelType);
                    fd.append('file', file, file.name);
                    const resp = await fetch(origin + '/api/analyze/document', { method: 'POST', body: fd });
                    data = await resp.json();
                    if (!resp.ok) throw new Error(formatApiError(data) || resp.statusText);
                    detection = window.fairAiModelTypeToDetection
                        ? window.fairAiModelTypeToDetection(modelType)
                        : null;
                    profileTextForFinal = JSON.stringify(data.structured_features || {});
                } else {
                    let composite = collectProfileText();
                    if (file && ext === 'txt') {
                        const txt = await file.text();
                        composite = composite ? composite + '. ' + txt : txt;
                    }
                    composite = composite.trim();
                    if (!composite && file && ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'].includes(ext)) {
                        showAuditErr('Extract the document first (tap upload) or wait for extraction to finish.');
                        return;
                    }

                    if (window.FairAiAnalysisCore && typeof window.FairAiAnalysisCore.runAnalysis === 'function') {
                        const coreRes = await window.FairAiAnalysisCore.runAnalysis(composite, modelType);
                        if (!coreRes.ok) {
                            const hint = coreRes.detectedType
                                ? ` Suggested domain: ${coreRes.detectedType}.`
                                : '';
                            showAuditErr((coreRes.message || 'Analysis could not run.') + hint);
                            return;
                        }
                        data = coreRes.backendData;
                        detection = coreRes.detection;
                        profileTextForFinal = composite;
                    } else {
                        const wc = composite.split(/\s+/).filter(Boolean).length;
                        if (composite.length < 25 || wc < 8) {
                            showAuditErr(`Add more detail (${wc}/8+ words). Load the main script for full validation.`);
                            return;
                        }
                        const resp = await fetch(origin + '/api/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model_type: modelType,
                                features: { profile_text: composite },
                            }),
                        });
                        data = await resp.json();
                        if (!resp.ok) throw new Error(formatApiError(data) || resp.statusText);
                        if (data.success === false) throw new Error(formatApiError(data) || 'Analysis failed');
                        detection = window.fairAiModelTypeToDetection
                            ? window.fairAiModelTypeToDetection(modelType)
                            : null;
                        profileTextForFinal = composite;
                    }
                }

                let finalData = null;
                if (typeof window.fairAiBuildFinalDataFromBackend === 'function') {
                    finalData = await window.fairAiBuildFinalDataFromBackend(data, detection, profileTextForFinal);
                }

                data.model_used = modelType;

                // Deduct credits only upon successful result retrieval
                if (typeof window.deductCredits === 'function') {
                    window.deductCredits(2);
                }

                applyResultsToMobUI(data, auditId, finalData);
                pushMobHistory({
                    audit_id: '#' + auditId,
                    decision: String((finalData && finalData.decision) || data.decision || data.prediction || '—'),
                    fairness_pct: finalData
                        ? Math.round(Number(finalData.fairness) || 0)
                        : Math.round(Number(data.fairness_score) || 0),
                    risk: normalizeRiskToken(data.risk_level),
                    model_type: modelType,
                    at: Date.now(),
                });
                renderHistoryUI();
                switchTabView(resultTabView, document.querySelector('.tab-analysis'));
            } catch (e) {
                console.error(e);
                showAuditErr(e.message || String(e));
            } finally {
                analyzeBiasBtn.disabled = false;
                if (btnLabel) btnLabel.textContent = prevLbl || 'Analyze Bias';
            }
        }

        analyzeBiasBtn.addEventListener('click', () => {
            const go = () => {
                void runMobileBiasAnalysis();
            };
            if (typeof window.requireSignInBeforeAnalysis === 'function') {
                window.requireSignInBeforeAnalysis(go);
            } else {
                go();
            }
        });
    }

    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            applyReportFromLast();
            switchTabView(reportTabView, document.querySelector('.tab-analysis'));
        });
    }

    const mobPrint = document.getElementById('mob-btn-print-report');
    if (mobPrint) mobPrint.addEventListener('click', () => window.print());

    const mobShare = document.getElementById('mob-btn-share-report');
    if (mobShare && navigator.share) {
        mobShare.addEventListener('click', async () => {
            const last = window.__fairAiMobLastAnalysis;
            if (!last) return;
            try {
                await navigator.share({
                    title: 'FairAI audit',
                    text: `${last.decision} — fairness ${last.fairnessPct}% (${last.auditId})`,
                });
            } catch (_) { }
        });
    } else if (mobShare) {
        mobShare.addEventListener('click', () => {
            const last = window.__fairAiMobLastAnalysis;
            if (!last || !navigator.clipboard) return;
            navigator.clipboard.writeText(`${last.decision} — fairness ${last.fairnessPct}% — ${last.explanation}`).catch(() => { });
        });
    }

    // Toggle Switches and Settings
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');

            if (toggle.id === 'toggle-dark-mode') {
                if (toggle.classList.contains('active')) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            } else if (toggle.id === 'toggle-notifications') {
                if (toggle.classList.contains('active')) {
                    alert("Critical audit alerts enabled.");
                } else {
                    alert("Critical audit alerts disabled.");
                }
            }
        });
    });

    const settingLanguage = document.getElementById('setting-language');
    const languageValue = document.getElementById('language-value');
    if (settingLanguage && languageValue) {
        settingLanguage.addEventListener('click', () => {
            const languages = ['English (US)', 'Spanish (ES)', 'French (FR)', 'German (DE)'];
            let current = languageValue.innerText;
            let nextIndex = (languages.indexOf(current) + 1) % languages.length;
            languageValue.innerText = languages[nextIndex];
        });
    }

    // Logout Action
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fairAiMobileSignOut();
            profileView.classList.add('hidden');
            loginView.classList.remove('hidden');
            if (loginForm) loginForm.reset();
        });
    }
    // Custom Dropdown Logic
    const dropdown = document.getElementById('domain-dropdown');
    if (dropdown) {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const optionsList = dropdown.querySelector('.dropdown-options');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const selectedValue = dropdown.querySelector('.selected-value');

        trigger.addEventListener('click', () => {
            optionsList.classList.toggle('hidden');
            const arrow = trigger.querySelector('.dropdown-arrow');
            arrow.style.transform = optionsList.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            arrow.style.transition = 'transform 0.3s ease';
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedValue.textContent = option.textContent;
                optionsList.classList.add('hidden');
                trigger.querySelector('.dropdown-arrow').style.transform = 'rotate(0deg)';
            });
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                optionsList.classList.add('hidden');
                trigger.querySelector('.dropdown-arrow').style.transform = 'rotate(0deg)';
            }
        });

        window.setMobileAuditDomain = (val) => {
            const options = dropdown.querySelectorAll('.dropdown-option');
            options.forEach(opt => {
                if (opt.dataset.value === val) {
                    opt.click();
                }
            });
        };
    }

    // Voice to Text Feature
    const micBtn = document.getElementById('voice-to-text-btn');
    const textArea = document.getElementById('audit-profile-text');

    if (micBtn && textArea) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            let isListening = false;

            micBtn.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error('Recognition already started');
                    }
                }
            });

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('listening');
                micBtn.querySelector('.material-symbols-outlined').textContent = 'graphic_eq';
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove('listening');
                micBtn.querySelector('.material-symbols-outlined').textContent = 'mic';
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const currentText = textArea.value;
                textArea.value = currentText + (currentText.length > 0 ? ' ' : '') + transcript;
            }

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                micBtn.classList.remove('listening');
                micBtn.querySelector('.material-symbols-outlined').textContent = 'mic';
            };
        } else {
            micBtn.style.display = 'none';
        }
    }

    // File Upload / Drop Zone Logic
    const dropZone = document.getElementById('audit-drop-zone');
    const fileInput = document.getElementById('audit-file-input');
    const dropText = dropZone?.querySelector('.drop-text');
    const dropIcon = dropZone?.querySelector('.drop-icon');

    if (dropZone && fileInput) {
        async function handleAuditFileSelection(file) {
            if (!file) return;
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            showAuditErr('');

            if (['csv', 'json'].includes(ext)) {
                if (dropText) {
                    dropText.textContent = `Structured: ${file.name} (Analyze sends file)`;
                    dropText.style.color = '#2563eb';
                }
                if (dropIcon) {
                    dropIcon.textContent = 'table_chart';
                    dropIcon.style.color = '#10b981';
                }
                return;
            }

            if (typeof window.fairAiExtractDocumentFile !== 'function') {
                showAuditErr('Document extraction unavailable. Open the app over http(s) so /script.js and parsers load.');
                if (dropText) {
                    dropText.textContent = 'Upload unavailable';
                    dropText.style.color = '#ef4444';
                }
                fileInput.value = '';
                return;
            }

            if (dropText) {
                dropText.textContent = 'Extracting text…';
                dropText.style.color = '#64748b';
            }
            if (dropIcon) {
                dropIcon.textContent = 'hourglass_empty';
                dropIcon.style.color = '#f59e0b';
            }

            const res = await window.fairAiExtractDocumentFile(file);
            if (!res.ok) {
                showAuditErr(res.error || 'Could not read this file.');
                if (dropText) {
                    dropText.textContent = 'Tap to try another file';
                    dropText.style.color = '#ef4444';
                }
                if (dropIcon) {
                    dropIcon.textContent = 'error';
                    dropIcon.style.color = '#ef4444';
                }
                fileInput.value = '';
                return;
            }

            const textarea = document.getElementById('audit-profile-text');
            if (textarea) textarea.value = res.text;
            if (dropText) {
                dropText.textContent = `Imported: ${file.name}`;
                dropText.style.color = '#10b981';
            }
            if (dropIcon) {
                dropIcon.textContent = 'check_circle';
                dropIcon.style.color = '#10b981';
            }
            fileInput.value = '';
        }

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async () => {
            if (fileInput.files.length > 0) {
                await handleAuditFileSelection(fileInput.files[0]);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        ['dragleave', 'dragend'].forEach(type => {
            dropZone.addEventListener(type, () => {
                dropZone.classList.remove('drag-over');
            });
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                const f = e.dataTransfer.files[0];
                try {
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    fileInput.files = dt.files;
                } catch (err) {
                    console.warn(err);
                }
                await handleAuditFileSelection(f);
            }
        });
    }

    // Password Visibility Toggle Logic
    const visibilityToggles = document.querySelectorAll('.visibility-toggle');
    visibilityToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.textContent = 'visibility_off';
                } else {
                    input.type = 'password';
                    this.textContent = 'visibility';
                }
            }
        });
    });

    // Profile Popup Logic
    const avatarTriggers = document.querySelectorAll('.profile-avatar-trigger');

    avatarTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const popup = trigger.querySelector('.profile-popup');

            // Close other popups
            document.querySelectorAll('.profile-popup').forEach(p => {
                if (p !== popup) p.classList.add('hidden');
            });

            if (popup) popup.classList.toggle('hidden');
        });

        const profileBtn = trigger.querySelector('.profile-dashboard-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                trigger.querySelector('.profile-popup').classList.add('hidden');

                const tabProfile = document.querySelector('.tab-profile');
                switchTabView(profileView, tabProfile);
            });
        }

        const popupLogoutBtn = trigger.querySelector('.popup-logout-btn');
        if (popupLogoutBtn) {
            popupLogoutBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                trigger.querySelector('.profile-popup').classList.add('hidden');
                await fairAiMobileSignOut();
            });
        }
    });

    // Signup Password Toggle
    const signupPassInput = document.getElementById('signup-password');
    const signupToggle = document.querySelector('.signup-visibility-toggle');
    if (signupPassInput && signupToggle) {
        signupToggle.addEventListener('click', () => {
            const isPass = signupPassInput.type === 'password';
            signupPassInput.type = isPass ? 'text' : 'password';
            signupToggle.textContent = isPass ? 'visibility_off' : 'visibility';
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.profile-popup').forEach(p => p.classList.add('hidden'));
    });

    // End of DOMContentLoaded
});

// 3D Orbit Hero Logic
(() => {
    const hero = document.getElementById("hero3d");
    const orbit = document.getElementById("orbit");
    const particleLayer = document.getElementById("particleLayer");
    const cards = Array.from(document.querySelectorAll(".orbit-card"));
    if (!hero || !orbit || !particleLayer || cards.length === 0) return;

    let heroRect = hero.getBoundingClientRect();
    let orbitPaused = false;
    let orbitRotationDeg = 0;
    let lastTs = 0;
    const ORBIT_SECONDS_PER_ROTATION = 26;
    const ORBIT_DEG_PER_SECOND = 360 / ORBIT_SECONDS_PER_ROTATION;

    function placeCards() {
        const cardRadius = Math.min(heroRect.width * 0.45, 260);
        const zDepth = -Math.min(heroRect.width * 0.03, 28);

        cards.forEach((card) => {
            const baseAngle = Number(card.style.getPropertyValue("--angle-deg")) || Number(card.dataset.angle || 0);
            const angle = baseAngle + orbitRotationDeg;
            card.style.transform = [
                "translate(-50%, -50%)",
                `rotateZ(${angle}deg)`,
                `translateX(${cardRadius}px)`,
                `rotateZ(${-angle}deg)`,
                "rotateX(-65deg)",
                `translateZ(${zDepth}px)`,
                "scale(0.98)"
            ].join(" ");
        });
    }

    function hydrateAngles() {
        cards.forEach((card, idx) => {
            const angle = idx * 60;
            card.dataset.angle = String(angle);
            card.style.setProperty("--angle-deg", String(angle));
        });
    }

    function createParticles() {
        const count = Math.max(18, Math.floor(heroRect.width / 52));
        particleLayer.innerHTML = "";

        for (let i = 0; i < count; i += 1) {
            const dot = document.createElement("span");
            dot.className = "particle";
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const size = 1.5 + Math.random() * 3.8;
            const dx = -36 + Math.random() * 72;
            const dy = -120 - Math.random() * 180;
            const duration = 7 + Math.random() * 9;
            const delay = -Math.random() * 10;

            dot.style.left = `${left}%`;
            dot.style.top = `${top}%`;
            dot.style.setProperty("--size", `${size}px`);
            dot.style.setProperty("--dx", `${dx}px`);
            dot.style.setProperty("--dy", `${dy}px`);
            dot.style.setProperty("--duration", `${duration}s`);
            dot.style.setProperty("--delay", `${delay}s`);
            particleLayer.appendChild(dot);
        }
    }

    function setOrbitPause(state) {
        orbitPaused = state;
    }

    cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
            setOrbitPause(true);
            const base = card.style.transform || "";
            card.dataset.baseTransform = base;
            card.style.transform = `${base} scale(1.08)`;
            card.style.zIndex = "20";
        });

        card.addEventListener("mouseleave", () => {
            setOrbitPause(false);
            if (card.dataset.baseTransform) {
                card.style.transform = card.dataset.baseTransform;
            }
            card.style.zIndex = "1";
        });
    });

    function recalc() {
        heroRect = hero.getBoundingClientRect();
        placeCards();
        createParticles();
    }

    function animate(ts) {
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        if (heroRect.width === 0) {
            heroRect = hero.getBoundingClientRect();
            if (heroRect.width > 0) {
                recalc();
            }
        }

        if (!orbitPaused && heroRect.width > 0) {
            orbitRotationDeg = (orbitRotationDeg + ORBIT_DEG_PER_SECOND * dt) % 360;
            placeCards();
        }
        requestAnimationFrame(animate);
    }

    hydrateAngles();
    recalc();
    window.addEventListener("resize", recalc);
    requestAnimationFrame(animate);
})();

// ── GAME OVERLAY LOGIC ───────────────────────────────────────────
function closeLowCreditsModal() {
    const m = document.getElementById("low-credits-modal");
    const o = document.getElementById("low-credits-overlay");
    if (m) m.classList.remove("active");
    if (o) o.classList.remove("active");
}

function openGameOverlay() {
    closeLowCreditsModal();
    const bg = document.getElementById("game-overlay-bg");
    const pan = document.getElementById("game-overlay");
    const fr = document.getElementById("game-iframe");
    if (!bg || !pan || !fr) return;

    bg.style.display = "block";
    pan.style.display = "flex";
    // Force reflow
    void pan.offsetWidth;
    bg.classList.add("game-ui-open");
    pan.classList.add("game-ui-open");
    fr.src = "/Game/index.html";
    document.body.style.overflow = "hidden";
}

function closeGameOverlay() {
    const bg = document.getElementById("game-overlay-bg");
    const pan = document.getElementById("game-overlay");
    const fr = document.getElementById("game-iframe");
    if (!bg || !pan || !fr) return;

    bg.classList.remove("game-ui-open");
    pan.classList.remove("game-ui-open");
    setTimeout(() => {
        bg.style.display = "none";
        pan.style.display = "none";
        fr.src = "";
        document.body.style.overflow = "";
    }, 280);
}

window.closeLowCreditsModal = closeLowCreditsModal;
window.openGameOverlay = openGameOverlay;
window.closeGameOverlay = closeGameOverlay;
