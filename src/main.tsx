import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "@/lib/user";
import { SubscriptionConfigProvider } from "@/lib/SubscriptionConfig";
import { AdminProvider } from "@/hooks/useAdmin";

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <AdminProvider>
      <SubscriptionConfigProvider>
        <App />
      </SubscriptionConfigProvider>
    </AdminProvider>
  </UserProvider>
);

// ── Handle OAuth redirect (Google/LinkedIn) ──────────────────────────────────
// Backend redirects to /?oauth_token=xxx — handle BEFORE React mounts
(function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('oauth_token');
  const error  = params.get('oauth_error');

  if (token) {
    // Save token then clean URL and go to dashboard
    localStorage.setItem('chipverse_oauth_token', token);
    window.history.replaceState({}, '', '/chipverse-pwa/');
    // Set a flag so user context picks it up
    sessionStorage.setItem('oauth_redirect', '/dashboard');
  } else if (error) {
    window.history.replaceState({}, '', '/chipverse-pwa/');
    sessionStorage.setItem('oauth_error', error);
  }
})();

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Use BASE_URL so sw.js resolves to /chipverse-pwa/sw.js on GitHub Pages
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        console.log("[ChipVerse] Service Worker registered:", registration.scope);
        setInterval(() => registration.update(), 60_000);
      })
      .catch((err) => {
        console.warn("[ChipVerse] Service Worker registration failed:", err);
      });
  });
}
