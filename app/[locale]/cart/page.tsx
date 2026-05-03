"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import {
  getCart, updateCartItemQty, removeFromCart, clearCart,
  getShippingRegion, setShippingRegion, type CartItem,
} from "@/lib/cart";
import { getShippingConfig, calculateShipping } from "@/lib/shipping";
import { submitOrder } from "@/lib/orders";
import type { ShippingConfig, ShippingRegion } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGIONS: ShippingRegion[] = ["north", "center", "south"];

const schema = (t: (k: string) => string) =>
  z.object({
    name:    z.string().min(1, t("required")),
    phone:   z.string().regex(/^(\+972|0)(5[0-9])[0-9]{7}$/, t("invalidPhone")),
    address: z.string().min(1, t("required")),
    notes:   z.string().optional(),
  });

type FormValues = { name: string; phone: string; address: string; notes?: string };

function CartInner() {
  const t = useTranslations("cart");
  const tShip = useTranslations("shipping");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "en" | "he";
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [region, setRegion] = useState<ShippingRegion>("center");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema((k) => t(k as Parameters<typeof t>[0]))),
  });

  useEffect(() => {
    setItems(getCart());
    setRegion(getShippingRegion() as ShippingRegion);
    getShippingConfig().then(setConfig);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shippingCost = config ? calculateShipping(config, region, subtotal) : 0;
  const total = subtotal + shippingCost;
  const isFreeShipping = config ? subtotal >= config.freeShippingThreshold : false;

  function refreshCart() {
    setItems(getCart());
    window.dispatchEvent(new Event("cart-updated"));
  }

  function changeQty(item: CartItem, delta: number) {
    updateCartItemQty(item.productId, item.size, item.color, item.qty + delta);
    refreshCart();
  }

  function remove(item: CartItem) {
    removeFromCart(item.productId, item.size, item.color);
    refreshCart();
  }

  function changeRegion(r: ShippingRegion) {
    setRegion(r);
    setShippingRegion(r);
  }

  async function onSubmit(values: FormValues) {
    if (!config) return;
    setSubmitting(true);

    const orderItems = items.map((item) => ({
      productId: item.productId,
      nameEn: item.nameEn,
      nameHe: item.nameHe,
      size: item.size,
      color: item.color,
      colorHex: item.colorHex,
      qty: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.qty,
    }));

    const { orderId, error } = await submitOrder({
      customer: { name: values.name, phone: values.phone, address: values.address, notes: values.notes || "" },
      items: orderItems,
      shippingRegion: region,
      shippingCost,
      subtotal,
      total,
      locale,
    });

    setSubmitting(false);

    if (error) {
      if (error.startsWith("STOCK_ERROR:")) {
        const [, name, size] = error.split(":");
        toast(
          t("stockError").replace("{name}", name).replace("{size}", size),
          "error"
        );
      } else {
        toast(tCommon("error"), "error");
      }
      return;
    }

    clearCart();
    window.dispatchEvent(new Event("cart-updated"));
    router.push(`/${locale}/order-confirm?id=${orderId}`);
  }

  const regionLabels: Record<ShippingRegion, string> = {
    north:  tShip("northPrice"),
    center: tShip("centerPrice"),
    south:  tShip("southPrice"),
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-cream-dark">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-xl font-bold text-brand-brown">{t("empty")}</p>
        <p className="text-sm text-brand-brown/60">{t("emptyDesc")}</p>
        <Link href={`/${locale}/shop`}>
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <h1 className="text-2xl font-bold text-brand-brown mb-6">{t("title")}</h1>

      {/* Cart items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} className="bg-white rounded-2xl p-3 flex gap-3 shadow-card">
            {/* Thumbnail */}
            <div className="w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-brand-cream">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.nameEn} width={72} height={72} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-brand-cream-dark" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-brown text-sm truncate">
                {locale === "he" ? item.nameHe : item.nameEn}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-brand-brown/60">{item.size}</span>
                <span
                  className="w-3 h-3 rounded-full border border-white ring-1 ring-gray-200"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="text-xs text-brand-brown/60">{item.color}</span>
              </div>
              <p className="text-sm font-bold text-brand-brown mt-1">
                ₪{(item.unitPrice * item.qty).toLocaleString()}
              </p>
            </div>

            {/* Qty + remove */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => remove(item)}
                className="text-brand-brown/30 hover:text-red-500 transition-colors"
                aria-label={t("remove")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => changeQty(item, -1)}
                  disabled={item.qty <= 1}
                  className="w-6 h-6 rounded-full border border-brand-cream-dark text-xs font-bold text-brand-brown disabled:opacity-30 flex items-center justify-center"
                >−</button>
                <span className="text-sm font-semibold text-brand-brown w-4 text-center">{item.qty}</span>
                <button
                  onClick={() => changeQty(item, 1)}
                  disabled={item.qty >= 10}
                  className="w-6 h-6 rounded-full border border-brand-cream-dark text-xs font-bold text-brand-brown disabled:opacity-30 flex items-center justify-center"
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping region */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-card">
        <p className="text-sm font-semibold text-brand-brown mb-3">{tShip("north").replace("צפון", "").trim() || "Shipping Region"}</p>
        <div className="grid grid-cols-3 gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => changeRegion(r)}
              className={cn(
                "py-2 px-2 rounded-xl border-2 text-xs font-medium text-center transition-all",
                region === r
                  ? "border-brand-brown bg-brand-brown text-brand-cream"
                  : "border-brand-cream-dark text-brand-brown hover:border-brand-brown/30"
              )}
            >
              {regionLabels[r]}
            </button>
          ))}
        </div>
        {isFreeShipping && (
          <p className="text-xs text-brand-gold font-medium mt-2 text-center">{tCommon("freeShipping")}</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-card space-y-2">
        <div className="flex justify-between text-sm text-brand-brown/70">
          <span>{t("subtotal")}</span>
          <span>₪{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-brand-brown/70">
          <span>{t("shipping")}</span>
          {isFreeShipping ? (
            <span className="text-brand-gold font-medium">{tCommon("freeShipping")}</span>
          ) : (
            <span>₪{shippingCost}</span>
          )}
        </div>
        <div className="flex justify-between text-base font-bold text-brand-brown border-t border-brand-cream-dark pt-2">
          <span>{t("total")}</span>
          <span>₪{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Order form */}
      {!showForm ? (
        <Button fullWidth size="lg" onClick={() => setShowForm(true)}>
          {t("confirmOrder")}
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="text-base font-bold text-brand-brown">{t("orderForm")}</h2>

          {[
            { key: "name",    label: t("fullName"),  type: "text",  hint: "" },
            { key: "phone",   label: t("phone"),     type: "tel",   hint: t("phoneHint") },
            { key: "address", label: t("address"),   type: "text",  hint: "" },
          ].map(({ key, label, type, hint }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-brand-brown mb-1">{label}</label>
              <input
                type={type}
                {...register(key as keyof FormValues)}
                className={cn(
                  "w-full border rounded-xl px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold",
                  errors[key as keyof FormValues] ? "border-red-400" : "border-brand-cream-dark"
                )}
              />
              {hint && <p className="text-xs text-brand-brown/50 mt-1">{hint}</p>}
              {errors[key as keyof FormValues] && (
                <p className="text-xs text-red-500 mt-1">{errors[key as keyof FormValues]?.message}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-brand-brown mb-1">{t("notes")}</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full border border-brand-cream-dark rounded-xl px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
            />
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting}>
            {submitting ? t("submitting") : t("submitOrder")}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function CartPage() {
  const locale = useLocale();
  return (
    <StorefrontLayout locale={locale}>
      <ToastProvider>
        <CartInner />
      </ToastProvider>
    </StorefrontLayout>
  );
}
