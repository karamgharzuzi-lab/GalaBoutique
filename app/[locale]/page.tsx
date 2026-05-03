import { getTranslations } from "next-intl/server";
import Link from "next/link";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");

  const [specialOffersResult, bestSellersResult] = await Promise.allSettled([
    getProducts({ isSpecialOffer: true, pageSize: 8 }),
    getProducts({ isBestSeller: true, pageSize: 6 }),
  ]);
  const specialOffers = specialOffersResult.status === "fulfilled" ? specialOffersResult.value.products : [];
  const bestSellers   = bestSellersResult.status === "fulfilled"   ? bestSellersResult.value.products   : [];

  const categories = [
    { key: "dresses",     label: tCat("dresses") },
    { key: "tops",        label: tCat("tops") },
    { key: "jackets",     label: tCat("jackets") },
    { key: "coats",       label: tCat("coats") },
    { key: "accessories", label: tCat("accessories") },
  ];

  return (
    <StorefrontLayout locale={locale}>
      {/* Hero */}
      <section className="relative bg-brand-brown text-brand-cream overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-brown via-brand-brown-light/80 to-brand-brown opacity-90" />
        <div className="relative px-6 py-20 md:py-32 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-brand-gold">
            GalaBoutique
          </h1>
          <p className="text-xl md:text-2xl font-light text-brand-cream/90 mb-2">
            {t("heroTagline")}
          </p>
          <p className="text-sm text-brand-cream/60 mb-8">{t("heroSubtitle")}</p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-brown font-semibold px-8 py-3 rounded-full hover:bg-brand-gold-light transition-colors text-base"
          >
            {t("shopNow")}
          </Link>
        </div>
      </section>

      {/* Category Pills */}
      <section className="px-4 py-6">
        <h2 className="text-lg font-bold text-brand-brown mb-4">{t("shopByCategory")}</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/shop?category=${cat.key}`}
              className="flex-shrink-0 px-4 py-2 bg-white border border-brand-cream-dark rounded-full text-sm font-medium text-brand-brown hover:bg-brand-brown hover:text-brand-cream hover:border-brand-brown transition-colors"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      {specialOffers.length > 0 && (
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-brand-brown">{t("specialOffers")}</h2>
            <Link href={`/${locale}/shop`} className="text-sm text-brand-gold font-medium">{t("viewAll")}</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {specialOffers.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-44">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="px-4 py-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-brand-brown">{t("bestSellers")}</h2>
            <Link href={`/${locale}/shop`} className="text-sm text-brand-gold font-medium">{t("viewAll")}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
