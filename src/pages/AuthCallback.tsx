import { useEffect } from "react";
import { useLocation } from "wouter";
import { setAccessToken } from "@/lib/api";
import { useUserContext } from "@/lib/user";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { } = useUserContext();

  useEffect(() => {
    // Try current URL first
    let search = window.location.search;

    // If no params yet, check sessionStorage (GitHub Pages 404 redirect flow)
    if (!search) {
      const saved = sessionStorage.getItem("redirect");
      if (saved && saved.includes("?")) {
        search = saved.substring(saved.indexOf("?"));
        sessionStorage.removeItem("redirect");
      }
    }

    const params = new URLSearchParams(search);
    const token  = params.get("token");
    const error  = params.get("error");

    if (error) {
      setLocation("/login");
      return;
    }

    if (token) {
      setAccessToken(token);
      // Store in localStorage so user stays logged in on refresh
      localStorage.setItem("chipverse_oauth_token", token);
      setTimeout(() => setLocation("/dashboard"), 200);
      return;
    }

    // No token and no error — wait briefly then try again (page may still be loading)
    const timer = setTimeout(() => {
      const p2 = new URLSearchParams(window.location.search);
      const t2 = p2.get("token");
      if (t2) {
        setAccessToken(t2);
        setLocation("/dashboard");
      } else {
        setLocation("/login");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
          style={{ animation: "spin 1s linear infinite" }} />
        <p className="text-gray-400 font-mono text-sm">Completing sign in…</p>
        <p className="text-gray-600 text-xs mt-2">Please wait</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
