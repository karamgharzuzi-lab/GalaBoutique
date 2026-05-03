"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAllProducts, deleteProduct } from "@/lib/products";
import { seedProducts } from "@/lib/seed";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const locale = useLocale();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    getAllProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  async function handleSeed() {
    if (!confirm("Add 10 sample products to test how the store looks? You can delete them later.")) return;
    setSeeding(true);
    try {
      const count = await seedProducts();
      const fresh = await getAllProducts();
      setProducts(fresh);
      toast(`Added ${count} sample products!`);
    } catch {
      toast("Seeding failed", "error");
    }
    setSeeding(false);
  }

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
    if (filter === "bestSeller") return p.isBestSeller;
    if (filter === "specialOffer") return p.isSpecialOffer;
    if (filter === "outOfStock") return p.variants.every((v) => v.quantity === 0);
    if (filter !== "all" && p.category !== filter) return false;
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

  return (
    <AdminLayout locale={locale}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand-brown">Products</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" loading={seeding} onClick={handleSeed}>
              {seeding ? "Seeding..." : "Seed Sample Products"}
            </Button>
            <Link href={`/${locale}/admin/products/new`}>
              <Button size="sm">+ New Product</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-brand-cream-dark rounded-xl px-3 py-2 text-sm bg-white text-brand-brown flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-brand-cream-dark rounded-xl px-3 py-2 text-sm bg-white text-brand-brown"
          >
            <option value="all">All</option>
            <option value="dresses">Dresses</option>
            <option value="tops">Tops</option>
            <option value="jackets">Jackets</option>
            <option value="coats">Coats</option>
            <option value="accessories">Accessories</option>
            <option value="bestSeller">Best Sellers</option>
            <option value="specialOffer">Special Offers</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-brand-cream-dark rounded-xl px-3 py-2 text-sm bg-white text-brand-brown"
          >
            <option value="newest">Newest</option>
            <option value="price">Price</option>
            <option value="stock">Stock Level</option>
          </select>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-brand-brown/40">
            <p className="text-lg font-semibold">No products found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((product) => {
              const totalStock = product.variants.reduce((s, v) => s + v.quantity, 0);
              const isOOS = totalStock === 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-card"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-cream flex-shrink-0">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name.en} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-brand-cream-dark" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-brown truncate">{product.name.en}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge>{product.category}</Badge>
                      {product.isBestSeller && <Badge variant="sale">⭐ Best Seller</Badge>}
                      {product.isSpecialOffer && <Badge variant="sale">🏷 Offer</Badge>}
                      <span className={cn("text-xs font-medium", isOOS ? "text-red-500" : "text-brand-brown/60")}>
                        {isOOS ? "Out of Stock" : `${totalStock} in stock`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link href={`/${locale}/admin/products/${product.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(product.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-sm text-brand-brown/80 mb-6">
          Are you sure you want to delete this product? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
