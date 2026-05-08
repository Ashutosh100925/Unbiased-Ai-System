import { firebaseInitPromise } from "./firebase.js";

if (typeof window.hideSignInModal !== "function") {
    window.hideSignInModal = function () { };
}
if (typeof window.showSignInModal !== "function") {
    window.showSignInModal = function () {
        const loginView = document.getElementById("login-view");
        if (loginView) {
            document.querySelectorAll(".view").forEach((v) => {
                v.classList.add("hidden");
            });
            loginView.classList.remove("hidden");
            const bottomNav = document.querySelector(".bottom-nav");
            if (bottomNav) bottomNav.classList.add("hidden");
            return;
        }
        alert("Please sign in with Google from the login screen.");
    };
}

let auth = null;
let provider = null;
let config = null;
import {
    signInWithPopup,
    signInWithCredential,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    getAdditionalUserInfo,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export let currentUser = null;
let pendingCallback = null;
const UNLIMITED_CREDITS_MODE = false;
const UNLIMITED_CREDITS_LABEL = "Unlimited";
const DEFAULT_INITIAL_CREDITS = 10;

function creditsStorageKeyForUser(user) {
    return `credits_${user.uid}`;
}

function ensureInitialCredits() {
    if (!currentUser) return;
    if (UNLIMITED_CREDITS_MODE) return;
    const key = creditsStorageKeyForUser(currentUser);
    const stored = localStorage.getItem(key);
    if (stored === null) {
        localStorage.setItem(key, String(DEFAULT_INITIAL_CREDITS));
    }
}

function safeParseCredits(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}
// Credit System Logic
window.getUserCredits = () => {
    if (!currentUser) return 0;
    if (UNLIMITED_CREDITS_MODE) return Number.POSITIVE_INFINITY;
    const key = creditsStorageKeyForUser(currentUser);
    const stored = localStorage.getItem(key);
    return stored !== null ? safeParseCredits(stored, DEFAULT_INITIAL_CREDITS) : DEFAULT_INITIAL_CREDITS;
};

window.addCredits = (amount) => {
    if (!currentUser) return false;
    if (UNLIMITED_CREDITS_MODE) {
        updateCreditsUI();
        return true;
    }
    ensureInitialCredits();
    let credits = window.getUserCredits();
    credits += amount;
    localStorage.setItem(creditsStorageKeyForUser(currentUser), String(credits));
    updateCreditsUI();
};

window.deductCredits = (amount) => {
    if (!currentUser) return false;
    if (UNLIMITED_CREDITS_MODE) {
        updateCreditsUI();
        return true;
    }
    ensureInitialCredits();
    let credits = window.getUserCredits();
    if (credits >= amount) {
        credits -= amount;
        localStorage.setItem(creditsStorageKeyForUser(currentUser), String(credits));
        updateCreditsUI();
        return true;
    }
    return false;
};

window.updateCreditsUI = function () {
    const label = (typeof UNLIMITED_CREDITS_MODE !== 'undefined' && UNLIMITED_CREDITS_MODE)
        ? `${UNLIMITED_CREDITS_LABEL} AI credits`
        : `${window.getUserCredits()} AI credits`;

    document.querySelectorAll(".ai-credits-display").forEach((el) => {
        el.textContent = label;
    });

    document.querySelectorAll("[data-fairai-user-credits]").forEach((el) => {
        el.textContent = label;
    });
}

window.checkCredits = (amount = 2) => {
    return window.getUserCredits() >= amount;
};

window.executeWithCredits = (callback, amount = 2) => {
    if (window.checkCredits(amount)) {
        // Callback will handle deduction upon success
        callback();
    } else {
        const modal = document.getElementById('low-credits-modal');
        const overlay = document.getElementById('low-credits-overlay');
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
        } else {
            alert(`Not enough AI credits to run analysis. You need ${amount} credits.`);
        }
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LEVEL_COMPLETED') {
        window.addCredits(5);

        const toast = document.createElement('div');
        const isMobileShell = !!document.getElementById('login-view');
        if (isMobileShell) {
            toast.style.cssText =
                'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483646;' +
                'background:#34D399;color:#064E3B;padding:12px 20px;border-radius:999px;font-weight:700;' +
                'font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.35);pointer-events:none;' +
                'display:flex;align-items:center;gap:8px;transition:opacity 0.3s;max-width:92vw;';
        } else {
            toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-[#34D399] text-[#064E3B] px-6 py-3 rounded-full font-bold shadow-xl z-[99999] transition-opacity duration-300 pointer-events-none border border-[#059669]/20 flex items-center gap-2';
        }
        toast.innerHTML = `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> +5 AI Credits Earned!`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

// Initialize Auth state tracking once ready
firebaseInitPromise.then((fb) => {
    auth = fb.auth;
    provider = fb.provider;
    config = fb.config;

    if (auth) {
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) ensureInitialCredits();
            updateAuthUI(user);

            if (user && pendingCallback) {
                const callback = pendingCallback;
                pendingCallback = null;
                window.executeWithCredits(callback);
            }
        });
    } else {
        console.warn("Auth object is null. Firebase features are disabled.");
    }
});


// UI update logic
function updateAuthUI(user) {
    const signInBtns = document.querySelectorAll('.btn-ghost');
    const userProfileContainer = document.getElementById('user-profile-container');
    const mobileNavActions = document.querySelector('#mobile-nav-drawer .nav-actions');

    if (user) {
        // User is signed in
        signInBtns.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === 'sign in') {
                btn.style.display = 'none';
            }
        });

        if (userProfileContainer) {
            userProfileContainer.innerHTML = `
        <div class="user-profile flex items-center gap-3 cursor-pointer group relative">
          <img src="${user.photoURL || 'https://via.placeholder.com/40'}" alt="${user.displayName}" class="w-10 h-10 rounded-full border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all shadow-lg" onclick="toggleUserDropdown()">
          
          <div id="user-dropdown" class="hidden absolute top-full right-0 mt-4 w-[360px] bg-[#2D2E30] rounded-[28px] shadow-[0_24px_54px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] border border-white/5">
            <!-- Header -->
            <div class="flex items-center justify-center px-6 pt-6 pb-4 relative">
                <span class="text-white text-[22px] font-medium tracking-tight">Google</span>
                <button onclick="toggleUserDropdown()" class="absolute right-4 top-5 p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Profile Info -->
            <div class="px-6 py-4 flex flex-col items-center text-center">
                <div class="relative mb-3">
                    <img src="${user.photoURL || 'https://via.placeholder.com/40'}" class="w-20 h-20 rounded-full border-4 border-white/5 shadow-xl">
                </div>
                <h3 class="text-xl font-medium text-white">${user.displayName}</h3>
                <p class="text-sm text-gray-400 mb-6">${user.email}</p>

                <!-- Credits Box -->
                <div class="w-full bg-[#3C4043] rounded-2xl p-4 mb-4 flex items-center justify-between text-left border border-white/5">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 3L14.5 9L21 10L16 14.5L17.5 21L12 18L6.5 21L8 14.5L3 10L9.5 9L12 3Z" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <span id="ai-credits-display" class="ai-credits-display text-white font-medium underline underline-offset-4 decoration-white/60">${UNLIMITED_CREDITS_MODE ? `${UNLIMITED_CREDITS_LABEL} AI credits` : `${window.getUserCredits()} AI credits`}</span>
                        </div>
                        <p class="text-[13px] text-gray-400">Credits refresh daily</p>
                    </div>
                    <button onclick="toggleUserDropdown(); openGameOverlay()" class="bg-[#E8EAED] text-[#202124] px-6 py-2.5 rounded-full font-medium text-sm hover:bg-white transition-colors">Upgrade</button>
                </div>


                <!-- Action Buttons -->

                <!-- Action Buttons -->
                <div class="w-full space-y-2">
                    <a href="https://myaccount.google.com/" target="_blank" class="block w-full py-3 bg-[#1A1C1E] text-white rounded-full font-medium hover:bg-[#242628] transition-colors no-underline">Manage Account</a>
                    <button onclick="handleLogout()" class="w-full py-3 bg-[#1A1C1E] text-white rounded-full font-medium hover:bg-[#242628] transition-colors">Sign out</button>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-gray-500 border-t border-white/5 mt-2">
                <a href="#" class="hover:text-gray-300">Privacy</a>
                <span>•</span>
                <a href="#" class="hover:text-gray-300">Terms of Service</a>
                <span>•</span>
                <a href="#" class="hover:text-gray-300">Licenses</a>
            </div>
          </div>
        </div>
      `;
            userProfileContainer.classList.remove('hidden');
        }

        // Update mobile drawer
        if (mobileNavActions) {
            const existingProfile = mobileNavActions.querySelector('.mobile-user-profile');
            if (!existingProfile) {
                const profileDiv = document.createElement('div');
                profileDiv.className = 'mobile-user-profile flex items-center gap-3 p-4 border-t border-white/5 mt-4';
                profileDiv.innerHTML = `
                <img src="${user.photoURL || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-full border-2 border-purple-500">
                <div>
                    <p class="font-bold text-white">${user.displayName}</p>
                    <button onclick="handleLogout()" class="text-sm text-red-400 mt-1">Logout</button>
                </div>
            `;
                mobileNavActions.appendChild(profileDiv);
            }
        }
    } else {
        // User is signed out
        signInBtns.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === 'sign in') {
                btn.style.display = '';
            }
        });
        if (userProfileContainer) {
            userProfileContainer.innerHTML = '';
            userProfileContainer.classList.add('hidden');
        }
        const mobileProfile = document.querySelector('.mobile-user-profile');
        if (mobileProfile) mobileProfile.remove();
    }
}

function buildMobileAuthProfileHtml(user) {
    return "";
}


// Global functions for HTML access
window.toggleUserDropdown = () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
};

window.handleLogout = async () => {
    if (!auth) await firebaseInitPromise;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
};

window.handleGoogleSignIn = async () => {
    if (!auth) await firebaseInitPromise;

    if (!auth) {
        if (config && config.apiKey === "MISSING_API_KEY") {
            const msg = (config.missing && config.missing.length > 0) 
                ? `Missing: ${config.missing.join(", ")}` 
                : "Firebase API Key is missing";
            alert(`Configuration Error: ${msg}. Ensure Vercel Environment Variables are set and redeployed.`);
        } else {
            alert("Firebase initialization failed. Please try again.");
        }
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const credential = GoogleAuthProvider.credentialFromResult(result);
        
        // Save the credential and user info for later
        window.__fairAiGooglePendingCredential = credential;
        window.__fairAiGooglePendingEmail = user.email;
        window.__fairAiGooglePendingName = user.displayName;
        window.__fairAiGoogleIsNewUser = !!(getAdditionalUserInfo(result)?.isNewUser);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        window.__fairAiGooglePendingOtp = otp;

        // IMMEDIATELY SIGN OUT so the app doesn't think we are logged in yet
        await signOut(auth);
        currentUser = null;

        // Send OTP via backend
        try {
            let origin = "";
            if (typeof location !== "undefined") {
                const h = location.hostname;
                const p = location.port || "";
                if ((h === "127.0.0.1" || h === "localhost") && p && p !== "8000" && p !== "3000" && p !== "") {
                    origin = `http://${h === "localhost" ? "127.0.0.1" : h}:8000`;
                }
            }

            const response = await fetch(`${origin}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: window.__fairAiGooglePendingEmail, otp: otp })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Backend Error (500):", errorData.error);
                if (errorData.detail) console.groupCollapsed("Traceback Details");
                if (errorData.detail) console.log(errorData.detail);
                if (errorData.detail) console.groupEnd();
                
                // Show a user-friendly alert
                alert("Failed to send verification email. Please check your internet connection and backend logs.\n\nError: " + errorData.error);
            } else {
                console.log("OTP sent successfully to backend.");
            }
        } catch (err) {
            console.error("Fetch Network Error:", err);
            alert("Network error: Could not connect to backend server.");
        }

        // Show OTP UI
        const desktopOtp = document.getElementById('google-auth-otp');
        const desktopInitial = document.getElementById('google-auth-initial');
        const mobileOtpView = document.getElementById('otp-view');
        const mobileLoginView = document.getElementById('login-view');

        if (desktopOtp && desktopInitial) {
            desktopInitial.classList.add('hidden');
            desktopOtp.classList.remove('hidden');
        } else if (mobileOtpView && mobileLoginView) {
            mobileLoginView.classList.add('hidden');
            mobileOtpView.classList.remove('hidden');
            const subtitle = mobileOtpView.querySelector('.subtitle');
            if (subtitle) subtitle.textContent = `Verify your Google account: code sent to ${window.__fairAiGooglePendingEmail}`;
        }

    } catch (error) {
        alert("Sign in failed: " + error.message);
        console.error("Detailed sign-in error:", error);
    }
};

async function finalizeGoogleLogin() {
    console.log("Entering finalizeGoogleLogin...");
    try {
        const credential = window.__fairAiGooglePendingCredential;
        console.log("Pending Credential found:", !!credential);
        if (!credential) {
            console.warn("No pending credential found in window object.");
            return;
        }

        // Clear pending data BEFORE signing in so any listeners see it's finished
        console.log("Clearing pending OTP states...");
        window.__fairAiGooglePendingOtp = null;
        window.__fairAiGooglePendingEmail = null;

        // NOW SIGN IN FOR REAL
        console.log("Calling signInWithCredential...");
        const result = await signInWithCredential(auth, credential);
        console.log("signInWithCredential success! User:", result.user.email);
        
        currentUser = result.user;
        window.__fairAiGooglePendingCredential = null; // Clear credential only after success
        ensureInitialCredits();
        
        // Send Welcome Email and force onboarding if new user
        if (window.__fairAiGoogleIsNewUser) {
            console.log("New user detected, ensuring onboarding flag is clear...");
            localStorage.removeItem('fairai_mobile_onboarded');
            
            console.log("sending welcome email...");
            try {
                const welcomePayload = {
                    email: currentUser.email,
                    name: currentUser.displayName || "User"
                };
                
                let origin = "";
                if (typeof location !== "undefined") {
                    const h = location.hostname;
                    const p = location.port || "";
                    if ((h === "127.0.0.1" || h === "localhost") && p && p !== "8000" && p !== "3000" && p !== "") {
                        origin = `http://${h === "localhost" ? "127.0.0.1" : h}:8000`;
                    }
                }

                fetch(`${origin}/api/send-welcome`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(welcomePayload)
                }).catch(err => console.error("Welcome email failed:", err));
            } catch (err) {
                console.error("Welcome email logic failed:", err);
            }
        }

        // Update UI
        console.log("Updating UI...");
        
        // --- TRANSITION TO SUCCESS VIEW ---
        const desktopOtp = document.getElementById('google-auth-otp');
        const desktopSuccess = document.getElementById('google-auth-success');
        const mobileOtpView = document.getElementById('otp-view');
        const signinCancelBtn = document.getElementById('signin-cancel-btn');
        
        if (desktopOtp && desktopSuccess) {
            desktopOtp.classList.add('hidden');
            desktopSuccess.classList.remove('hidden');
            if (signinCancelBtn) signinCancelBtn.classList.add('hidden');
        } else if (mobileOtpView) {
            mobileOtpView.classList.add('hidden');
            if (typeof window.hideSignInModal === 'function') window.hideSignInModal();
        }

        if (typeof window.updateMobileUI === 'function') {
            console.log("Calling updateMobileUI...");
            window.updateMobileUI(currentUser);
        }

        if (pendingCallback) {
            console.log("Executing pending callback...");
            const callback = pendingCallback;
            pendingCallback = null;
            window.executeWithCredits(callback);
        }
        console.log("finalizeGoogleLogin complete.");
    } catch (error) {
        console.error("Error in finalizeGoogleLogin:", error);
        alert("Final sign in failed: " + error.message);
    }
}

window.verifyGoogleOtp = async () => {
    // Get entered OTP from fields
    const desktopFields = document.querySelectorAll('.otp-field');
    const mobileFields = document.querySelectorAll('.otp-digit');
    const fields = desktopFields.length > 0 ? desktopFields : mobileFields;
    
    console.log("Verifying OTP... Fields found:", fields.length);
    const enteredOtp = Array.from(fields).map(f => f.value).join('');
    console.log("Entered OTP:", enteredOtp);
    console.log("Expected OTP:", window.__fairAiGooglePendingOtp);
    
    if (enteredOtp.length !== 6) {
        alert("Please enter the 6-digit code.");
        return;
    }

    if (enteredOtp === window.__fairAiGooglePendingOtp) {
        console.log("OTP Match! Calling finalizeGoogleLogin...");
        try {
            await finalizeGoogleLogin();
            console.log("finalizeGoogleLogin successfully called.");
        } catch (err) {
            console.error("Error calling finalizeGoogleLogin:", err);
            alert("Verification error: " + err.message);
        }
        
        // Clean up UI
        const desktopOtp = document.getElementById('google-auth-otp');
        const desktopInitial = document.getElementById('google-auth-initial');
        if (desktopOtp && desktopInitial) {
            desktopOtp.classList.add('hidden');
            desktopInitial.classList.remove('hidden');
        }
        fields.forEach(f => f.value = '');
    } else {
        console.warn("OTP Mismatch.");
        alert("Invalid verification code. Please try again.");
        fields.forEach(f => f.value = '');
        if (fields[0]) fields[0].focus();
    }
};

window.resetGoogleSignIn = async () => {
    const desktopOtp = document.getElementById('google-auth-otp');
    const desktopInitial = document.getElementById('google-auth-initial');
    const mobileOtpView = document.getElementById('otp-view');
    const mobileLoginView = document.getElementById('login-view');

    if (desktopOtp && desktopInitial) {
        desktopOtp.classList.add('hidden');
        desktopInitial.classList.remove('hidden');
    } else if (mobileOtpView && mobileLoginView) {
        mobileOtpView.classList.add('hidden');
        mobileLoginView.classList.remove('hidden');
    }

    // Sign out since login wasn't finalized
    window.__fairAiGooglePendingOtp = null;
    window.__fairAiGooglePendingUser = null;
    if (auth) await signOut(auth);
};

window.handleEmailSignUp = async (name, email, password) => {
    if (!auth) await firebaseInitPromise;
    if (!auth) {
        alert("Auth not initialized");
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        currentUser = userCredential.user;
        ensureInitialCredits();

        // Send Welcome Email
        try {
            const welcomePayload = {
                email: email,
                name: name || "User"
            };
            
            let origin = "";
            if (typeof location !== "undefined") {
                const h = location.hostname;
                const p = location.port || "";
                if ((h === "127.0.0.1" || h === "localhost") && p && p !== "8000" && p !== "3000" && p !== "") {
                    origin = `http://${h === "localhost" ? "127.0.0.1" : h}:8000`;
                }
            }

            fetch(`${origin}/api/send-welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(welcomePayload)
            }).catch(err => console.error("Welcome email fetch failed:", err));
        } catch (err) {
            console.error("Welcome email logic failed:", err);
        }

        if (typeof window.hideSignInModal === 'function') window.hideSignInModal();
        if (pendingCallback && typeof window.executeWithCredits === 'function') {
            const callback = pendingCallback;
            pendingCallback = null;
            window.executeWithCredits(callback);
        }
        return userCredential;
    } catch (error) {
        alert("Sign up failed: " + error.message);
        console.error("Sign-up error:", error);
    }
};

window.handleEmailSignIn = async (email, password) => {
    if (!auth) await firebaseInitPromise;
    if (!auth) {
        alert("Auth not initialized");
        return;
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        ensureInitialCredits();
        if (pendingCallback && typeof window.executeWithCredits === 'function') {
            const callback = pendingCallback;
            pendingCallback = null;
            window.executeWithCredits(callback);
        }
        return userCredential;
    } catch (error) {
        alert("Login failed: " + error.message);
        console.error("Login error:", error);
    }
};

window.requireSignInBeforeAnalysis = (callback) => {
    if (currentUser) {
        window.executeWithCredits(callback);
    } else {
        pendingCallback = callback;
        window.showSignInModal();
    }
};

// Modal logic moved to index.html to guarantee it works immediately

// hideSignInModal moved to index.html

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const profile = document.querySelector('.user-profile');
    const dropdown = document.getElementById('user-dropdown');
    if (profile && !profile.contains(e.target)) {
        if (dropdown) dropdown.classList.add('hidden');
    }
});

// Hook into general sign-in buttons as a backup
document.addEventListener('DOMContentLoaded', () => {
    console.log("Auth script initialized, attaching backup listeners...");
    document.querySelectorAll('.btn-ghost').forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === 'sign in') {
            btn.onclick = (e) => {
                e.preventDefault();
                window.showSignInModal();
            };
        }
    });

    document.getElementById("google-signin-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.handleGoogleSignIn();
    });
});
