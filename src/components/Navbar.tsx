import { Link, useLocation } from "wouter";
import { useUserContext } from "@/lib/user";
import {
  Microchip, LogIn, LogOut, Bell, MessageSquare,
  LayoutDashboard, BookOpen, Trophy, Sword, Briefcase,
  Zap, User, Menu, X, Rocket, ChevronRight
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useNotifications } from "@/lib/useNotifications";
import { getSocket } from "@/lib/socket";

interface Toast { id: string; senderName: string; content: string }

function MessageToast({ toast, onClose, onClick }: { toast: Toast; onClose: () => void; onClick: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div onClick={onClick} style={{ animation: "slideInToast 0.3s ease-out" }}
      className="flex items-center gap-3 bg-[#0f0f1a] border border-white/15 rounded-xl px-4 py-3 cursor-pointer shadow-2xl max-w-xs">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {toast.senderName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold truncate">{toast.senderName}</p>
        <p className="text-gray-400 text-xs truncate">{toast.content}</p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/domains",      label: "Domains",     icon: BookOpen },
  { href: "/leaderboard",  label: "Leaderboard", icon: Trophy },
  { href: "/battlefield",  label: "Battle",      icon: Sword },
  { href: "/placement",    label: "Placement",   icon: Briefcase },
  { href: "/subscription", label: "Plans",       icon: Zap },
  { href: "/profile",      label: "Profile",     icon: User },
];

const SIDEBAR_WIDTH = 240;

export default function Navbar() {
  const { isAuthenticated, user, profile, logout } = useUserContext();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location]);

  // Close notif on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Unread messages
  useEffect(() => {
    if (!isAuthenticated) return;
    api.chat.getConversations().then(r => {
      setUnreadMessages((r.data as any[]).reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0));
    }).catch(() => {});
  }, [isAuthenticated, location]);

  // Socket toasts
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;
    const handler = (msg: any) => {
      if (window.location.pathname.includes("/messages")) return;
      const id = Math.random().toString(36).slice(2);
      setToasts(p => [...p.slice(-2), { id, senderName: msg.senderName ?? "Someone", content: msg.content ?? "" }]);
      setUnreadMessages(p => p + 1);
    };
    socket.on("new_message", handler);
    return () => { socket.off("new_message", handler); };
  }, [isAuthenticated]);

  const handleLogout = async () => { await logout(); setOpen(false); setLocation("/login"); };

  const handleOdysseyReplay = () => {
    sessionStorage.setItem("odyssey_referrer", "/dashboard");
    localStorage.removeItem("chipverse_odyssey_seen");
    setOpen(false);
    setLocation("/odyssey");
  };

  const notifIcons: Record<string, string> = {
    friend_request: "👥", friend_accepted: "✅",
    battle_challenge: "⚔️", battle_result: "🏆",
  };

  return (
    <>
      <style>{`
        @keyframes slideInToast { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }
        .sidebar-transition { transition: width 0.28s cubic-bezier(0.4,0,0.2,1); }
        .content-transition { transition: margin-left 0.28s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* Toast */}
      <div className="fixed bottom-6 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <MessageToast toast={t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))}
              onClick={() => { setToasts(p => p.filter(x => x.id !== t.id)); setLocation("/messages"); }} />
          </div>
        ))}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col bg-[#090912] border-r border-white/8 sidebar-transition overflow-hidden",
          // Mobile: slide in/out
          "lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Microchip className="w-6 h-6 text-blue-500 shrink-0" />
            <span className="font-bold text-base font-['Orbitron'] text-white whitespace-nowrap">ChipVerse</span>
          </Link>
          {/* Close button - mobile only */}
          <button onClick={() => setOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {isAuthenticated ? (
            <>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = location === href || location.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group whitespace-nowrap",
                      active
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/25"
                        : "text-gray-500 hover:text-white hover:bg-white/6"
                    )}>
                    <Icon size={17} className={cn("shrink-0", active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")} />
                    <span>{label}</span>
                    {active && <ChevronRight size={13} className="ml-auto text-blue-400/60" />}
                  </Link>
                );
              })}

              <div className="mx-4 my-2 border-t border-white/8" />

              <button onClick={handleOdysseyReplay}
                className="w-full flex items-center gap-3 mx-0 px-5 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/8 transition-all whitespace-nowrap">
                <Rocket size={17} className="shrink-0" />
                <span>VLSI Odyssey</span>
              </button>
            </>
          ) : (
            <div className="px-4 py-3">
              <p className="text-gray-600 text-xs mb-3 px-1">Login to access your learning dashboard</p>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/8 p-3 shrink-0">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/4 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{user?.name ?? "User"}</p>
                  <p className="text-gray-500 text-[10px]">⚡ {profile?.xp ?? 0} XP · 🔥 {profile?.streak ?? 0}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link href="/login"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-all">
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className={cn(
        "fixed top-0 right-0 z-40 h-14 bg-black/70 backdrop-blur-md border-b border-white/8",
        "flex items-center px-4 gap-3 content-transition",
        // On desktop shift with sidebar when open
        open ? "lg:left-[240px]" : "lg:left-0",
        "left-0" // always full on mobile (sidebar overlays)
      )}>
        {/* Hamburger */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
          aria-label="Toggle sidebar">
          {open
            ? <X size={18} />
            : <Menu size={18} />}
        </button>

        {/* Logo on mobile when sidebar closed */}
        {!open && (
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Microchip className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-sm font-['Orbitron'] text-white">ChipVerse</span>
          </Link>
        )}

        <div className="flex-1" />

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* XP + streak */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs font-semibold">
              <span className="text-yellow-400">⚡ {profile?.xp ?? 0}</span>
              <span className="text-gray-600">·</span>
              <span className="text-orange-400">🔥 {profile?.streak ?? 0}</span>
            </div>

            {/* Messages */}
            <Link href="/messages"
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all">
              <MessageSquare size={18} />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(v => !v); if (!notifOpen && unreadCount > 0) markAllRead(); }}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-[#0a0a12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Notifications</span>
                    {notifications.some(n => !n.isRead) && (
                      <button onClick={markAllRead} className="text-[10px] text-blue-400 hover:text-blue-300">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="px-4 py-8 text-center text-gray-600 text-sm">No notifications yet</div>
                      : notifications.map(n => (
                        <div key={n.id}
                          onClick={async () => { if (!n.isRead) await markOneRead(n.id); setNotifOpen(false); }}
                          className={cn("flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors", !n.isRead && "bg-blue-500/5")}>
                          <span className="text-lg shrink-0">{notifIcons[n.type] ?? "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </Link>
          </div>
        ) : (
          <Link href="/login"
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-all">
            <LogIn size={15} />
            Login
          </Link>
        )}
      </header>
    </>
  );
}
