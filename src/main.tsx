import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "@/lib/user";
import { SubscriptionConfigProvider } from "@/lib/SubscriptionConfig";
import { AdminProvider } from "@/hooks/useAdmin";

// ── Handle OAuth redirect FIRST — before anything else runs ──────────────────
// Backend redirects to /?oauth_token=xxx after Google/LinkedIn auth
(function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('oauth_token');
  const error  = params.get('oauth_error');
  if (token) {
    localStorage.setItem('chipverse_oauth_token', token);
    sessionStorage.setItem('oauth_redirect', '/dashboard');
    // Clean URL so React router doesn't see the params
    window.history.replaceState({}, '', '/chipverse-pwa/');
  } else if (error) {
    sessionStorage.setItem('oauth_error', error);
    window.history.replaceState({}, '', '/chipverse-pwa/');
  }
})();

// ── Mount React ───────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <AdminProvider>
      <SubscriptionConfigProvider>
        <App />
      </SubscriptionConfigProvider>
    </AdminProvider>
  </UserProvider>
);

// ── Register Service Worker ───────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
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
