"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Brand } from "@/components/Brand";
import { UserAvatar, LevelBadge } from "@/components/Ui";
import { authPost, clientGet, clientPost } from "@/lib/api";
import type { NotificationItem, UserMe } from "@/lib/types";

function buildNavGroups(userId?: string, isCoach?: boolean) {
  return [
    {
      label: "Mentor",
      items: [
        { href: "/settings", label: isCoach ? "Profilo mentor" : "Diventa mentor", icon: Star },
        { href: "/paths", label: "Percorsi da mentor", icon: Route },
        { href: userId ? `/profiles/${userId}` : "/settings", label: "Livello e competenze", icon: BarChart2 },
      ]
    },
    {
      label: "Mentee",
      items: [
        { href: "/paths", label: "Percorsi da mentee", icon: GraduationCap },
        { href: "/goal", label: "Modifica obiettivi", icon: Target },
        { href: "/matching", label: "Trova un mentor", icon: Search },
      ]
    },
    {
      label: "Generale",
      items: [
        { href: "/wallet", label: "Crediti", icon: WalletCards },
        { href: "/settings", label: "Impostazioni", icon: Settings },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);
  const navGroups = useMemo(() => buildNavGroups(user?.id, user?.is_coach), [user?.id, user?.is_coach]);

  useEffect(() => {
    clientGet<UserMe>("/auth/me").then(setUser).catch(() => undefined);
    clientGet<NotificationItem[]>("/notifications/me")
      .then((items) => setNotifications(Array.isArray(items) ? items : []))
      .catch(() => setNotifications([]));
  }, []);

  async function markNotificationRead(notification: NotificationItem) {
    if (!notification.read_at) {
      await clientPost(`/notifications/${notification.id}/read`).catch(() => undefined);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    }
    const link = notification.payload.link;
    if (typeof link === "string") {
      setNotificationsOpen(false);
      router.push(link);
    }
  }

  async function markAllRead() {
    await clientPost("/notifications/read-all").catch(() => undefined);
    const now = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || now })));
  }

  async function logout() {
    await authPost("logout").catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
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
                  <Link key={`${group.label}-${item.href}-${item.label}`} href={item.href} className={`nav-link ${isActive(item.href) ? "active" : ""}`}>
                    <Icon size={18} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-level-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <UserAvatar name={user?.nickname || user?.username || "User"} size="sm" />
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.nickname || user?.username || "Account"}
              </strong>
              <small>{user?.email ? user.email.slice(0, 22) + (user.email.length > 22 ? "…" : "") : "Socra"}</small>
            </div>
            <LevelBadge level={user?.level || "L0"} />
          </div>
          <Link href={user ? `/profiles/${user.id}` : "/settings"} style={{ marginTop: "8px" }}>Vedi il tuo profilo →</Link>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <Link className="topbar-brand" href="/dashboard"><Brand compact variant="dark" /></Link>
          <div className="topbar-actions">
            <Link className="topbar-shortcut" href="/matching">
              <Compass size={17} aria-hidden />
              <span>Esplora opportunita</span>
            </Link>
            <div className="menu-wrap">
              <button className="icon-button" type="button" aria-label="Notifiche" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
                <Bell size={19} aria-hidden />
                {unreadCount > 0 ? <span className="badge">{unreadCount}</span> : null}
              </button>
              {notificationsOpen ? (
                <div className="dropdown notifications-menu">
                  <div className="row">
                    <p className="eyebrow">Notifiche</p>
                    <button className="text-button" type="button" onClick={markAllRead}>Segna lette</button>
                  </div>
                  {notifications.length === 0 ? (
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
            <div className="menu-wrap">
              <button
                className="account-button"
                type="button"
                aria-label={user?.nickname || user?.username || "Account"}
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="account-avatar">{(user?.nickname || user?.username || "A").slice(0, 1).toUpperCase()}</span>
                <span className="account-copy">
                  <strong>{user?.nickname || user?.username || "Account"}</strong>
                  <small>{user?.level || "L0"}</small>
                </span>
              </button>
              {accountOpen ? (
                <div className="dropdown account-menu">
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
        <main className="main">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Navigazione mobile">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
              <Icon size={18} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
