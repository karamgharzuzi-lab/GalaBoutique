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
import { getShippingConfig } from "@/lib/shipping";
import { submitOrder } from "@/lib/orders";
import type { ShippingConfig, ShippingRegion } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGIONS: ShippingRegion[] = ["north", "center", "jish_golan", "south"];

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
  const shippingCost = 0; // Customer is not charged on the website, pays courier directly
  const total = subtotal;

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
    jish_golan: tShip("jishGolanPrice"),
    south:  tShip("southPrice"),
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-cream-dark">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="h-display text-3xl text-brand-brown">{t("empty")}</h1>
        <p className="text-sm text-brand-brown/60 max-w-xs">{t("emptyDesc")}</p>
        <Link href={`/${locale}/shop`}>
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-32">
      <p className="eyebrow mb-1">{t("title")}</p>
      <h1 className="h-display text-3xl text-brand-brown mb-6">Your Bag</h1>

      {/* Shipping Rates Info Note */}
      <div className="mb-6 bg-brand-cream-dark/20 border border-brand-cream-dark rounded-xl p-4 text-xs text-brand-brown/80 space-y-2">
        <p className="font-semibold text-[11px] tracking-wide uppercase text-brand-gold">
          {locale === "he" ? "הערה לגבי משלוח" : "Shipping Information"}
        </p>
        <p className="leading-relaxed">
          {tShip("shippingNote")}
        </p>
        <ul className="list-disc list-inside space-y-1 font-medium text-brand-brown mt-1">
          <li>{tShip("northPrice")}</li>
          <li>{tShip("jishGolanPrice")}</li>
          <li>{tShip("centerPrice")}</li>
          <li>{tShip("southPrice")}</li>
        </ul>
      </div>

      {/* Cart items */}
      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} className="bg-white border border-brand-cream-dark rounded-xl p-3 flex gap-3">
            {/* Thumbnail */}
            <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-brand-cream-dark/30">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.nameEn} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-brand-cream-dark" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-brand-brown text-sm leading-snug line-clamp-2">
                {locale === "he" ? item.nameHe : item.nameEn}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] uppercase tracking-wide text-brand-brown/60">{item.size}</span>
                <span className="w-3 h-3 rounded-full ring-1 ring-brand-brown/15" style={{ backgroundColor: item.colorHex }} />
                <span className="text-[11px] text-brand-brown/60">{item.color}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-semibold text-brand-brown">
                  ₪{(item.unitPrice * item.qty).toLocaleString()}
                </p>
                <div className="inline-flex items-center border border-brand-brown/15 rounded-full">
                  <button
                    onClick={() => changeQty(item, -1)}
                    disabled={item.qty <= 1}
                    aria-label="Decrease"
                    className="w-7 h-7 text-brand-brown text-base disabled:opacity-30 hover:bg-brand-brown/5 transition-colors flex items-center justify-center rounded-full"
                  >−</button>
                  <span className="text-xs font-semibold text-brand-brown w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => changeQty(item, 1)}
                    disabled={item.qty >= 10}
                    aria-label="Increase"
                    className="w-7 h-7 text-brand-brown text-base disabled:opacity-30 hover:bg-brand-brown/5 transition-colors flex items-center justify-center rounded-full"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => remove(item)}
              className="self-start text-brand-brown/30 hover:text-red-500 transition-colors p-1"
              aria-label={t("remove")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Shipping region */}
      <div className="mb-6">
        <p className="eyebrow mb-3">{t("shipping")}</p>
        <div className="grid grid-cols-2 gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => changeRegion(r)}
              className={cn(
                "py-2.5 px-2 rounded-md border text-xs font-medium text-center transition-all tap-soft",
                region === r
                  ? "border-brand-brown bg-brand-brown text-brand-cream"
                  : "border-brand-brown/20 text-brand-brown hover:border-brand-brown/50"
              )}
            >
              {regionLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-brand-cream-dark rounded-xl p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm text-brand-brown/70">
          <span>{t("subtotal")}</span>
          <span>₪{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-brand-brown/70">
          <span>{t("shipping")}</span>
          <span className="text-brand-gold font-medium">{tShip("payToCourier")}</span>
        </div>
        <div className="hairline" />
        <div className="flex justify-between text-base font-bold text-brand-brown pt-1">
          <span>{t("total")}</span>
          <span className="h-display text-2xl">₪{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Order form */}
      {!showForm ? (
        <Button fullWidth size="lg" onClick={() => setShowForm(true)}>
          {t("confirmOrder")}
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-brand-cream-dark rounded-xl p-5 space-y-4">
          <div>
            <p className="eyebrow mb-1">{t("orderForm")}</p>
            <h2 className="h-display text-xl text-brand-brown">Delivery Details</h2>
          </div>

          {[
            { key: "name",    label: t("fullName"),  type: "text",  hint: "" },
            { key: "phone",   label: t("phone"),     type: "tel",   hint: t("phoneHint") },
            { key: "address", label: t("address"),   type: "text",  hint: "" },
          ].map(({ key, label, type, hint }) => (
            <div key={key}>
              <label className="block text-xs font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">{label}</label>
              <input
                type={type}
                {...register(key as keyof FormValues)}
                className={cn(
                  "w-full border rounded-md px-3 py-3 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold",
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
            <label className="block text-xs font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">{t("notes")}</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold resize-none"
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
