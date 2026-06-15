"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Button from "@/components/ui/Button";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/Toast";
import { getProductById } from "@/lib/products";
import { addToCart } from "@/lib/cart";
import type { Product, ProductVariant } from "@/lib/types";
import { LETTER_SIZES, NUMBER_SIZES } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProductDetailInner({ id, locale }: { id: string; locale: string }) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  // Touch swipe
  const touchStartX = useRef<number>(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductById(id).then((p) => {
      setProduct(p);
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

  const total = unitPrice != null ? unitPrice * qty : null;

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

  // No region labels needed as shipping is removed from product page

  return (
    <div className="max-w-2xl mx-auto">
      {/* Gallery */}
      <div
        ref={galleryRef}
        className="relative bg-brand-cream-dark/30 overflow-hidden"
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
                aria-label={`Image ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === imgIdx ? "bg-brand-gold w-5" : "bg-white/70 w-1.5"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {product.images.length > 1 && (
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border transition-colors",
                i === imgIdx ? "border-brand-gold ring-1 ring-brand-gold" : "border-brand-cream-dark"
              )}
            >
              <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="px-5 pb-32">
        {/* Category eyebrow + name */}
        <div className="pt-6 pb-4">
          <p className="eyebrow mb-2">{product.category}</p>
          <h1 className="h-display text-3xl md:text-4xl text-brand-brown leading-tight text-balance">{name}</h1>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-4">
          {selectedVariant ? (
            <>
              {selectedVariant.salePrice ? (
                <>
                  <span className="h-display text-3xl text-brand-gold">₪{selectedVariant.salePrice}</span>
                  <span className="text-base text-brand-brown/40 line-through">₪{selectedVariant.price}</span>
                  <span className="text-[10px] font-semibold tracking-luxe uppercase text-brand-brown bg-brand-gold/95 px-2 py-1 rounded-sm">Sale</span>
                </>
              ) : (
                <span className="h-display text-3xl text-brand-brown">₪{selectedVariant.price}</span>
              )}
            </>
          ) : (
            <span className="h-display text-2xl text-brand-brown/60">
              {product.variants.length > 0
                ? `₪${Math.min(...product.variants.map((v) => v.salePrice ?? v.price))}`
                : "—"}
            </span>
          )}
          {isOutOfStock && (
            <span className="ms-auto text-[10px] font-semibold tracking-luxe uppercase text-brand-brown bg-brand-cream-dark px-2 py-1 rounded-sm">
              {tCommon("outOfStock")}
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-brand-brown/70 mb-6 italic">
          * {t("priceNoShipping")}
        </p>

        <div className="hairline mb-6" />

        {/* Color selector */}
        <div className="mb-6">
          <p className="eyebrow mb-3">{t("selectColor")} <span className="text-brand-brown/60 font-medium normal-case tracking-normal">— {selectedColor}</span></p>
          <div className="flex gap-2.5 flex-wrap">
            {colorOptions.map(([color, hex]) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); setSelectedSize(""); setQty(1); }}
                aria-label={color}
                className={cn(
                  "w-9 h-9 rounded-full transition-all tap-soft",
                  selectedColor === color
                    ? "ring-2 ring-brand-brown ring-offset-2 ring-offset-brand-cream"
                    : "ring-1 ring-brand-brown/15"
                )}
                style={{ backgroundColor: hex }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Size selector */}
        <div className="mb-6">
          <p className="eyebrow mb-3">{t("selectSize")}</p>
          <div className="grid grid-cols-6 gap-2">
            {(product.sizeType === "numbers" ? NUMBER_SIZES : LETTER_SIZES).map((size) => {
              const v = sizeVariant(size);
              const available = v && v.quantity > 0;
              return (
                <button
                  key={size}
                  disabled={!available}
                  onClick={() => { setSelectedSize(size); setQty(1); }}
                  className={cn(
                    "h-11 rounded-md border text-sm font-medium transition-all tap-soft",
                    selectedSize === size
                      ? "border-brand-brown bg-brand-brown text-brand-cream"
                      : available
                      ? "border-brand-brown/20 text-brand-brown hover:border-brand-brown"
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
          <div className="mb-6">
            <p className="eyebrow mb-3">{t("quantity")}</p>
            <div className="inline-flex items-center border border-brand-brown/20 rounded-full">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease"
                className="w-10 h-10 rounded-full text-brand-brown text-lg font-light disabled:opacity-30 hover:bg-brand-brown/5 transition-colors flex items-center justify-center"
              >−</button>
              <span className="text-base font-semibold w-10 text-center text-brand-brown">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                aria-label="Increase"
                className="w-10 h-10 rounded-full text-brand-brown text-lg font-light disabled:opacity-30 hover:bg-brand-brown/5 transition-colors flex items-center justify-center"
              >+</button>
            </div>
            {selectedVariant.quantity <= 3 && (
              <p className="text-xs text-brand-gold font-medium mt-2">Only {selectedVariant.quantity} left</p>
            )}
          </div>
        )}

        {/* Live total */}
        {total !== null && (
          <div className="bg-white border border-brand-cream-dark rounded-xl p-4 mb-8">
            <div className="flex justify-between text-sm text-brand-brown/70 mb-1">
              <span>{t("quantity")} ×{qty}</span>
              <span>₪{total.toLocaleString()}</span>
            </div>
            <div className="hairline mb-2 mt-2" />
            <div className="flex justify-between text-base font-bold text-brand-brown">
              <span>{t("liveTotal")}</span>
              <span className="h-display text-xl">₪{total.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-brand-brown/50 mt-2 italic">
              * {t("priceNoShipping")}
            </p>
          </div>
        )}

        {/* Description */}
        {description && (
          <>
            <div className="hairline mb-5" />
            <div>
              <p className="eyebrow mb-3">{t("description")}</p>
              <p className="text-sm text-brand-brown/75 leading-relaxed text-pretty">{description}</p>
            </div>
          </>
        )}
      </div>

      {/* Sticky Add to Cart */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-brand-cream/95 backdrop-blur-md border-t border-brand-cream-dark p-3 pb-safe md:relative md:border-0 md:bg-transparent md:px-5 md:pb-8">
        <div className="max-w-2xl mx-auto">
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
