"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setError("");
    try {
      await signIn(values.email, values.password);
      router.replace(`/${locale}/admin/dashboard`);
    } catch {
      setError(t("invalidCredentials"));
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-gold">GalaBoutique</h1>
          <p className="text-sm text-brand-brown/60 mt-1">{t("title")}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-card p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-brand-brown mb-1">{t("email")}</label>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className={cn(
                "w-full border rounded-xl px-3 py-2.5 text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold",
                errors.email ? "border-red-400" : "border-brand-cream-dark"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-brown mb-1">{t("password")}</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className={cn(
                "w-full border rounded-xl px-3 py-2.5 text-sm bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold",
                errors.password ? "border-red-400" : "border-brand-cream-dark"
              )}
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <Button type="submit" fullWidth loading={isSubmitting}>
            {isSubmitting ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
