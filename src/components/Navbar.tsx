import { Link, useLocation } from "wouter";
import { useUserContext } from "@/lib/user";
import { Microchip, LogIn, LogOut, Bell, MessageSquare, LayoutDashboard, BookOpen, Trophy, Sword, Briefcase, Zap, User, Menu, X, Rocket } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useNotifications } from "@/lib/useNotifications";
import { getSocket } from "@/lib/socket";

// ── Toast types ───────────────────────────────────────────────────────────────
interface Toast { id: string; senderName: string; content: string; avatar?: string }

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

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/domains",      label: "Domains",     icon: BookOpen },
  { href: "/leaderboard",  label: "Leaderboard", icon: Trophy },
  { href: "/battlefield",  label: "Battle",      icon: Sword },
  { href: "/placement",    label: "Placement",   icon: Briefcase },
  { href: "/subscription", label: "Plans",       icon: Zap },
  { href: "/profile",      label: "Profile",     icon: User },
];

export default function Navbar() {
  const { isAuthenticated, user, profile, logout } = useUserContext();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Unread messages count
  useEffect(() => {
    if (!isAuthenticated) return;
    api.chat.getConversations().then(r => {
      const total = (r.data as any[]).reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0);
      setUnreadMessages(total);
    }).catch(() => {});
  }, [isAuthenticated, location]);

  // Socket message toasts
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

  const removeToast = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  const handleLogout = async () => { await logout(); setSidebarOpen(false); setLocation("/login"); };

  const handleOdysseyReplay = () => {
    sessionStorage.setItem("odyssey_referrer", "/dashboard");
    localStorage.removeItem("chipverse_odyssey_seen");
    setLocation("/odyssey");
    setSidebarOpen(false);
  };

  const notifIcons: Record<string, string> = {
    friend_request: "👥", friend_accepted: "✅",
    battle_challenge: "⚔️", battle_accepted: "🟢", battle_result: "🏆",
  };

  const getNotifRoute = (type: string) => {
    if (["friend_request", "friend_accepted"].includes(type)) return "/profile";
    return "/battlefield";
  };

  const handleNotifClick = async (n: { id: string; type: string; isRead: boolean }) => {
    if (!n.isRead) await markOneRead(n.id);
    setNotifOpen(false);
    setLocation(getNotifRoute(n.type));
  };

  return (
    <>
      {/* ── Toast container ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        <style>{`@keyframes slideInToast { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }`}</style>
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <MessageToast toast={t} onClose={() => removeToast(t.id)} onClick={() => { removeToast(t.id); setLocation("/messages"); }} />
          </div>
        ))}
      </div>

      {/* ── Sidebar overlay (mobile) ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      {isAuthenticated && <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300",
        "bg-[#08080f] border-r border-white/8",
        "w-[220px]",
        "hidden md:flex",
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8 hover:opacity-80 transition-opacity">
          <Microchip className="w-6 h-6 text-blue-500 shrink-0" />
          <span className="font-bold text-lg tracking-wider font-['Orbitron'] text-white">ChipVerse</span>
        </Link>

        {/* Nav links — only when logged in */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {isAuthenticated && NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = location.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}>
                <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-blue-400" : "text-gray-500 group-hover:text-white")} size={18} />
                <span>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </Link>
            );
          })}

          {/* Divider */}
          {isAuthenticated && <div className="mx-5 my-3 border-t border-white/8" />}

          {/* Odyssey */}
          {isAuthenticated && (
            <button onClick={handleOdysseyReplay}
              className="w-full flex items-center gap-3 px-5 py-2.5 mx-0 text-sm font-medium text-purple-400 hover:bg-purple-500/8 hover:text-purple-300 transition-all group">
              <Rocket className="w-[18px] h-[18px] shrink-0" size={18} />
              <span>VLSI Odyssey</span>
            </button>
          )}
        </nav>

        {/* User section */}
        {isAuthenticated ? (
          <div className="border-t border-white/8 p-3">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/4 mb-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{user?.name ?? "User"}</p>
                <p className="text-gray-500 text-[10px] truncate">{profile?.xp ?? 0} XP · {profile?.streak ?? 0} 🔥</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-white/8 p-3">
            <Link href="/login"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-all">
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          </div>
        )}
      </aside>}

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 md:left-[220px] right-0 z-40 h-14 bg-black/60 backdrop-blur-md border-b border-white/8 flex items-center px-4 gap-3">
        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>

        {/* Mobile logo */}
        <Link href="/" className="md:hidden flex items-center gap-2">
          <Microchip className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-base font-['Orbitron'] text-white">ChipVerse</span>
        </Link>

        <div className="flex-1" />

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* XP pill */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs font-semibold shrink-0">
              <span className="text-yellow-400">⚡</span>
              <span className="text-white">{profile?.xp ?? 0}</span>
              <span className="text-gray-500 mx-1">·</span>
              <span className="text-orange-400">🔥</span>
              <span className="text-white">{profile?.streak ?? 0}</span>
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
                      <button onClick={markAllRead} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="px-4 py-8 text-center text-gray-600 text-sm">No notifications yet</div>
                      : notifications.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)}
                          className={cn("flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors", !n.isRead && "bg-blue-500/5")}>
                          <span className="text-lg shrink-0 mt-0.5">{notifIcons[n.type] ?? "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight">{n.title}</p>
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
            <Link href="/profile" className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
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

      {/* ── Mobile sidebar ────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 flex flex-col md:hidden transition-transform duration-300 w-[240px]",
        "bg-[#08080f] border-r border-white/8",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Microchip className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-base font-['Orbitron'] text-white">ChipVerse</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = location.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-blue-500/15 text-blue-400" : "text-gray-500 hover:text-white hover:bg-white/5"
                )}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
          <div className="mx-5 my-3 border-t border-white/8" />
          <button onClick={handleOdysseyReplay}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/8 transition-all">
            <Rocket size={18} />
            <span>VLSI Odyssey</span>
          </button>
        </nav>

        {isAuthenticated && (
          <div className="border-t border-white/8 p-3">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
