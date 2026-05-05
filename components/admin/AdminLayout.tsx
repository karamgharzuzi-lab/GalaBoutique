"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange, signOut } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000; // 8 hours

const Icon = {
  dash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  products: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const NAV_ITEMS: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: "/admin/dashboard",  label: "לוח בקרה", icon: Icon.dash },
  { href: "/admin/products",   label: "מוצרים",   icon: Icon.products },
  { href: "/admin/orders",     label: "הזמנות",   icon: Icon.orders },
  { href: "/admin/settings",   label: "הגדרות",   icon: Icon.settings },
];

export default function AdminLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const lastActivity = useRef(Date.now());
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (!user) {
        router.replace(`/${locale}/admin/login`);
      } else {
        setAuthed(true);
      }
      setChecking(false);
    });
    return unsub;
  }, [locale, router]);

  // Auto-logout on inactivity
  useEffect(() => {
    function resetTimer() { lastActivity.current = Date.now(); }
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    const interval = setInterval(async () => {
      if (Date.now() - lastActivity.current > INACTIVITY_LIMIT) {
        await signOut();
        router.replace(`/${locale}/admin/login`);
      }
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [locale, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-cream flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-60 bg-brand-brown text-brand-cream flex-shrink-0">
          <div className="px-6 py-6 border-b border-white/10">
            <Link href={`/${locale}`} className="h-display text-xl text-brand-gold tracking-wide">GalaBoutique</Link>
            <p className="eyebrow mt-1 text-white/40">ניהול</p>
          </div>
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const href = `/${locale}${item.href}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors",
                    active ? "bg-white/10 text-brand-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={async () => { await signOut(); router.replace(`/${locale}/admin/login`); }}
            className="px-6 py-4 text-sm text-white/40 hover:text-white border-t border-white/10 text-start transition-colors"
          >
            התנתק
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden bg-brand-brown text-brand-cream px-5 h-14 flex items-center justify-between flex-shrink-0">
            <span className="h-display text-lg text-brand-gold tracking-wide">GalaBoutique</span>
            <span className="eyebrow text-white/40">ניהול</span>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-brown border-t border-white/10 z-40 safe-area-pb">
            <div className="flex">
              {NAV_ITEMS.map((item) => {
                const href = `/${locale}${item.href}`;
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold tracking-wide uppercase transition-colors relative",
                      active ? "text-brand-gold" : "text-white/50"
                    )}
                  >
                    {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-gold rounded-full" />}
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </ToastProvider>
  );
}
