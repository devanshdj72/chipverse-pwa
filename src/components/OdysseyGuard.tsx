import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useUserContext } from "@/lib/user";

const ODYSSEY_KEY = "chipverse_odyssey_seen";

// Routes that should never trigger odyssey redirect
const BYPASS_ROUTES = ["/odyssey", "/login", "/auth", "/admin"];

export default function OdysseyGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useUserContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (BYPASS_ROUTES.some(r => location.startsWith(r))) return;

    // Only redirect to odyssey if:
    // 1. User is authenticated
    // 2. User has never seen odyssey
    // 3. Not already on odyssey
    if (isAuthenticated && !localStorage.getItem(ODYSSEY_KEY)) {
      setLocation("/odyssey");
    }
  }, [isAuthenticated, isLoading, location]);

  return <>{children}</>;
}
