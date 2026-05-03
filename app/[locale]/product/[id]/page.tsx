"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/Toast";
import { getProductById } from "@/lib/products";
import { getShippingConfig, calculateShipping } from "@/lib/shipping";
import { addToCart } from "@/lib/cart";
import type { Product, ShippingConfig, ShippingRegion, ProductVariant } from "@/lib/types";
import { SIZES } from "@/lib/types";
import { cn } from "@/lib/utils";

const REGIONS: ShippingRegion[] = ["north", "center", "south"];

function ProductDetailInner({ id, locale }: { id: string; locale: string }) {
  const t = useTranslations("product");
  const tShip = useTranslations("shipping");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [region, setRegion] = useState<ShippingRegion>("center");
  const [imgIdx, setImgIdx] = useState(0);

  // Touch swipe
  const touchStartX = useRef<number>(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getProductById(id), getShippingConfig()]).then(([p, c]) => {
      setProduct(p);
      setConfig(c);
      if (p) {
        const colors = Array.from(new Set(p.variants.map((v) => v.color)));
        if (colors[0]) setSelectedColor(colors[0]);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-brand-brown font-semibold">Product not found</p>
      <Button variant="outline" onClick={() => router.push(`/${locale}/shop`)}>Back to Shop</Button>
    </div>
  );

  const name = product.name[locale as "en" | "he"] || product.name.en;
  const description = product.description[locale as "en" | "he"] || product.description.en;

  // Unique colors
  const colorOptions = Array.from(
    new Map(product.variants.map((v) => [v.color, v.colorHex])).entries()
  );

  // Sizes available for selected color
  const variantsForColor = product.variants.filter((v) => v.color === selectedColor);

  function sizeVariant(size: string): ProductVariant | undefined {
    return variantsForColor.find((v) => v.size === size);
  }

  const selectedVariant = selectedColor && selectedSize
    ? variantsForColor.find((v) => v.size === selectedSize)
    : undefined;

  const unitPrice = selectedVariant
    ? (selectedVariant.salePrice ?? selectedVariant.price)
    : null;

  const maxQty = selectedVariant ? Math.min(10, selectedVariant.quantity) : 1;

  const shippingCost = config && unitPrice != null
    ? calculateShipping(config, region, unitPrice * qty)
    : null;

  const total = unitPrice != null && shippingCost != null
    ? unitPrice * qty + shippingCost
    : null;

  const isOutOfStock = variantsForColor.every((v) => v.quantity === 0);

  const canAddToCart =
    !!selectedColor &&
    !!selectedSize &&
    selectedVariant &&
    selectedVariant.quantity > 0;

  function handleAddToCart() {
    if (!selectedVariant || !product) return;
    addToCart({
      productId: product.id,
      nameEn: product.name.en,
      nameHe: product.name.he,
      size: selectedSize,
      color: selectedColor,
      colorHex: selectedVariant.colorHex,
      qty,
      unitPrice: selectedVariant.salePrice ?? selectedVariant.price,
      imageUrl: product.images[0] || "",
    });
    window.dispatchEvent(new Event("cart-updated"));
    toast(locale === "he" ? "הפריט נוסף לסל" : "Added to cart");
  }

  function handleSwipeStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleSwipeEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setImgIdx((i) => Math.min(i + 1, (product?.images.length ?? 1) - 1));
      else setImgIdx((i) => Math.max(i - 1, 0));
    }
  }

  const regionLabels: Record<ShippingRegion, string> = {
    north:  tShip("northPrice"),
    center: tShip("centerPrice"),
    south:  tShip("southPrice"),
  };

  if (config) {
    const subtotal = unitPrice != null ? unitPrice * qty : 0;
    if (subtotal >= config.freeShippingThreshold) {
      Object.keys(regionLabels).forEach((r) => {
        regionLabels[r as ShippingRegion] = tShip(r as "north" | "center" | "south") + " — " + tCommon("freeShipping");
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Gallery */}
      <div
        ref={galleryRef}
        className="relative bg-brand-cream overflow-hidden"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className="aspect-square relative">
          {product.images.length > 0 ? (
            <Image
              src={product.images[imgIdx]}
              alt={name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          ) : (
            <div className="w-full h-full bg-brand-cream-dark flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-cream">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === imgIdx ? "bg-brand-gold w-4" : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors",
                i === imgIdx ? "border-brand-gold" : "border-transparent"
              )}
            >
              <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="px-4 pb-32">
        {/* Name + category */}
        <div className="flex items-start justify-between gap-3 py-4">
          <div>
            <h1 className="text-xl font-bold text-brand-brown leading-tight">{name}</h1>
            <Badge className="mt-1 capitalize">{product.category}</Badge>
          </div>
          {isOutOfStock && <Badge variant="outOfStock">{tCommon("outOfStock")}</Badge>}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-5">
          {selectedVariant ? (
            <>
              {selectedVariant.salePrice ? (
                <>
                  <span className="text-2xl font-bold text-brand-gold">₪{selectedVariant.salePrice}</span>
                  <span className="text-base text-brand-brown/40 line-through">₪{selectedVariant.price}</span>
                  <Badge variant="sale">Sale</Badge>
                </>
              ) : (
                <span className="text-2xl font-bold text-brand-brown">₪{selectedVariant.price}</span>
              )}
            </>
          ) : (
            <span className="text-xl font-semibold text-brand-brown/60">
              {product.variants.length > 0
                ? `₪${Math.min(...product.variants.map((v) => v.salePrice ?? v.price))}`
                : "—"}
            </span>
          )}
        </div>

        {/* Color selector */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-brand-brown mb-2">{t("selectColor")}</p>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(([color, hex]) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); setSelectedSize(""); setQty(1); }}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  selectedColor === color
                    ? "border-brand-brown ring-2 ring-brand-gold ring-offset-1"
                    : "border-white ring-1 ring-gray-200"
                )}
                style={{ backgroundColor: hex }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Size selector */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-brand-brown mb-2">{t("selectSize")}</p>
          <div className="flex gap-2 flex-wrap">
            {SIZES.map((size) => {
              const v = sizeVariant(size);
              const available = v && v.quantity > 0;
              return (
                <button
                  key={size}
                  disabled={!available}
                  onClick={() => { setSelectedSize(size); setQty(1); }}
                  className={cn(
                    "h-10 min-w-[44px] px-3 rounded-xl border-2 text-sm font-medium transition-all",
                    selectedSize === size
                      ? "border-brand-brown bg-brand-brown text-brand-cream"
                      : available
                      ? "border-brand-cream-dark text-brand-brown hover:border-brand-brown/40"
                      : "border-brand-cream-dark text-brand-brown/30 line-through cursor-not-allowed"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity */}
        {selectedVariant && selectedVariant.quantity > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-brand-brown mb-2">{t("quantity")}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-brand-cream-dark text-brand-brown font-bold hover:bg-brand-cream transition-colors flex items-center justify-center"
              >−</button>
              <span className="text-base font-semibold w-6 text-center text-brand-brown">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="w-9 h-9 rounded-full border border-brand-cream-dark text-brand-brown font-bold hover:bg-brand-cream transition-colors flex items-center justify-center"
              >+</button>
            </div>
          </div>
        )}

        {/* Shipping region */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-brand-brown mb-2">{t("shippingRegion")}</p>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  "py-2 px-3 rounded-xl border-2 text-xs font-medium text-center transition-all",
                  region === r
                    ? "border-brand-brown bg-brand-brown text-brand-cream"
                    : "border-brand-cream-dark text-brand-brown hover:border-brand-brown/30"
                )}
              >
                {regionLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Live total */}
        {total !== null && (
          <div className="bg-brand-cream rounded-2xl p-4 mb-6">
            <div className="flex justify-between text-sm text-brand-brown/70 mb-1">
              <span>{t("quantity")}</span>
              <span>×{qty}</span>
            </div>
            {shippingCost !== null && (
              <div className="flex justify-between text-sm text-brand-brown/70 mb-2">
                <span>{tShip(region)}</span>
                {shippingCost === 0 ? (
                  <span className="text-brand-gold font-medium">{tCommon("freeShipping")}</span>
                ) : (
                  <span>₪{shippingCost}</span>
                )}
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-brand-brown border-t border-brand-cream-dark pt-2">
              <span>{t("liveTotal")}</span>
              <span>₪{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <p className="text-sm font-semibold text-brand-brown mb-2">{t("description")}</p>
            <p className="text-sm text-brand-brown/70 leading-relaxed">{description}</p>
          </div>
        )}
      </div>

      {/* Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-cream-dark p-4 pb-safe md:relative md:border-0 md:bg-transparent md:px-4 md:pb-8">
        <Button
          fullWidth
          size="lg"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? tCommon("outOfStock") : t("addToCart")}
        </Button>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string; locale: string } }) {
  const locale = useLocale();
  return (
    <StorefrontLayout locale={locale}>
      <ToastProvider>
        <ProductDetailInner id={params.id} locale={locale} />
      </ToastProvider>
    </StorefrontLayout>
  );
}
