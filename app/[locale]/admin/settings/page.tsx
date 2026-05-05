"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { getShippingConfig, saveShippingConfig } from "@/lib/shipping";
import { getCurrentUser, updateAdminCredentials } from "@/lib/auth";
import type { ShippingConfig } from "@/lib/types";

function SettingsInner() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ShippingConfig>({ north: 45, center: 30, south: 40, freeShippingThreshold: 500 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    getShippingConfig().then((c) => { setConfig(c); setLoading(false); });
    const user = getCurrentUser();
    if (user?.email) setNewEmail(user.email);
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

  async function handleSaveCredentials() {
    if (!currentPassword) { toast("יש להזין סיסמה נוכחית", "error"); return; }
    if (!newEmail && !newPassword) { toast("יש להזין אימייל חדש או סיסמה חדשה", "error"); return; }
    if (newPassword && newPassword !== confirmPassword) { toast("הסיסמאות אינן תואמות", "error"); return; }
    if (newPassword && newPassword.length < 6) { toast("הסיסמה חייבת להכיל לפחות 6 תווים", "error"); return; }

    setSavingCredentials(true);
    try {
      await updateAdminCredentials(
        currentPassword,
        newEmail || undefined,
        newPassword || undefined,
      );
      toast("פרטי הכניסה עודכנו בהצלחה");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast("סיסמה נוכחית שגויה", "error");
      } else if (code === "auth/email-already-in-use") {
        toast("האימייל כבר בשימוש", "error");
      } else if (code === "auth/invalid-email") {
        toast("כתובת אימייל לא תקינה", "error");
      } else {
        toast("שגיאה בעדכון פרטי הכניסה", "error");
      }
    }
    setSavingCredentials(false);
  }

  return (
    <div className="p-5 md:p-8 max-w-lg mx-auto pb-24 md:pb-8 space-y-5">
      <div className="mb-1">
        <p className="eyebrow mb-1">הגדרות</p>
        <h1 className="h-display text-3xl text-brand-brown">הגדרות</h1>
      </div>

      <div className="bg-white border border-brand-cream-dark rounded-xl p-6 space-y-5">
        <p className="eyebrow">מחירי משלוח</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {[
              { key: "north",  label: "צפון (₪)" },
              { key: "center", label: "מרכז (₪)" },
              { key: "south",  label: "דרום (₪)" },
              { key: "freeShippingThreshold", label: "סף משלוח חינם (₪)" },
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
              <p>כשסכום ההזמנה ≥ לסף, המשלוח חינם לכל האזורים.</p>
              <p className="mt-1">השינויים נכנסים לתוקף מיד לאחר השמירה.</p>
            </div>

            <Button fullWidth loading={saving} onClick={handleSave}>
              {saving ? "שומר..." : "שמור הגדרות"}
            </Button>
          </>
        )}
      </div>

      {/* Change Credentials */}
      <div className="bg-white border border-brand-cream-dark rounded-xl p-6 space-y-5">
        <p className="eyebrow">שינוי פרטי כניסה</p>

        {[
          { label: "סיסמה נוכחית", type: "password", value: currentPassword, set: setCurrentPassword },
        ].map(({ label, type, value, set }) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">{label}</label>
            <input
              type={type}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
            />
          </div>
        ))}

        <div className="hairline" />

        <div>
          <label className="block text-[11px] font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">אימייל חדש</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
          />
        </div>

        {[
          { label: "סיסמה חדשה", value: newPassword, set: setNewPassword },
          { label: "אישור סיסמה חדשה", value: confirmPassword, set: setConfirmPassword },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">{label}</label>
            <input
              type="password"
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
            />
          </div>
        ))}

        <Button fullWidth loading={savingCredentials} onClick={handleSaveCredentials}>
          {savingCredentials ? "מעדכן..." : "עדכן פרטי כניסה"}
        </Button>
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
