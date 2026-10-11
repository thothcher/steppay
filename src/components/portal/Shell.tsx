"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  FileChartColumn,
  GraduationCap,
  House,
  Info,
  LogOut,
  Menu,
  Package,
  Plus,
  Rocket,
  Settings,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { cn } from "@/components/ui";
import { selectMerchant, markAllNotificationsRead } from "@/app/portal/shell-actions";
import { logout } from "@/app/(auth)/actions";

type NavLeaf = { label: string; href: string };
type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: NavLeaf[];
};

const NAV: NavItem[] = [
  { label: "Activation", href: "/portal/activation", icon: Rocket },
  { label: "Home", href: "/portal/home", icon: House },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    children: [
      { label: "Payments", href: "/portal/payments" },
      { label: "Settlements", href: "/portal/settlements" },
      { label: "Disputes", href: "/portal/disputes" },
    ],
  },
  {
    label: "Reports center",
    icon: FileChartColumn,
    children: [
      { label: "Reports", href: "/portal/reports" },
      { label: "Developer logs", href: "/portal/logs" },
    ],
  },
  {
    label: "Payment solutions",
    icon: Package,
    children: [
      { label: "Payment links", href: "/portal/links" },
      { label: "Integration", href: "/portal/integration" },
      { label: "API playground", href: "/portal/playground" },
    ],
  },
  { label: "Merchant settings", href: "/portal/merchants", icon: Settings },
];

export type ShellProps = {
  user: { full_name: string; email: string; role: string; group_name: string };
  merchants: { id: number; name: string; merchant_id: number }[];
  selectedId: number | null;
  notifications: { id: number; kind: string; title: string; body: string; link: string; read: boolean; ago: string }[];
  children: React.ReactNode;
};

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function PortalShell({ user, merchants, selectedId, notifications, children }: ShellProps) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sp-sidebar") === "collapsed");
    } catch {}
  }, []);
  useEffect(() => setMobileOpen(false), [path]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sp-sidebar", c ? "open" : "collapsed");
      } catch {}
      return !c;
    });
  };

  return (
    <div className="min-h-dvh">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-forest-950/50 backdrop-blur-[2px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />
      <Sidebar
        path={path}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleCollapsed}
        onClose={() => setMobileOpen(false)}
        isAdmin={user.role === "admin"}
      />

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]")}>
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-ml-1 rounded-xl p-2 text-ink-2 hover:bg-black/5 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <MerchantSwitcher merchants={merchants} selectedId={selectedId} />
            <div className="flex-1" />
            <Link
              href="/docs"
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-ink-2 hover:bg-black/5 hover:text-ink sm:inline-flex"
            >
              <BookOpen className="size-4" /> Docs
            </Link>
            <NotificationBell items={notifications} />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <TestModeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  path,
  collapsed,
  mobileOpen,
  onToggle,
  onClose,
  isAdmin,
}: {
  path: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const initialOpen = NAV.filter((n) => n.children?.some((c) => isActive(path, c.href))).map((n) => n.label);
  const [open, setOpen] = useState<string[]>(initialOpen);
  useEffect(() => {
    const current = NAV.find((n) => n.children?.some((c) => isActive(path, c.href)));
    if (current) setOpen((o) => (o.includes(current.label) ? o : [...o, current.label]));
  }, [path]);

  // On mobile the drawer always shows the full sidebar.
  const mini = collapsed && !mobileOpen;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-forest-900 text-white transition-[width,transform] duration-200",
        "w-[272px] lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed && "lg:w-[84px]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-3 px-5", mini && "lg:justify-center lg:px-0")}>
        <Link href="/portal/home" className="flex items-center gap-3">
          {mini ? (
            <span className="hidden lg:block">
              <LogoMark size={32} />
            </span>
          ) : null}
          <span className={cn(mini && "lg:hidden")}>
            <Logo tone="light" size={30} />
          </span>
        </Link>
        <span className={cn("h-6 w-px bg-white/20", mini && "lg:hidden")} />
        <span className={cn("text-[15px] font-semibold text-white/80", mini && "lg:hidden")}>Portal</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className={cn("hidden justify-end px-4 pb-2 lg:flex", mini && "justify-center px-0")}>
        <button
          type="button"
          onClick={onToggle}
          className="grid size-8 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="thin-scroll flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.href) {
            const active = isActive(path, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                title={mini ? item.label : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-semibold transition-colors",
                  active ? "bg-lime-300 text-forest-900" : "text-white/80 hover:bg-white/8 hover:text-white",
                  mini && "lg:justify-center lg:px-0",
                )}
              >
                <Icon className="size-[19px] shrink-0" />
                <span className={cn(mini && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          }
          const groupActive = item.children!.some((c) => isActive(path, c.href));
          const isOpen = open.includes(item.label);
          if (mini) {
            return (
              <Link
                key={item.label}
                href={item.children![0].href}
                title={item.label}
                className={cn(
                  "hidden h-11 items-center justify-center rounded-xl transition-colors lg:flex",
                  groupActive ? "bg-lime-300 text-forest-900" : "text-white/80 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-[19px]" />
              </Link>
            );
          }
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpen((o) => (o.includes(item.label) ? o.filter((x) => x !== item.label) : [...o, item.label]))}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14.5px] font-semibold transition-colors hover:bg-white/8",
                  groupActive ? "text-white" : "text-white/80 hover:text-white",
                )}
                aria-expanded={isOpen}
              >
                <Icon className="size-[19px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronDown className={cn("size-4 text-white/50 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="mt-1 space-y-1 pl-[42px]">
                  {item.children!.map((c) => {
                    const active = isActive(path, c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          "flex h-10 items-center rounded-xl px-3 text-[14px] font-semibold transition-colors",
                          active ? "bg-lime-300 text-forest-900" : "text-white/70 hover:bg-white/8 hover:text-white",
                        )}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-3">
        {isAdmin && (
          <Link
            href="/portal/admin"
            title={mini ? "Lecturer panel" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-semibold transition-colors",
              isActive(path, "/portal/admin") ? "bg-lime-300 text-forest-900" : "text-lime-200 hover:bg-white/8",
              mini && "lg:justify-center lg:px-0",
            )}
          >
            <GraduationCap className="size-[19px] shrink-0" />
            <span className={cn(mini && "lg:hidden")}>Lecturer panel</span>
          </Link>
        )}
        <Link
          href="/docs"
          title={mini ? "Documentation" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white",
            mini && "lg:justify-center lg:px-0",
          )}
        >
          <BookOpen className="size-[19px] shrink-0" />
          <span className={cn(mini && "lg:hidden")}>Documentation</span>
        </Link>
        <Link
          href="/portal/profile"
          title={mini ? "Profile" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-[14.5px] font-semibold transition-colors",
            isActive(path, "/portal/profile") ? "bg-lime-300 text-forest-900" : "text-white/80 hover:bg-white/8 hover:text-white",
            mini && "lg:justify-center lg:px-0",
          )}
        >
          <UserRound className="size-[19px] shrink-0" />
          <span className={cn(mini && "lg:hidden")}>Profile</span>
        </Link>
      </div>
    </aside>
  );
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onOutside]);
  return ref;
}

function MerchantSwitcher({ merchants, selectedId }: { merchants: ShellProps["merchants"]; selectedId: number | null }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useClickOutside(() => setOpen(false));
  const selected = merchants.find((m) => m.id === selectedId);

  const choose = (id: number | null) => {
    setOpen(false);
    start(() => selectMerchant(id));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center gap-2 rounded-xl px-2.5 py-2 text-[15px] font-semibold text-ink hover:bg-black/5", pending && "opacity-60")}
        aria-expanded={open}
      >
        <Store className="size-[18px] text-ink-3" />
        <span className="max-w-[160px] truncate sm:max-w-[260px]">{selected ? selected.name : "My Merchants"}</span>
        {!selected && (
          <span className="grid min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11.5px] font-bold text-white">
            {merchants.length}
          </span>
        )}
        <ChevronDown className={cn("size-4 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[300px] animate-fade-in rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          <div className="px-3 pb-1 pt-2 text-[11.5px] font-bold uppercase tracking-wider text-ink-3">Show data for</div>
          <SwitcherRow
            label="All merchants"
            sub={`${merchants.length} merchant${merchants.length === 1 ? "" : "s"}`}
            active={!selected}
            onClick={() => choose(null)}
          />
          {merchants.map((m) => (
            <SwitcherRow key={m.id} label={m.name} sub={`ID ${m.merchant_id}`} active={m.id === selectedId} onClick={() => choose(m.id)} />
          ))}
          <div className="my-1 h-px bg-line" />
          <Link
            href="/portal/merchants/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-brand-700 hover:bg-brand-50"
          >
            <Plus className="size-4" /> New merchant
          </Link>
        </div>
      )}
    </div>
  );
}

function SwitcherRow({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-black/[0.04]">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink">{label}</span>
        <span className="block text-[12px] text-ink-3">{sub}</span>
      </span>
      {active && <Check className="size-4 shrink-0 stroke-[3] text-brand-600" />}
    </button>
  );
}

function NotificationBell({ items }: { items: ShellProps["notifications"] }) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useClickOutside(() => setOpen(false));
  const unread = items.filter((n) => !n.read).length;
  const dot: Record<string, string> = { success: "bg-brand-500", warning: "bg-amber-500", danger: "bg-red-500", info: "bg-sky-500" };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-xl text-ink-2 hover:bg-black/5 hover:text-ink"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-canvas">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] animate-fade-in overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[14px] font-bold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => start(() => markAllNotificationsRead())}
                className="text-[12.5px] font-semibold text-brand-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13.5px] text-ink-3">
                <Info className="mx-auto mb-2 size-5" />
                No notifications yet.
              </div>
            ) : (
              items.map((n) => {
                const body = (
                  <div className={cn("flex gap-3 px-4 py-3 hover:bg-black/[0.03]", !n.read && "bg-lime-50/60")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot[n.kind] ?? dot.info)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{n.body}</div>}
                      <div className="mt-1 text-[11.5px] text-ink-3">{n.ago}</div>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block border-b border-line last:border-0">
                    {body}
                  </Link>
                ) : (
                  <div key={n.id} className="border-b border-line last:border-0">
                    {body}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: ShellProps["user"] }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const initials = user.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-1 grid size-10 place-items-center rounded-full bg-forest-900 text-[13px] font-bold text-lime-300 ring-4 ring-white transition hover:ring-lime-100"
        aria-label="Account menu"
      >
        {initials || "?"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[260px] animate-fade-in rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          <div className="px-3 py-2.5">
            <div className="truncate text-[14px] font-bold text-ink">{user.full_name}</div>
            <div className="truncate text-[12.5px] text-ink-3">{user.email}</div>
            <div className="mt-2 flex gap-1.5">
              <span className="rounded-md bg-lime-100 px-2 py-0.5 text-[11.5px] font-bold text-forest-800">
                {user.role === "admin" ? "Lecturer" : "Student"}
              </span>
              {user.group_name && <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{user.group_name}</span>}
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            href="/portal/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-ink hover:bg-black/[0.04]"
          >
            <UserRound className="size-4 text-ink-3" /> Profile
          </Link>
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-ink hover:bg-black/[0.04]"
          >
            <BookOpen className="size-4 text-ink-3" /> Documentation
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-medium text-red-700 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function TestModeBanner() {
  return (
    <div className="mb-6 flex items-center gap-3.5 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 sm:px-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-300 text-forest-900">
        <Info className="size-[18px]" />
      </span>
      <p className="text-[13.5px] leading-snug text-ink-2 sm:text-[14px]">
        <span className="mr-2 font-bold text-ink">Test mode</span>
        This is an educational sandbox. Only test cards are accepted and no real money moves.{" "}
        <Link href="/docs/test-cards" className="font-semibold text-brand-700 hover:underline">
          See test cards
        </Link>
      </p>
    </div>
  );
}
