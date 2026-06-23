import { useLocation } from "wouter";

interface PaywallProps {
  domainId: string;
  domainName: string;
  domainColor: string;
  price: number;
}

export default function Paywall({ domainId, domainName, domainColor, price }: PaywallProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Lock icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: domainColor + "15", border: `1px solid ${domainColor}30` }}>
            <svg className="w-9 h-9" style={{ color: domainColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ border: `1px solid ${domainColor}` }} />
        </div>

        <h2 className="text-2xl font-black text-white font-['Orbitron'] mb-3">
          Level 1 Complete! 🎉
        </h2>
        <p className="text-gray-400 mb-2 text-sm leading-relaxed">
          You've completed the free level of <span className="font-semibold" style={{ color: domainColor }}>{domainName}</span>.
          Subscribe to unlock the full roadmap and reach industry level.
        </p>

        {/* What's included */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 my-6 text-left space-y-2.5">
          {[
            "All remaining roadmap levels",
            "Interactive labs & coding challenges",
            "Industry project capstones",
            "Domain report & career guidance",
            "Battle & leaderboard access",
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: domainColor + "25", color: domainColor }}>
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              {f}
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-black text-white font-['Orbitron']">₹{price}</span>
          <span className="text-gray-500 text-sm ml-2">one-time · lifetime access</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setLocation(`/subscription?domain=${domainId}`)}
            className="px-8 py-3 rounded-xl font-bold text-white text-sm font-['Orbitron']
              bg-gradient-to-r from-orange-500 to-red-600
              hover:from-orange-400 hover:to-red-500
              shadow-[0_0_24px_rgba(249,115,22,0.35)]
              hover:shadow-[0_0_36px_rgba(249,115,22,0.5)]
              transition-all duration-200">
            Unlock {domainName} →
          </button>
          <button
            onClick={() => setLocation("/subscription")}
            className="px-8 py-3 rounded-xl font-semibold text-gray-400 text-sm
              border border-white/10 hover:border-white/25 hover:text-white
              transition-all duration-200">
            See All Plans
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-5">
          💡 Pick 3+ domains together for up to 40% off
        </p>
      </div>
    </div>
  );
}
