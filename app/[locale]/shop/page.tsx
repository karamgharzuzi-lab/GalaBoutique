"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import Button from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { CATEGORIES, SIZES } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function ShopPage() {
  const t = useTranslations("shop");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = params.get("category") || "all";
  const activeSize = params.get("size") || "";
  const sortOrder = params.get("sort") || "newest";

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value); else sp.delete(key);
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const load = useCallback(async (reset = true) => {
    setLoading(true);
    const cat = activeCategory === "all" ? undefined : activeCategory;
    const { products: newProducts, lastDoc: newLast } = await getProducts({
      category: cat,
      pageSize: PAGE_SIZE,
      cursor: reset ? null : lastDoc,
    });
    setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]));
    setLastDoc(newLast);
    setHasMore(newProducts.length === PAGE_SIZE);
    setLoading(false);
  }, [activeCategory, lastDoc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(true); }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side size filter
  const filtered = activeSize
    ? products.filter((p) => p.variants.some((v) => v.size === activeSize && v.quantity > 0))
    : products;

  const categoryOptions = [
    { key: "all", label: tCat("all") },
    ...CATEGORIES.map((c) => ({ key: c, label: tCat(c) })),
  ];

  return (
    <StorefrontLayout locale={locale}>
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-10">
        {/* Header row */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow mb-1">{t("title")}</p>
            <h1 className="h-display text-3xl text-brand-brown">The Edit</h1>
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-brand-brown/70 hover:text-brand-brown md:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {t("filters")}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4 -mx-5 px-5">
          {categoryOptions.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setParam("category", cat.key === "all" ? "" : cat.key)}
              className={cn(
                "flex-shrink-0 px-5 py-2 rounded-full text-sm transition-colors tap-soft",
                activeCategory === cat.key
                  ? "bg-brand-brown text-brand-cream"
                  : "bg-white border border-brand-cream-dark text-brand-brown hover:bg-brand-brown/5"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filters panel (mobile collapsible, desktop always shown) */}
        <div className={cn("mb-6 flex flex-wrap gap-3 items-center", !showFilters && "hidden md:flex")}>
          {/* Size filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="eyebrow">{t("size")}</span>
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setParam("size", activeSize === s ? "" : s)}
                className={cn(
                  "min-w-[36px] h-8 px-2 text-xs font-medium rounded-md border transition-colors tap-soft",
                  activeSize === s
                    ? "bg-brand-brown text-brand-cream border-brand-brown"
                    : "border-brand-brown/15 text-brand-brown hover:border-brand-brown/50"
                )}
              >
                {s}
              </button>
            ))}
            {(activeSize) && (
              <button
                onClick={() => { setParam("size", ""); }}
                className="text-xs text-brand-gold border-b border-brand-gold/40"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="ms-auto flex items-center gap-2">
            <span className="eyebrow">{tCommon("sortBy")}</span>
            <select
              value={sortOrder}
              onChange={(e) => setParam("sort", e.target.value)}
              className="text-xs border border-brand-brown/15 rounded-md px-2 py-1.5 bg-white text-brand-brown"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="price_asc">{t("sortPriceLow")}</option>
              <option value="price_desc">{t("sortPriceHigh")}</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-6">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-cream-dark">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <p className="h-display text-2xl text-brand-brown">{t("noProducts")}</p>
            <p className="text-sm text-brand-brown/60 max-w-xs">{t("noProductsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => load(false)}>
              {tCommon("loadMore")}
            </Button>
          </div>
        )}
        {loading && products.length > 0 && (
          <div className="mt-8 flex justify-center">
            <span className="w-6 h-6 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
