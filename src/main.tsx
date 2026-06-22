import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "@/lib/user";

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <App />
  </UserProvider>
);

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[ChipVerse] Service Worker registered:", registration.scope);
        // Check for SW updates every 60s
        setInterval(() => registration.update(), 60_000);
      })
      .catch((err) => {
        console.warn("[ChipVerse] Service Worker registration failed:", err);
      });
  });
}
