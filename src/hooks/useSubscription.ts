import { useState, useEffect } from "react";
import api from "@/lib/api";

interface UseSubscriptionResult {
  isSubscribed: boolean;
  isLoading: boolean;
  price: number;
  refetch: () => void;
}

const cache: Record<string, { isActive: boolean; price: number; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 min

export function useSubscription(domainId: string): UseSubscriptionResult {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState(999);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const cached = cache[domainId];
    if (cached && now - cached.ts < CACHE_TTL) {
      setIsSubscribed(cached.isActive);
      setPrice(cached.price);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [subRes, pricingRes] = await Promise.all([
          api.subscription.check(domainId),
          api.subscription.getPricing(),
        ]);
        if (cancelled) return;
        const isActive = subRes.data.isActive;
        const domainPrice = (pricingRes.data.domainPrices as any[]).find(p => p.domainId === domainId)?.price ?? 999;
        cache[domainId] = { isActive, price: domainPrice, ts: Date.now() };
        setIsSubscribed(isActive);
        setPrice(domainPrice);
      } catch {}
      if (!cancelled) setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [domainId, tick]);

  return {
    isSubscribed,
    isLoading,
    price,
    refetch: () => { delete cache[domainId]; setTick(t => t + 1); },
  };
}
