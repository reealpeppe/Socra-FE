"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Route,
  Search,
  Settings,
  Star,
  Target,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/Brand";
import { UserAvatar, LevelBadge } from "@/components/Ui";
import { authPost, clientGet, clientPost } from "@/lib/api";
import type { NotificationItem, UserMe } from "@/lib/types";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

function buildNavGroups(userId?: string, isCoach?: boolean): Array<{ label: string; items: NavItem[] }> {
  return [
    {
      label: "Mentor",
      items: [
        { id: "mentor-profile", href: userId ? `/profiles/${userId}` : "/dashboard", label: isCoach ? "Profilo mentor" : "Stato mentor", icon: Star },
        { id: "mentor-paths", href: "/paths?tab=mentor", label: "Percorsi da mentor", icon: Route },
        { id: "levels", href: "/livelli", label: "Livelli Socra", icon: BarChart2 },
      ]
    },
    {
      label: "Mentee",
      items: [
        { id: "mentee-paths", href: "/paths?tab=mentee", label: "Percorsi da mentee", icon: GraduationCap },
        { id: "goals", href: "/goal", label: "Modifica obiettivi", icon: Target },
        { id: "matching", href: "/matching", label: "Matching", icon: Search },
      ]
    },
    {
      label: "Generale",
      items: [
        { id: "requests", href: "/requests", label: "Richieste", icon: ClipboardCheck },
        { id: "wallet", href: "/wallet", label: "Crediti", icon: WalletCards },
        { id: "settings", href: "/settings", label: "Impostazioni", icon: Settings },
      ]
    }
  ];
}

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/matching", label: "Match", icon: Search },
  { href: "/requests", label: "Richieste", icon: ClipboardCheck },
  { href: "/paths", label: "Percorsi", icon: Route },
  { href: "/wallet", label: "Crediti", icon: WalletCards }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const notificationsWrapRef = useRef<HTMLDivElement>(null);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const currentLocationSearch = typeof window === "undefined" ? "" : window.location.search;
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);
  const navGroups = useMemo(() => buildNavGroups(user?.id, user?.is_coach), [user?.id, user?.is_coach]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isNavActive = (item: NavItem) => {
    if (item.id === "mentor-paths") return pathname === "/paths" && currentTab === "mentor";
    if (item.id === "mentee-paths") return pathname === "/paths" && currentTab !== "mentor";
    if (item.id === "settings") return pathname === "/settings";
    if (item.id === "mentor-profile" && user?.id) return pathname === `/profiles/${user.id}`;
    return isActive(item.href.split("?")[0]);
  };
  const refreshNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const items = await clientGet<NotificationItem[]>("/notifications/me");
      setNotifications(Array.isArray(items) ? items : []);
      setNotificationsError(null);
    } catch {
      setNotificationsError("Notifiche non aggiornate. Riprova.");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentTab(new URLSearchParams(currentLocationSearch).get("tab"));
  }, [pathname, currentLocationSearch]);

  useEffect(() => {
    clientGet<UserMe>("/auth/me").then(setUser).catch(() => undefined);
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!notificationsWrapRef.current?.contains(target)) setNotificationsOpen(false);
      if (!accountWrapRef.current?.contains(target)) setAccountOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (notificationsOpen) {
        setNotificationsOpen(false);
        notificationsButtonRef.current?.focus();
      }
      if (accountOpen) {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen, notificationsOpen]);

  async function markNotificationRead(notification: NotificationItem) {
    if (!notification.read_at) {
      try {
        await clientPost(`/notifications/${notification.id}/read`);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
        setNotificationsError(null);
      } catch {
        setNotificationsError("Non siamo riusciti a segnare la notifica come letta.");
      }
    }
    const link = notification.payload.link;
    if (typeof link === "string") {
      setNotificationsOpen(false);
      router.push(link);
    }
  }

  async function markAllRead() {
    try {
      await clientPost("/notifications/read-all");
      const now = new Date().toISOString();
      setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || now })));
      setNotificationsError(null);
    } catch {
      setNotificationsError("Non siamo riusciti a segnare le notifiche come lette.");
    }
  }

  async function logout() {
    await authPost("logout").catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
      <aside className="sidebar">
        <Link className="sidebar-brand-link" href="/dashboard" aria-label="Socra">
          <Brand variant="light" />
        </Link>
        <div className="sidebar-intro">
          <span className="sidebar-dot" aria-hidden />
          <span>Mentorship peer-to-peer</span>
        </div>
        <nav className="nav-list" aria-label="Navigazione principale">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`nav-link ${isNavActive(item) ? "active" : ""}`}
                    aria-current={isNavActive(item) ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-level-card">
          <div className="sidebar-account-row">
            <UserAvatar name={user?.nickname || user?.username || "User"} size="sm" />
            <div className="sidebar-account-copy">
              <strong>{user?.nickname || user?.username || "Account"}</strong>
              <small>{user?.email ? user.email.slice(0, 22) + (user.email.length > 22 ? "…" : "") : "Socra"}</small>
            </div>
            <LevelBadge level={user?.level || "L0"} />
          </div>
          <Link href={user ? `/profiles/${user.id}` : "/settings"}>Vedi il tuo profilo -&gt;</Link>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <Link className="topbar-brand" href="/dashboard"><Brand compact variant="dark" /></Link>
          <div className="topbar-actions">
            <Link className="topbar-shortcut" href="/matching">
              <Compass size={17} aria-hidden />
              <span>Trova mentor compatibili</span>
            </Link>
            <div className="menu-wrap" ref={notificationsWrapRef}>
              <button
                ref={notificationsButtonRef}
                className="icon-button"
                type="button"
                aria-label="Notifiche"
                aria-expanded={notificationsOpen}
                aria-controls="notifications-menu"
                aria-haspopup="dialog"
                onClick={() => {
                  setAccountOpen(false);
                  setNotificationsOpen((open) => {
                    const nextOpen = !open;
                    if (nextOpen) void refreshNotifications();
                    return nextOpen;
                  });
                }}
              >
                <Bell size={19} aria-hidden />
                {unreadCount > 0 ? <span className="badge">{unreadCount}</span> : null}
              </button>
              {notificationsOpen ? (
                <div id="notifications-menu" className="dropdown notifications-menu" role="dialog" aria-label="Notifiche">
                  <div className="row">
                    <p className="eyebrow">Notifiche</p>
                    <button className="text-button" type="button" onClick={markAllRead} disabled={unreadCount === 0 || notificationsLoading}>
                      Segna lette
                    </button>
                  </div>
                  {notificationsError ? (
                    <div className="notification-error" role="alert">
                      <span>{notificationsError}</span>
                      <button className="text-button" type="button" onClick={() => void refreshNotifications()}>
                        Riprova
                      </button>
                    </div>
                  ) : null}
                  {notificationsLoading && notifications.length === 0 ? (
                    <p className="muted" role="status">Aggiornamento notifiche…</p>
                  ) : notifications.length === 0 ? (
                    <p className="muted">Nessuna notifica.</p>
                  ) : (
                    <div className="notification-list">
                      {notifications.slice(0, 8).map((notification) => (
                        <button
                          key={notification.id}
                          className={`notification-item ${notification.read_at ? "" : "unread"}`}
                          type="button"
                          onClick={() => markNotificationRead(notification)}
                        >
                          <span>{notification.payload.message || "Aggiornamento Socra"}</span>
                          {!notification.read_at ? <small>Nuova</small> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="menu-wrap" ref={accountWrapRef}>
              <button
                ref={accountButtonRef}
                className="account-button"
                type="button"
                aria-label={user?.nickname || user?.username || "Account"}
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                aria-haspopup="dialog"
                onClick={() => {
                  setNotificationsOpen(false);
                  setAccountOpen((open) => !open);
                }}
              >
                <span className="account-avatar">{(user?.nickname || user?.username || "A").slice(0, 1).toUpperCase()}</span>
                <span className="account-copy">
                  <strong>{user?.nickname || user?.username || "Account"}</strong>
                  <small>{user?.level || "L0"}</small>
                </span>
              </button>
              {accountOpen ? (
                <div id="account-menu" className="dropdown account-menu" role="dialog" aria-label="Menu account">
                  <p className="muted">{user?.email || "Sessione attiva"}</p>
                  <button className="button secondary" type="button" onClick={logout}>
                    <LogOut size={16} aria-hidden />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="main" id="main-content" tabIndex={-1}>{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Navigazione mobile">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "active" : ""}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <Icon size={18} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
