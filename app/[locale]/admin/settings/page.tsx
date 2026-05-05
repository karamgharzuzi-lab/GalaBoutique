"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { getShippingConfig, saveShippingConfig } from "@/lib/shipping";
import type { ShippingConfig } from "@/lib/types";

function SettingsInner() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ShippingConfig>({ north: 45, center: 30, south: 40, freeShippingThreshold: 500 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShippingConfig().then((c) => { setConfig(c); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveShippingConfig(config);
    setSaving(false);
    toast("Settings saved!");
  }

  function setField(field: keyof ShippingConfig, value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setConfig((prev) => ({ ...prev, [field]: num }));
  }

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto pb-24 md:pb-8">
      <div className="mb-6">
        <p className="eyebrow mb-1">Configuration</p>
        <h1 className="h-display text-3xl text-brand-brown">Settings</h1>
      </div>

      <div className="bg-white border border-brand-cream-dark rounded-xl p-6 space-y-5">
        <p className="eyebrow">Shipping Prices</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {[
              { key: "north",  label: "North (₪)" },
              { key: "center", label: "Center (₪)" },
              { key: "south",  label: "South (₪)" },
              { key: "freeShippingThreshold", label: "Free Shipping Threshold (₪)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={config[key as keyof ShippingConfig]}
                  onChange={(e) => setField(key as keyof ShippingConfig, e.target.value)}
                  className="w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
            ))}

            <div className="bg-brand-cream rounded-xl p-3 text-xs text-brand-brown/70">
              <p>When order subtotal ≥ threshold, shipping is free for all regions.</p>
              <p className="mt-1">Changes apply live on the storefront immediately after saving.</p>
            </div>

            <Button fullWidth loading={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <ToastProvider>
        <SettingsInner />
      </ToastProvider>
    </AdminLayout>
  );
}
