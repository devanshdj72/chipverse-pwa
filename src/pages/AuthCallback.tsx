import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { setAccessToken } from "@/lib/api";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState("Completing sign in…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const error  = params.get("error");

    if (error) {
      setStatus("Sign in failed. Redirecting…");
      setTimeout(() => setLocation("/login"), 2000);
      return;
    }

    if (token) {
      setAccessToken(token);
      localStorage.setItem("chipverse_oauth_token", token);
      setStatus("Signed in! Loading your dashboard…");
      setTimeout(() => setLocation("/dashboard"), 300);
      return;
    }

    // No token yet — wait for page to fully load (GitHub Pages 404 redirect)
    const timer = setTimeout(() => {
      const p2    = new URLSearchParams(window.location.search);
      const t2    = p2.get("token");
      const err2  = p2.get("error");

      if (err2) { setStatus("Sign in failed. Redirecting…"); setTimeout(() => setLocation("/login"), 1500); return; }
      if (t2)   { setAccessToken(t2); localStorage.setItem("chipverse_oauth_token", t2); setLocation("/dashboard"); return; }

      setStatus("Sign in failed. Redirecting…");
      setTimeout(() => setLocation("/login"), 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const isError = status.includes("failed");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {!isError
          ? <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              style={{ animation: "spin 1s linear infinite" }} />
          : <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto mb-4 text-red-400 text-xl">✕</div>
        }
        <p className="text-gray-400 font-mono text-sm">{status}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
