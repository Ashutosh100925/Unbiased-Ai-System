import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export let auth = null;
export let provider = null;
export let config = null;

async function initFirebase() {
  let apiBase = "";
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    if (location.port && location.port !== "8000" && location.port !== "3000") {
      apiBase = "http://127.0.0.1:8000";
    }
  }

  try {
    const response = await fetch(apiBase + "/api/firebase-config");
    config = await response.json();

    // If the backend returns null for apiKey, it means environment variables aren't set
    if (!config.apiKey || config.apiKey === "null" || config.apiKey === "None") {
      config.apiKey = "MISSING_API_KEY";
    }


    // Provide safe fallbacks for non-sensitive configuration
    config.authDomain = config.authDomain || "fair-ai.firebaseapp.com";
    config.projectId = config.projectId || "fair-ai";
    config.storageBucket = config.storageBucket || "fair-ai.firebasestorage.app";
    config.messagingSenderId = config.messagingSenderId || "892898039826";
    config.appId = config.appId || "1:892898039826:web:429092ad366721350fe0cb";

  } catch (error) {
    console.warn("Failed to fetch config from backend, using fallback");
    config = {
      apiKey: "MISSING_API_KEY",
      authDomain: "fair-ai.firebaseapp.com",
      projectId: "fair-ai",
      storageBucket: "fair-ai.firebasestorage.app",
      messagingSenderId: "892898039826",
      appId: "1:892898039826:web:429092ad366721350fe0cb"
    };
  }

  if (config.apiKey === "MISSING_API_KEY") {
    console.warn("Firebase API Key is missing. Ensure the backend is running and providing the configuration.");
  }

  try {
    const app = initializeApp(config);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }

  return { auth, provider, config };
}

// Export the promise so other modules can wait for it
export const firebaseInitPromise = initFirebase();
