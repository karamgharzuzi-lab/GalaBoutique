"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getCartCount, setLocale } from "@/lib/cart";

interface HeaderProps {
  locale: string;
}

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    const handler = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  function switchLocale() {
    const next = locale === "en" ? "he" : "en";
    setLocale(next);
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath);
  }

  const base = `/${locale}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-cream-dark">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={base} className="font-bold text-xl tracking-wide text-brand-brown">
          GalaBoutique
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-brown/70">
          <Link href={base} className="hover:text-brand-brown transition-colors">{t("home")}</Link>
          <Link href={`${base}/shop`} className="hover:text-brand-brown transition-colors">{t("shop")}</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={switchLocale}
            className="text-xs font-semibold text-brand-brown/60 hover:text-brand-brown transition-colors px-2 py-1 rounded-lg hover:bg-brand-cream"
          >
            {tCommon("langToggle")}
          </button>

          <Link
            href={`${base}/cart`}
            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-brand-cream transition-colors"
            aria-label={t("cart")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-gold text-brand-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
