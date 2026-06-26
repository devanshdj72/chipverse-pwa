import { useEffect } from "react";
import { useLocation } from "wouter";

const ODYSSEY_KEY = "chipverse_odyssey_seen";

export default function Odyssey() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Listen for postMessage from the iframe when user clicks Continue
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "odyssey_complete") {
        localStorage.setItem(ODYSSEY_KEY, "true");
        // If replaying (already seen before), go back to dashboard
        // If first time, go to domains
        const referrer = sessionStorage.getItem('odyssey_referrer') || '/domains';
        sessionStorage.removeItem('odyssey_referrer');
        setLocation(referrer);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setLocation]);

  // Also poll localStorage in case postMessage doesn't fire (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem(ODYSSEY_KEY)) {
        clearInterval(interval);
        setLocation("/domains");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [setLocation]);

  const odysseySrc = `${import.meta.env.BASE_URL}vlsi-odyssey.html`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000" }}>
      <iframe
        src={odysseySrc}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="VLSI Odyssey"
        allow="autoplay"
      />
    </div>
  );
}
