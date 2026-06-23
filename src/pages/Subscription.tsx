import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import api from "@/lib/api";
import { DOMAIN_LIST } from "@/lib/data";
import CircuitBackground from "@/components/CircuitBackground";
import { useSubscriptionConfig } from "@/lib/SubscriptionConfig";

// ─── Domain icon colours (matching existing palette) ─────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  rtl: "#00f5ff", verification: "#a855f7", "physical-design": "#3b82f6",
  analog: "#f59e0b", fpga: "#10b981", embedded: "#f97316",
  dft: "#ec4899", research: "#8b5cf6",
};

const DOMAIN_ICONS: Record<string, string> = {
  rtl: "⬡", verification: "◈", "physical-design": "⬢", analog: "∿",
  fpga: "⊞", embedded: "◉", dft: "⌬", research: "◎",
};

interface DomainPrice { domainId: string; price: number; currency: string }
interface BundleDeal { domainCount: number; discount: number; label: string }

declare global { interface Window { Razorpay: any } }

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { subscriptionEnabled } = useSubscriptionConfig();
  const [pricing, setPricing] = useState<{ domainPrices: DomainPrice[]; bundles: BundleDeal[] }>({ domainPrices: [], bundles: [] });
  const [subscribed, setSubscribed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          api.subscription.getPricing(),
          api.subscription.getMy(),
        ]);
        setPricing(pRes.data);
        setSubscribed((sRes.data as any[]).map(s => s.domainId));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const getPrice = (domainId: string) =>
    pricing.domainPrices.find(p => p.domainId === domainId)?.price ?? 999;

  const activeDeal = pricing.bundles
    .filter(b => b.domainCount <= selected.length)
    .sort((a, b) => b.domainCount - a.domainCount)[0];

  const baseTotal = selected.reduce((sum, id) => sum + getPrice(id), 0);
  const discount = activeDeal?.discount ?? 0;
  const finalTotal = Math.round(baseTotal * (1 - discount / 100));

  const toggleDomain = (id: string) => {
    if (subscribed.includes(id)) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePay = async () => {
    if (!selected.length) return;
    setPaying(true);
    try {
      const res = await api.subscription.createOrder(selected);
      const { orderId, amount, keyId } = res.data;

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: "INR",
        name: "ChipVerse",
        description: `Access to: ${selected.join(", ")}`,
        order_id: orderId,
        theme: { color: "#FF3C00" },
        handler: async (response: any) => {
          try {
            await api.subscription.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast("🎉 Subscription activated!", "success");
            setSubscribed(prev => [...new Set([...prev, ...selected])]);
            setSelected([]);
          } catch {
            showToast("Payment verified but activation failed. Contact support.", "error");
          }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
        prefill: {},
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      showToast(e.message ?? "Payment failed", "error");
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-['Orbitron'] text-sm">Loading pricing...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-32 px-4 relative overflow-hidden">
      <CircuitBackground />

      {/* Free access banner when subscription is disabled */}
      {!subscriptionEnabled && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-500/15 border border-emerald-500/40
          text-emerald-300 text-sm px-6 py-2.5 rounded-full shadow-lg backdrop-blur-md whitespace-nowrap">
          🎉 Free Access Mode — All domains unlocked by admin. No payment needed right now!
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-semibold shadow-2xl
          ${toast.type === "success" ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border border-red-500/50 text-red-300"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-xs font-['Orbitron'] tracking-widest uppercase">Unlock Full Access</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-['Orbitron'] leading-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Domains</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Complete Level 1 free on every domain. Subscribe to unlock the full roadmap and reach industry-level mastery.
          </p>
        </div>

        {/* Bundle Deals Banner */}
        {pricing.bundles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {pricing.bundles.map(b => {
              const isActive = selected.length >= b.domainCount;
              return (
                <div key={b.domainCount}
                  className={`relative rounded-2xl border p-4 transition-all duration-300
                    ${isActive
                      ? "border-orange-500/60 bg-orange-500/10 shadow-[0_0_24px_rgba(249,115,22,0.2)]"
                      : "border-white/10 bg-white/5"}`}>
                  <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full
                    ${isActive ? "bg-orange-500 text-white" : "bg-white/10 text-gray-400"}`}>
                    {isActive ? "✓ Applied" : "Available"}
                  </div>
                  <div className="text-2xl font-black text-white font-['Orbitron']">{b.discount}% OFF</div>
                  <div className="text-orange-400 font-semibold text-sm mt-1">{b.label}</div>
                  <div className="text-gray-500 text-xs mt-1">Pick any {b.domainCount}+ domains</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Domain Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {DOMAIN_LIST.map(domain => {
            const color = DOMAIN_COLORS[domain.id] ?? "#00f5ff";
            const icon = DOMAIN_ICONS[domain.id] ?? "⬡";
            const price = getPrice(domain.id);
            const isSubscribed = subscribed.includes(domain.id);
            const isSelected = selected.includes(domain.id);

            return (
              <div key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`relative group rounded-2xl border p-5 cursor-pointer transition-all duration-300
                  ${isSubscribed
                    ? "border-emerald-500/40 bg-emerald-500/5 cursor-default opacity-80"
                    : isSelected
                      ? `border-[${color}]/60 bg-white/8 shadow-[0_0_28px_${color}30]`
                      : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
                  }`}
                style={isSelected && !isSubscribed ? {
                  borderColor: color + "99",
                  boxShadow: `0 0 28px ${color}25`,
                } : {}}>

                {/* Selected checkmark */}
                {isSelected && !isSubscribed && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: color }}>
                    <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {isSubscribed && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div className="text-3xl mb-3 font-['Orbitron']" style={{ color }}>{icon}</div>

                {/* Name */}
                <h3 className="text-white font-bold text-base mb-1 font-['Orbitron'] leading-snug">{domain.name}</h3>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">{domain.tagline}</p>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">{domain.roadmap}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">{domain.difficultyLabel}</span>
                </div>

                {/* Price */}
                {isSubscribed ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-sm font-semibold">✓ Subscribed</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-black text-xl font-['Orbitron']">₹{price}</span>
                      <span className="text-gray-500 text-xs ml-1">/ lifetime</span>
                    </div>
                    <div className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all
                      ${isSelected ? "bg-white/15 text-white" : "bg-white/8 text-gray-400 group-hover:bg-white/12"}`}>
                      {isSelected ? "Selected" : "Select"}
                    </div>
                  </div>
                )}

                {/* Level 1 free tag */}
                {!isSubscribed && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-600">🔓 Level 1 always free</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Checkout Sticky Bar */}
        {selected.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

              {/* Selected summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-gray-400 text-sm">
                  {selected.length} domain{selected.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-1 flex-wrap">
                  {selected.map(id => {
                    const color = DOMAIN_COLORS[id];
                    const d = DOMAIN_LIST.find(x => x.id === id);
                    return (
                      <span key={id}
                        className="text-xs px-2 py-0.5 rounded-full border font-['Orbitron']"
                        style={{ borderColor: color + "60", color }}>
                        {d?.name ?? id}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  {discount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm line-through">₹{baseTotal}</span>
                      <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {activeDeal?.label} −{discount}%
                      </span>
                    </div>
                  )}
                  <div className="text-2xl font-black text-white font-['Orbitron']">₹{finalTotal}</div>
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="relative px-8 py-3 rounded-xl font-bold text-white text-sm font-['Orbitron'] overflow-hidden
                    bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500
                    shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_36px_rgba(249,115,22,0.6)]
                    transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Unlock ${selected.length} Domain${selected.length > 1 ? "s" : ""} →`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
