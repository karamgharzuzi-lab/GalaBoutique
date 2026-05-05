"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale() as "en" | "he";
  const t = useTranslations("common");

  const name = product.name[locale] || product.name.en;
  const isOutOfStock = product.variants.every((v) => v.quantity === 0);
  const primaryImage = product.images[0] || "";

  // Unique colors for swatch display
  const colors = Array.from(
    new Map(product.variants.map((v) => [v.color, v.colorHex])).entries()
  );

  // Best price
  const prices = product.variants.map((v) => v.salePrice ?? v.price);
  const minPrice = Math.min(...prices);
  const hasVariantSale = product.variants.some((v) => v.salePrice && v.salePrice < v.price);

  return (
    <Link href={`/${locale}/product/${product.id}`} className="group block tap-soft">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-brand-cream-dark/30 overflow-hidden rounded-xl">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-cream-dark">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-brand-cream/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[10px] font-semibold tracking-luxe uppercase text-brand-brown bg-brand-cream/90 px-3 py-1.5 rounded-sm border border-brand-brown/15">
              {t("outOfStock")}
            </span>
          </div>
        )}

        {hasVariantSale && !isOutOfStock && (
          <div className="absolute top-2 start-2">
            <span className="text-[10px] font-semibold tracking-luxe uppercase text-brand-brown bg-brand-gold/95 px-2 py-1 rounded-sm">
              Sale
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 pb-1 px-0.5">
        <p className="text-[13px] text-brand-brown line-clamp-1 font-medium">{name}</p>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-sm font-semibold ${hasVariantSale ? "text-brand-gold" : "text-brand-brown"}`}>
            ₪{minPrice.toLocaleString()}
          </span>
        </div>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex gap-1 mt-2">
            {colors.slice(0, 5).map(([colorName, hex]) => (
              <span
                key={colorName}
                className="w-3 h-3 rounded-full ring-1 ring-brand-brown/15"
                style={{ backgroundColor: hex }}
                title={colorName}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] text-brand-brown/40 self-center ms-0.5">+{colors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
