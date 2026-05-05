"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { getAllProducts, updateProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InventoryRow {
  productId: string;
  productName: string;
  variantIndex: number;
  size: string;
  color: string;
  colorHex: string;
  currentQty: number;
  newQty: string;
  dirty: boolean;
}

function InventoryInner() {
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllProducts().then((prods) => {
      setProducts(prods);
      const r: InventoryRow[] = [];
      prods.forEach((p) => {
        p.variants.forEach((v, idx) => {
          r.push({
            productId: p.id,
            productName: p.name.en,
            variantIndex: idx,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            currentQty: v.quantity,
            newQty: String(v.quantity),
            dirty: false,
          });
        });
      });
      setRows(r);
      setLoading(false);
    });
  }, []);

  function setNewQty(idx: number, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], newQty: value, dirty: value !== String(next[idx].currentQty) };
      return next;
    });
  }

  async function saveRow(idx: number) {
    const row = rows[idx];
    const qty = parseInt(row.newQty);
    if (isNaN(qty) || qty < 0) { toast("Invalid quantity", "error"); return; }
    const product = products.find((p) => p.id === row.productId);
    if (!product) return;
    const updatedVariants = product.variants.map((v, i) =>
      i === row.variantIndex ? { ...v, quantity: qty } : v
    );
    await updateProduct(row.productId, { variants: updatedVariants });
    setProducts((prev) => prev.map((p) => p.id === row.productId ? { ...p, variants: updatedVariants } : p));
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], currentQty: qty, dirty: false };
      return next;
    });
    toast("Inventory updated");
  }

  async function saveAll() {
    setSaving(true);
    const dirtyRows = rows.filter((r) => r.dirty);
    await Promise.all(dirtyRows.map((_, i) => saveRow(rows.indexOf(dirtyRows[i]))));
    setSaving(false);
    toast("All inventory updated");
  }

  const rowBg = (qty: number) => {
    if (qty === 0) return "bg-red-50";
    if (qty <= 2) return "bg-orange-50";
    return "";
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">Bulk update</p>
          <h1 className="h-display text-3xl text-brand-brown">Stock</h1>
        </div>
        {rows.some((r) => r.dirty) && (
          <Button size="sm" loading={saving} onClick={saveAll}>Save All Changes</Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="bg-white border border-brand-cream-dark rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-brand-cream-dark bg-brand-cream/30">
              <tr>
                <th className="text-start px-4 py-3 eyebrow">Product</th>
                <th className="text-start px-4 py-3 eyebrow">Size</th>
                <th className="text-start px-4 py-3 eyebrow">Color</th>
                <th className="text-center px-4 py-3 eyebrow">Current</th>
                <th className="text-center px-4 py-3 eyebrow">New</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.productId}-${row.variantIndex}`} className={cn("border-b border-brand-cream last:border-0 transition-colors", rowBg(row.currentQty))}>
                  <td className="px-4 py-3 text-brand-brown font-medium">{row.productName}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-brown text-sm">{row.size}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-gray-200" style={{ backgroundColor: row.colorHex }} />
                      <span className="text-brand-brown/80">{row.color}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "font-bold",
                      row.currentQty === 0 ? "text-red-600" :
                      row.currentQty <= 2 ? "text-orange-600" : "text-brand-brown"
                    )}>
                      {row.currentQty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number" min="0" value={row.newQty}
                      onChange={(e) => setNewQty(idx, e.target.value)}
                      className={cn(
                        "w-20 border rounded-xl px-2 py-1.5 text-sm text-center text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold",
                        row.dirty ? "border-brand-gold" : "border-brand-cream-dark"
                      )}
                    />
                  </td>
                  <td className="px-4 py-3 text-end">
                    {row.dirty && (
                      <Button size="sm" variant="secondary" onClick={() => saveRow(idx)}>Save</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <ToastProvider>
        <InventoryInner />
      </ToastProvider>
    </AdminLayout>
  );
}
