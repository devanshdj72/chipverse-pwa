// src/lib/SubscriptionConfig.tsx
// Single source of truth for whether the paywall is active.
// Every component reads from this context — super admin flips it once.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "./api";

interface SubscriptionConfigCtx {
  subscriptionEnabled: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const Ctx = createContext<SubscriptionConfigCtx>({
  subscriptionEnabled: false,
  isLoading: true,
  refetch: () => {},
});

export function SubscriptionConfigProvider({ children }: { children: ReactNode }) {
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.subscription.getConfig();
        if (!cancelled) setSubscriptionEnabled(res.data.subscriptionEnabled);
      } catch {}
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tick]);

  return (
    <Ctx.Provider value={{ subscriptionEnabled, isLoading, refetch: () => setTick(t => t + 1) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSubscriptionConfig = () => useContext(Ctx);
