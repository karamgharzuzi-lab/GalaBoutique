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
        <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-8">
          <h1 className="text-2xl font-bold text-brand-brown mb-6">New Product</h1>
          <ProductForm />
        </div>
      </ToastProvider>
    </AdminLayout>
  );
}
