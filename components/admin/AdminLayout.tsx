"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange, signOut } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000; // 8 hours

const NAV_ITEMS = [
  { href: "/admin/dashboard",  label: "Dashboard",  icon: "⊞" },
  { href: "/admin/products",   label: "Products",   icon: "🏷" },
  { href: "/admin/inventory",  label: "Inventory",  icon: "📦" },
  { href: "/admin/orders",     label: "Orders",     icon: "🛍" },
  { href: "/admin/settings",   label: "Settings",   icon: "⚙" },
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
        <aside className="hidden md:flex flex-col w-56 bg-brand-brown text-brand-cream flex-shrink-0">
          <div className="px-6 py-5 border-b border-white/10">
            <Link href={`/${locale}`} className="font-bold text-lg text-brand-gold">GalaBoutique</Link>
            <p className="text-[10px] text-white/40 mt-0.5">Admin</p>
          </div>
          <nav className="flex-1 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const href = `/${locale}${item.href}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                    active ? "bg-white/10 text-brand-gold" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={async () => { await signOut(); router.replace(`/${locale}/admin/login`); }}
            className="px-6 py-4 text-sm text-white/50 hover:text-white border-t border-white/10 text-start transition-colors"
          >
            Sign Out
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden bg-brand-brown text-brand-cream px-4 h-14 flex items-center justify-between flex-shrink-0">
            <span className="font-bold text-brand-gold">GalaBoutique Admin</span>
          </header>

          <main className="flex-1 overflow-y-auto">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-brown border-t border-white/10 z-40">
            <div className="flex">
              {NAV_ITEMS.map((item) => {
                const href = `/${locale}${item.href}`;
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors",
                      active ? "text-brand-gold" : "text-white/50"
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
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
