"use client";

import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductForm from "@/components/admin/ProductForm";
import { ToastProvider } from "@/components/ui/Toast";

export default function NewProductPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <ToastProvider>
        <div className="p-5 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
          <div className="mb-6">
            <p className="eyebrow mb-1">קטלוג</p>
            <h1 className="h-display text-3xl text-brand-brown">מוצר חדש</h1>
          </div>
          <ProductForm />
        </div>
      </ToastProvider>
    </AdminLayout>
  );
}
