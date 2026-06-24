import { useState, useEffect } from "react";
import { useSubscriptionConfig } from "@/lib/SubscriptionConfig";
import { DOMAIN_LIST } from "@/lib/data";
import { useAdmin, API_BASE } from "@/hooks/useAdmin";

const DOMAIN_COLORS: Record<string, string> = {
  rtl: "#00f5ff", verification: "#a855f7", "physical-design": "#3b82f6",
  analog: "#f59e0b", fpga: "#10b981", embedded: "#f97316",
  dft: "#ec4899", research: "#8b5cf6",
};

const DEFAULT_BUNDLES = [
  { domainCount: 3, label: "Trio Pack",   discount: 15 },
  { domainCount: 5, label: "Elite Pack",  discount: 25 },
  { domainCount: 8, label: "Master Pack", discount: 40 },
];

export default function AdminSubscription() {
  const { admin, authHeaders, isLoggedIn } = useAdmin();
  const isSuperAdmin = admin?.role === "SUPER_ADMIN";
  const { subscriptionEnabled, refetch: refetchConfig } = useSubscriptionConfig();

  const [prices, setPrices]   = useState<Record<string, string>>({});
  const [bundles, setBundles] = useState(DEFAULT_BUNDLES);
  const [payments, setPayments] = useState<any[]>([]);
  const [saving, setSaving]   = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [tab, setTab]         = useState<"domains" | "bundles" | "payments">("domains");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // ── Admin fetch helper ──────────────────────────────────────────────────────
  const adminFetch = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const res = await adminFetch("/api/subscription/admin/pricing");
        const domainPrices: any[] = res.data?.domainPrices ?? [];
        const bundlePrices: any[] = res.data?.bundles ?? [];

        const priceMap: Record<string, string> = {};
        domainPrices.forEach(p => { priceMap[p.domainId] = String(p.price); });
        setPrices(priceMap);
        if (bundlePrices.length) setBundles(bundlePrices);
      } catch { showToast("⚠️ Could not load pricing (DB migration pending)"); }

      try {
        const pRes = await adminFetch("/api/subscription/admin/payments");
        setPayments(pRes.data ?? []);
      } catch {}
    })();
  }, [isLoggedIn]);

  const toggleSubscription = async () => {
    if (!isSuperAdmin) return;
    setToggling(true);
    try {
      await adminFetch("/api/subscription/admin/config", {
        method: "PUT",
        body: JSON.stringify({ subscriptionEnabled: !subscriptionEnabled }),
      });
      refetchConfig();
      showToast(!subscriptionEnabled
        ? "✅ Subscription ENABLED — paywalls are now active"
        : "⚠️ Subscription DISABLED — all users have free access");
    } catch { showToast("❌ Failed to update config"); }
    setToggling(false);
  };

  const saveDomainPrice = async (domainId: string) => {
    if (!isSuperAdmin) return;
    const price = parseFloat(prices[domainId]);
    if (isNaN(price) || price < 0) return;
    setSaving(domainId);
    try {
      await adminFetch("/api/subscription/admin/pricing/domain", {
        method: "PUT",
        body: JSON.stringify({ domainId, price }),
      });
      showToast(`✅ Price saved for ${domainId}`);
    } catch { showToast("❌ Failed to save price"); }
    setSaving(null);
  };

  const saveBundle = async (idx: number) => {
    if (!isSuperAdmin) return;
    const b = bundles[idx];
    setSaving(`bundle_${idx}`);
    try {
      await adminFetch("/api/subscription/admin/pricing/bundle", {
        method: "PUT",
        body: JSON.stringify({ domainCount: b.domainCount, discount: b.discount, label: b.label }),
      });
      showToast(`✅ Bundle saved: ${b.label}`);
    } catch { showToast("❌ Failed to save bundle"); }
    setSaving(null);
  };

  const totalRevenue = payments.filter(p => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black border border-white/20
          text-white text-sm px-5 py-2.5 rounded-xl shadow-2xl whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white font-['Orbitron'] mb-1">Subscription Pricing</h1>
            <p className="text-gray-500 text-sm">
              {isSuperAdmin ? "Super Admin — full pricing control" : "Admin — view only"}
            </p>
          </div>
        </div>

        {/* ── Master Toggle ─────────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 mb-8 flex items-center justify-between gap-4
          ${subscriptionEnabled
            ? "border-orange-500/40 bg-orange-500/8"
            : "border-emerald-500/40 bg-emerald-500/8"}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${subscriptionEnabled ? "bg-orange-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-white font-bold font-['Orbitron'] text-sm">
                Subscription System — {subscriptionEnabled ? "ACTIVE" : "INACTIVE (Free Access Mode)"}
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              {subscriptionEnabled
                ? "Paywalls are active. Users must subscribe after Level 1."
                : "All users have full free access. Paywalls are hidden everywhere."}
            </p>
          </div>
          {isSuperAdmin && (
            <button onClick={toggleSubscription} disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 disabled:opacity-60
                ${subscriptionEnabled ? "bg-orange-500" : "bg-white/15"}`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
                ${subscriptionEnabled ? "left-8" : "left-1"}`} />
            </button>
          )}
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Revenue",  value: `₹${totalRevenue.toLocaleString()}`, color: "#10b981" },
            { label: "Total Orders",   value: payments.filter(p => p.status === "SUCCESS").length, color: "#00f5ff" },
            { label: "Pending",        value: payments.filter(p => p.status === "PENDING").length,  color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-black font-['Orbitron']" style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
          {(["domains", "bundles", "payments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${tab === t ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Domain Prices Tab */}
        {tab === "domains" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOMAIN_LIST.map(domain => {
              const color = DOMAIN_COLORS[domain.id] ?? "#00f5ff";
              return (
                <div key={domain.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: color + "20", color }}>⬡</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{domain.name}</div>
                    <div className="text-gray-500 text-xs">{domain.roadmap}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400 text-sm">₹</span>
                    <input
                      type="number" value={prices[domain.id] ?? ""} placeholder="0"
                      disabled={!isSuperAdmin}
                      onChange={e => setPrices(p => ({ ...p, [domain.id]: e.target.value }))}
                      className="w-24 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white
                        text-sm text-right focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
                    />
                    {isSuperAdmin && (
                      <button onClick={() => saveDomainPrice(domain.id)}
                        disabled={saving === domain.id}
                        className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30
                          text-orange-400 text-xs rounded-lg transition-all disabled:opacity-50 font-semibold">
                        {saving === domain.id ? "..." : "Save"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bundles Tab */}
        {tab === "bundles" && (
          <div className="space-y-4">
            {bundles.map((b, i) => (
              <div key={b.domainCount} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="shrink-0">
                    <div className="text-white font-bold font-['Orbitron']">{b.domainCount} Domain Bundle</div>
                    <div className="text-gray-500 text-xs mt-0.5">Triggers at {b.domainCount}+ domains</div>
                  </div>
                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Label</label>
                      <input value={b.label} disabled={!isSuperAdmin}
                        onChange={e => setBundles(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white
                          text-sm focus:outline-none focus:border-orange-500/50 disabled:opacity-50 w-36" />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs block mb-1">Discount %</label>
                      <input type="number" value={b.discount} min={0} max={90} disabled={!isSuperAdmin}
                        onChange={e => setBundles(prev => prev.map((x, j) => j === i ? { ...x, discount: +e.target.value } : x))}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white
                          text-sm focus:outline-none focus:border-orange-500/50 disabled:opacity-50 w-24" />
                    </div>
                    {isSuperAdmin && (
                      <div className="mt-5">
                        <button onClick={() => saveBundle(i)} disabled={saving === `bundle_${i}`}
                          className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30
                            text-orange-400 text-sm rounded-lg transition-all disabled:opacity-50 font-semibold">
                          {saving === `bundle_${i}` ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-3xl font-black font-['Orbitron'] text-orange-400">{b.discount}%</div>
                    <div className="text-gray-600 text-xs">discount</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {tab === "payments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["User", "Domains", "Amount", "Status", "Date"].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-600">No payments yet</td></tr>
                )}
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4">
                      <div className="text-white font-medium">{p.user?.name ?? "—"}</div>
                      <div className="text-gray-600 text-xs">{p.user?.email ?? "—"}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {(p.domains ?? []).map((d: string) => (
                          <span key={d} className="text-xs px-1.5 py-0.5 rounded-full bg-white/8 text-gray-400">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-white font-semibold font-['Orbitron']">₹{p.amount}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                        ${p.status === "SUCCESS" ? "bg-emerald-500/15 text-emerald-400"
                          : p.status === "FAILED" ? "bg-red-500/15 text-red-400"
                          : "bg-yellow-500/15 text-yellow-400"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
