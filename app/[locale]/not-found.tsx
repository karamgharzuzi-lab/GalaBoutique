import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="text-8xl font-bold text-brand-cream-dark">404</div>
      <h1 className="text-2xl font-bold text-brand-brown">{t("404Title")}</h1>
      <p className="text-brand-brown/60">{t("404Desc")}</p>
      <Link
        href="/en/shop"
        className="inline-flex items-center gap-2 bg-brand-brown text-brand-cream font-semibold px-6 py-3 rounded-full hover:bg-brand-brown-light transition-colors"
      >
        {t("backToShop")}
      </Link>
    </div>
  );
}
