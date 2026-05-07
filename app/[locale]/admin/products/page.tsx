"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAllProducts, deleteProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all",          label: "הכל" },
  { key: "lowStock",     label: "מלאי נמוך" },
  { key: "outOfStock",   label: "אזל" },
  { key: "bestSeller",   label: "נמכרים" },
  { key: "specialOffer", label: "מבצעים" },
] as const;

type TabKey = typeof TABS[number]["key"];

function ProductsInner() {
  const locale = useLocale();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as TabKey) || "all";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>(initialFilter);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getAllProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await deleteProduct(deleteId);
    setProducts((p) => p.filter((x) => x.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
    toast("Product deleted");
  }

  let displayed = products.filter((p) => {
    const name = `${p.name.en} ${p.name.he}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;

    if (tab === "lowStock")     return p.variants.some((v) => v.quantity > 0 && v.quantity < 3);
    if (tab === "outOfStock")   return p.variants.every((v) => v.quantity === 0);
    if (tab === "bestSeller")   return !!p.isBestSeller;
    if (tab === "specialOffer") return !!p.isSpecialOffer;

    if (category !== "all" && p.category !== category) return false;
    return true;
  });

  if (sort === "price") {
    displayed = [...displayed].sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => v.salePrice ?? v.price));
      const bMin = Math.min(...b.variants.map((v) => v.salePrice ?? v.price));
      return aMin - bMin;
    });
  } else if (sort === "stock") {
    displayed = [...displayed].sort((a, b) => {
      const aTotal = a.variants.reduce((s, v) => s + v.quantity, 0);
      const bTotal = b.variants.reduce((s, v) => s + v.quantity, 0);
      return aTotal - bTotal;
    });
  }

  const tabCounts: Record<TabKey, number> = {
    all:          products.length,
    lowStock:     products.filter((p) => p.variants.some((v) => v.quantity > 0 && v.quantity < 3)).length,
    outOfStock:   products.filter((p) => p.variants.every((v) => v.quantity === 0)).length,
    bestSeller:   products.filter((p) => p.isBestSeller).length,
    specialOffer: products.filter((p) => p.isSpecialOffer).length,
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">קטלוג</p>
          <h1 className="h-display text-3xl text-brand-brown">מוצרים</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/admin/inventory`}>
            <Button variant="outline" size="sm">עדכון מלאי</Button>
          </Link>
          <Link href={`/${locale}/admin/products/new`}>
            <Button size="sm">+ חדש</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-4 border-b border-brand-cream-dark">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            onClick={() => setTab(tabDef.key)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors relative",
              tab === tabDef.key
                ? "text-brand-brown"
                : "text-brand-brown/45 hover:text-brand-brown/80"
            )}
          >
            {tabDef.label}
            <span className="ms-1.5 text-[10px] text-brand-brown/40">{tabCounts[tabDef.key]}</span>
            {tab === tabDef.key && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-brand-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          placeholder="חיפוש מוצרים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-cream-dark rounded-md px-3 py-2 text-sm bg-white text-brand-brown flex-1 min-w-[180px] focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-brand-cream-dark rounded-md px-3 py-2 text-sm bg-white text-brand-brown"
        >
          <option value="all">כל הקטגוריות</option>
          <option value="dresses">שמלות</option>
          <option value="tops">חולצות</option>
          <option value="pants">מכנסיים</option>
          <option value="suits">חליפות</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-brand-cream-dark rounded-md px-3 py-2 text-sm bg-white text-brand-brown"
        >
          <option value="newest">חדשים</option>
          <option value="price">מחיר</option>
          <option value="stock">רמת מלאי</option>
        </select>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-brand-brown/40">
          <p className="h-display text-2xl text-brand-brown/50">אין מוצרים</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-cream-dark rounded-xl overflow-hidden divide-y divide-brand-cream-dark">
          {displayed.map((product) => {
            const totalStock = product.variants.reduce((s, v) => s + v.quantity, 0);
            const isOOS = totalStock === 0;
            const isLow = !isOOS && product.variants.some((v) => v.quantity > 0 && v.quantity < 3);
            return (
              <div
                key={product.id}
                className="p-3 flex items-center gap-3 hover:bg-brand-cream/40 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-md overflow-hidden bg-brand-cream-dark/30 flex-shrink-0">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.name.en} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-brand-cream-dark" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-brown truncate">{product.name.he || product.name.en}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wide text-brand-brown/50">{product.category}</span>
                    {product.isBestSeller && <Badge variant="sale">★</Badge>}
                    {product.isSpecialOffer && <Badge variant="sale">מבצע</Badge>}
                    <span className={cn(
                      "text-xs font-medium",
                      isOOS  ? "text-red-500" :
                      isLow  ? "text-orange-600" :
                              "text-brand-brown/60"
                    )}>
                      {isOOS ? "אזל מהמלאי" : `${totalStock} במלאי`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/${locale}/admin/products/${product.id}`}>
                    <Button variant="outline" size="sm">ערוך</Button>
                  </Link>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    aria-label="Delete"
                    className="w-9 h-9 flex items-center justify-center text-brand-brown/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת מוצר">
        <p className="text-sm text-brand-brown/80 mb-6">
          האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו אינה הפיכה.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteId(null)}>ביטול</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>מחק</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function ProductsPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <Suspense fallback={null}>
        <ProductsInner />
      </Suspense>
    </AdminLayout>
  );
}
