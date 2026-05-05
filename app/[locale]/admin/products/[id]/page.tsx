"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductForm from "@/components/admin/ProductForm";
import { ToastProvider } from "@/components/ui/Toast";
import { getProductById } from "@/lib/products";
import type { Product } from "@/lib/types";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductById(params.id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [params.id]);

  return (
    <AdminLayout locale={locale}>
      <ToastProvider>
        <div className="p-5 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
          <div className="mb-6">
            <p className="eyebrow mb-1">קטלוג</p>
            <h1 className="h-display text-3xl text-brand-brown">עריכת מוצר</h1>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="w-8 h-8 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
            </div>
          ) : product ? (
            <ProductForm initial={product} />
          ) : (
            <p className="text-brand-brown/60">המוצר לא נמצא.</p>
          )}
        </div>
      </ToastProvider>
    </AdminLayout>
  );
}
