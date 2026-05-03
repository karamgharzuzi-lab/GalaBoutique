"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Badge from "@/components/ui/Badge";
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
    <Link href={`/${locale}/product/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden transition-shadow duration-200 group-hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-brand-cream overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
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
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Badge variant="outOfStock">{t("outOfStock")}</Badge>
            </div>
          )}

          {hasVariantSale && !isOutOfStock && (
            <div className="absolute top-2 start-2">
              <Badge variant="sale">Sale</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-brand-brown truncate">{name}</p>
          <p className="text-sm text-brand-brown/70 mt-0.5">₪{minPrice.toLocaleString()}</p>

          {/* Color swatches */}
          {colors.length > 0 && (
            <div className="flex gap-1 mt-2">
              {colors.slice(0, 5).map(([colorName, hex]) => (
                <span
                  key={colorName}
                  className="w-4 h-4 rounded-full border border-white ring-1 ring-gray-200"
                  style={{ backgroundColor: hex }}
                  title={colorName}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-[10px] text-brand-brown/50 self-center">+{colors.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
