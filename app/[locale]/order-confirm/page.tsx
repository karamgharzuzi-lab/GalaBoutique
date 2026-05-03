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
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-brand-gold/20 rounded-full flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-brand-brown mb-2">{t("title")}</h1>
        <p className="text-brand-brown/70 mb-6">{t("subtitle")}</p>

        {/* Order ref */}
        <div className="bg-brand-cream rounded-2xl px-6 py-4 mb-6 inline-block">
          <p className="text-xs text-brand-brown/50 mb-1">{t("orderRef")}</p>
          <p className="text-xl font-bold text-brand-brown tracking-widest">{shortId}</p>
        </div>

        {/* Contact message */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-card text-sm text-brand-brown/80 leading-relaxed">
          {t("contactMessage")}
        </div>

        {/* Order summary */}
        {order && !loading && (
          <div className="bg-white rounded-2xl p-4 shadow-card text-start mb-6">
            <h2 className="text-sm font-bold text-brand-brown mb-3">{t("orderSummary")}</h2>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-brand-brown/70">
                    {locale === "he" ? item.nameHe : item.nameEn} · {item.size} · {item.color} × {item.qty}
                  </span>
                  <span className="text-brand-brown font-medium">₪{item.subtotal}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-cream-dark pt-2 space-y-1">
              <div className="flex justify-between text-xs text-brand-brown/60">
                <span>{t("shippingTo")} {tShip(order.shippingRegion as "north" | "center" | "south")}</span>
                <span>{order.shippingCost === 0 ? "Free" : `₪${order.shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-brown">
                <span>Total</span>
                <span>₪{order.total.toLocaleString()}</span>
              </div>
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
