"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  locale: string;
}

export default function BottomNav({ locale }: BottomNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    const handler = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const base = `/${locale}`;

  const links = [
    {
      href: base,
      label: t("home"),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
          <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12v9h18V12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: `${base}/shop`,
      label: t("shop"),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
          <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
          <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: `${base}/cart`,
      label: t("cart"),
      badge: cartCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-brand-cream/95 backdrop-blur-md border-t border-brand-cream-dark safe-area-pb">
      <div className="hairline-gold" />
      <div className="flex items-stretch justify-around h-16">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors tap-soft",
                active ? "text-brand-brown" : "text-brand-brown/40"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand-gold rounded-full" />
              )}
              <span className="relative">
                {link.icon}
                {link.badge ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-brand-gold text-brand-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
