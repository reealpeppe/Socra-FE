"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  Route,
  Search,
  Settings,
  Star,
  Target,
  UserRound,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/Brand";
import { UserAvatar, LevelBadge } from "@/components/Ui";
import { authPost, ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { NotificationItem, UserMe } from "@/lib/types";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

type AppShellContentProps = {
  children: React.ReactNode;
  currentTab: string | null;
  primaryAction?: {
    href: string;
    label: string;
  };
};

type SessionState = "loading" | "authenticated" | "unauthenticated" | "error";

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

type AppShellProps = {
  children: React.ReactNode;
  primaryAction?: {
    href: string;
    label: string;
  };
};

function SearchAwareAppShell({ children, primaryAction }: AppShellProps) {
  const searchParams = useSearchParams();
  return (
    <AppShellContent currentTab={searchParams.get("tab")} primaryAction={primaryAction}>
      {children}
    </AppShellContent>
  );
}

export function AppShell({ children, primaryAction }: AppShellProps) {
  return (
    <Suspense fallback={<AppShellContent currentTab={null} primaryAction={primaryAction}>{children}</AppShellContent>}>
      <SearchAwareAppShell primaryAction={primaryAction}>{children}</SearchAwareAppShell>
    </Suspense>
  );
}

function AppShellContent({ children, currentTab, primaryAction }: AppShellContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const notificationsWrapRef = useRef<HTMLDivElement>(null);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDialogRef = useRef<HTMLDivElement>(null);
  const accountDialogRef = useRef<HTMLDivElement>(null);
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read_at).length, [notifications]);
  const navGroups = useMemo(() => buildNavGroups(user?.id, user?.is_coach), [user?.id, user?.is_coach]);
  const shortcut = primaryAction || { href: "/matching", label: "Trova mentor compatibili" };
  const ShortcutIcon = shortcut.href.startsWith("/paths") ? Route : Compass;

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
    let active = true;
    clientGet<UserMe>("/auth/me")
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setSessionState("authenticated");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUser(null);
        setSessionState(
          error instanceof ClientApiError && error.status === 401
            ? "unauthenticated"
            : "error"
        );
      });
    window.queueMicrotask(() => void refreshNotifications());
    return () => {
      active = false;
    };
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

  useEffect(() => {
    const dialog = notificationsOpen
      ? notificationsDialogRef.current
      : accountOpen
        ? accountDialogRef.current
        : null;
    if (!dialog) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const firstControl = dialog.querySelector<HTMLElement>(
        "a[href], button:not(:disabled), [tabindex]:not([tabindex='-1'])"
      );
      (firstControl || dialog).focus();
    });

    return () => window.cancelAnimationFrame(animationFrame);
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
    setLogoutError(null);
    setLogoutLoading(true);
    try {
      await authPost("logout");
      setUser(null);
      setSessionState("unauthenticated");
      setAccountOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof ClientApiError
          ? error.message
          : "Non siamo riusciti a terminare la sessione. Riprova."
      );
      setAccountOpen(true);
    } finally {
      setLogoutLoading(false);
    }
  }

  const accountLinks: NavItem[] = [
    {
      id: "account-profile",
      href: user ? `/profiles/${user.id}` : "/settings",
      label: "Il tuo profilo",
      icon: UserRound
    },
    {
      id: "account-settings",
      href: "/settings",
      label: "Impostazioni",
      icon: Settings
    },
    {
      id: "account-levels",
      href: "/livelli",
      label: "Livelli Socra",
      icon: BarChart2
    },
    {
      id: "account-mentor-paths",
      href: "/paths?tab=mentor",
      label: "Percorsi da mentor",
      icon: Route
    },
    {
      id: "account-mentees",
      href: user?.is_coach ? "/matching/mentees" : "/settings",
      label: user?.is_coach
        ? "Trova mentee"
        : user?.level === "L1" || user?.level === "L2"
          ? "Attiva ruolo mentor"
          : "Stato mentor",
      icon: GraduationCap
    }
  ];

  const hasAuthenticatedUser = sessionState === "authenticated" && user !== null;
  const accountName = hasAuthenticatedUser
    ? user.nickname || user.username || "Utente Socra"
    : null;
  const currentHref = pathname === "/paths" && currentTab
    ? `${pathname}?tab=${encodeURIComponent(currentTab)}`
    : pathname;
  const loginHref = `/login?next=${encodeURIComponent(currentHref)}`;
  const sessionCopy = sessionState === "unauthenticated"
    ? {
        title: "Sessione scaduta",
        body: "Accedi per continuare a usare Socra."
      }
    : {
        title: "Profilo non disponibile",
        body: "Non riusciamo a verificare la sessione. Accedi di nuovo."
      };
  const accountButtonLabel = hasAuthenticatedUser
    ? `Apri il menu account di ${accountName}`
    : sessionState === "loading"
      ? "Caricamento del profilo"
      : "Apri le opzioni di accesso";
  const notificationLabel = unreadCount === 0
    ? "Notifiche: nessuna non letta"
    : `Notifiche: ${unreadCount} ${unreadCount === 1 ? "non letta" : "non lette"}`;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
      <aside className="sidebar">
        <Link className="sidebar-brand-link" href="/dashboard" aria-label="Socra, vai alla dashboard">
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
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`nav-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
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
          {hasAuthenticatedUser && accountName ? (
            <>
              <div className="sidebar-account-row">
                <UserAvatar name={accountName} size="sm" />
                <div className="sidebar-account-copy">
                  <strong>{accountName}</strong>
                  <small title={user.email}>{user.email}</small>
                </div>
                <LevelBadge level={user.level || "L0"} />
              </div>
              <Link href={`/profiles/${user.id}`}>Vedi il tuo profilo <span aria-hidden>→</span></Link>
            </>
          ) : (
            <div
              className="sidebar-session-state"
              role={sessionState === "loading" ? "status" : undefined}
              aria-live="polite"
            >
              <UserRound size={18} aria-hidden />
              <div>
                <strong>{sessionState === "loading" ? "Verifica della sessione" : sessionCopy.title}</strong>
                <small>{sessionState === "loading" ? "Caricamento profilo…" : sessionCopy.body}</small>
              </div>
              {sessionState !== "loading" ? <Link href={loginHref}>Accedi</Link> : null}
            </div>
          )}
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <Link className="topbar-brand" href="/dashboard" aria-label="Socra, vai alla dashboard">
            <Brand compact variant="dark" />
          </Link>
          <div className="topbar-actions">
            <Link className="topbar-shortcut" href={shortcut.href}>
              <ShortcutIcon size={17} aria-hidden />
              <span>{shortcut.label}</span>
            </Link>

            <div className="menu-wrap" ref={notificationsWrapRef}>
              <button
                ref={notificationsButtonRef}
                className="icon-button"
                type="button"
                aria-label={notificationLabel}
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
                {unreadCount > 0 ? <span className="badge" aria-hidden>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
              </button>
              {notificationsOpen ? (
                <div
                  ref={notificationsDialogRef}
                  id="notifications-menu"
                  className="dropdown notifications-menu"
                  role="dialog"
                  aria-labelledby="notifications-menu-title"
                  tabIndex={-1}
                >
                  <div className="row">
                    <p className="eyebrow" id="notifications-menu-title">Notifiche</p>
                    <button className="text-button" type="button" onClick={markAllRead} disabled={unreadCount === 0 || notificationsLoading}>
                      Segna tutte come lette
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
                    <p className="muted">Non hai ancora ricevuto notifiche.</p>
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
                aria-label={accountButtonLabel}
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                aria-haspopup="dialog"
                disabled={sessionState === "loading"}
                onClick={() => {
                  setNotificationsOpen(false);
                  setAccountOpen((open) => !open);
                }}
              >
                {hasAuthenticatedUser && accountName ? (
                  <>
                    <span className="account-avatar" aria-hidden>{accountName.slice(0, 1).toUpperCase()}</span>
                    <span className="account-copy">
                      <strong>{accountName}</strong>
                      <small>{user.level || "L0"}</small>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="account-avatar account-avatar-session" aria-hidden>
                      <UserRound size={18} />
                    </span>
                    <span className="account-copy">
                      <strong>{sessionState === "loading" ? "Caricamento" : "Sessione"}</strong>
                      <small>{sessionState === "loading" ? "Attendi" : "Accedi"}</small>
                    </span>
                  </>
                )}
              </button>
              {accountOpen ? (
                <div
                  ref={accountDialogRef}
                  id="account-menu"
                  className="dropdown account-menu"
                  role="dialog"
                  aria-labelledby="account-menu-title"
                  tabIndex={-1}
                >
                  {hasAuthenticatedUser && accountName ? (
                    <>
                      <div className="account-menu-header">
                        <strong id="account-menu-title">{accountName}</strong>
                        <span>{user.email}</span>
                      </div>
                      <nav className="account-menu-links" aria-label="Collegamenti account">
                        {accountLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              className="account-menu-link"
                              href={item.href}
                              key={item.id}
                              onClick={() => setAccountOpen(false)}
                            >
                              <Icon size={17} aria-hidden />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </nav>
                      <div className="account-menu-divider" />
                      {logoutError ? <p className="account-menu-error" role="alert">{logoutError}</p> : null}
                      <button
                        className="button secondary account-menu-logout"
                        type="button"
                        onClick={logout}
                        disabled={logoutLoading}
                        aria-busy={logoutLoading || undefined}
                      >
                        <LogOut size={16} aria-hidden />
                        {logoutLoading ? "Uscita in corso…" : "Esci"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="account-menu-header">
                        <strong id="account-menu-title">{sessionCopy.title}</strong>
                        <span>{sessionCopy.body}</span>
                      </div>
                      <Link
                        className="button primary account-menu-login"
                        href={loginHref}
                        onClick={() => setAccountOpen(false)}
                      >
                        <LogIn size={16} aria-hidden />
                        Accedi
                      </Link>
                    </>
                  )}
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
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
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
