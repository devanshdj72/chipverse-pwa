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
