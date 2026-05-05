"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Button from "@/components/ui/Button";
import { getOrderById } from "@/lib/orders";
import type { Order } from "@/lib/types";

export default function OrderConfirmPage() {
  const t = useTranslations("orderConfirm");
  const tShip = useTranslations("shipping");
  const locale = useLocale() as "en" | "he";
  const params = useSearchParams();
  const orderId = params.get("id") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    getOrderById(orderId).then((o) => { setOrder(o); setLoading(false); });
  }, [orderId]);

  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <StorefrontLayout locale={locale}>
      <div className="max-w-lg mx-auto px-5 py-12 text-center">
        {/* Success ornament */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-brand-gold/40" />
          <div className="absolute inset-2 rounded-full bg-brand-gold/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <p className="eyebrow mb-2 text-brand-gold/80">Confirmation</p>
        <h1 className="h-display text-4xl text-brand-brown mb-3">{t("title")}</h1>
        <p className="text-brand-brown/70 mb-8 text-pretty">{t("subtitle")}</p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="w-12 h-px bg-brand-gold/50" />
          <span className="w-1.5 h-1.5 bg-brand-gold rotate-45" />
          <span className="w-12 h-px bg-brand-gold/50" />
        </div>

        {/* Order ref */}
        <div className="mb-8">
          <p className="eyebrow mb-2">{t("orderRef")}</p>
          <p className="h-display text-3xl text-brand-brown tracking-widest">{shortId}</p>
        </div>

        {/* Contact message */}
        <div className="bg-white border border-brand-cream-dark rounded-xl p-5 mb-6 text-sm text-brand-brown/80 leading-relaxed">
          {t("contactMessage")}
        </div>

        {/* Order summary */}
        {order && !loading && (
          <div className="bg-white border border-brand-cream-dark rounded-xl p-5 text-start mb-6">
            <p className="eyebrow mb-3">{t("orderSummary")}</p>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm gap-3">
                  <span className="text-brand-brown/70 line-clamp-1">
                    {locale === "he" ? item.nameHe : item.nameEn} · {item.size} · {item.color} × {item.qty}
                  </span>
                  <span className="text-brand-brown font-medium flex-shrink-0">₪{item.subtotal}</span>
                </div>
              ))}
            </div>
            <div className="hairline mb-3" />
            <div className="flex justify-between text-xs text-brand-brown/60 mb-2">
              <span>{t("shippingTo")} {tShip(order.shippingRegion as "north" | "center" | "south")}</span>
              <span>{order.shippingCost === 0 ? "Free" : `₪${order.shippingCost}`}</span>
            </div>
            <div className="flex justify-between items-baseline text-base font-bold text-brand-brown">
              <span>Total</span>
              <span className="h-display text-2xl">₪{order.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Link href={`/${locale}/shop`}>
          <Button fullWidth>{t("continueShopping")}</Button>
        </Link>
      </div>
    </StorefrontLayout>
  );
}
