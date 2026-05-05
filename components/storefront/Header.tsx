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
    <header className="sticky top-0 z-40 bg-brand-cream/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={base} className="flex flex-col items-start leading-none">
          <span className="h-display text-2xl text-brand-brown tracking-wide">GalaBoutique</span>
          <span className="eyebrow mt-0.5 hidden xs:block">Luxury Fashion</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-brown/70">
          <Link href={base} className="hover:text-brand-brown transition-colors">{t("home")}</Link>
          <Link href={`${base}/shop`} className="hover:text-brand-brown transition-colors">{t("shop")}</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={switchLocale}
            className="text-[11px] font-semibold tracking-luxe text-brand-brown/70 hover:text-brand-brown transition-colors px-2 py-1.5 rounded-md"
            aria-label="Toggle language"
          >
            {tCommon("langToggle")}
          </button>

          <Link
            href={`${base}/cart`}
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-brand-brown/5 transition-colors tap-soft"
            aria-label={t("cart")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="text-brand-brown">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 bg-brand-gold text-brand-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="hairline-gold" />
    </header>
  );
}
