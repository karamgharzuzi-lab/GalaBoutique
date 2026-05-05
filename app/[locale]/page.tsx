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
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.35), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(232,201,106,0.18), transparent 60%)",
          }}
        />
        <div className="relative px-6 py-20 md:py-32 max-w-2xl mx-auto text-center">
          <p className="eyebrow text-brand-gold/80 mb-5">{t("heroSubtitle")}</p>
          <h1 className="h-display text-5xl md:text-7xl text-brand-cream mb-3 leading-[1.05] text-balance">
            GalaBoutique
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-10 h-px bg-brand-gold/60" />
            <span className="w-1.5 h-1.5 bg-brand-gold rotate-45" />
            <span className="w-10 h-px bg-brand-gold/60" />
          </div>
          <p className="h-display text-xl md:text-2xl text-brand-cream/85 italic font-normal mb-10 text-balance">
            {t("heroTagline")}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center justify-center bg-brand-gold text-brand-brown font-semibold tracking-luxe uppercase text-xs px-9 py-3.5 rounded-sm hover:bg-brand-gold-light transition-colors tap-soft"
          >
            {t("shopNow")}
          </Link>
        </div>
      </section>

      {/* Category Pills */}
      <section className="px-5 pt-10 pb-2">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow mb-1">{t("shopByCategory")}</p>
            <h2 className="h-display text-2xl text-brand-brown">Collections</h2>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${locale}/shop?category=${cat.key}`}
              className="flex-shrink-0 px-5 py-2.5 bg-white border border-brand-cream-dark rounded-full text-sm text-brand-brown hover:bg-brand-brown hover:text-brand-cream hover:border-brand-brown transition-colors tap-soft"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      {specialOffers.length > 0 && (
        <section className="px-5 pt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="eyebrow mb-1">{t("specialOffers")}</p>
              <h2 className="h-display text-2xl text-brand-brown">Curated Edits</h2>
            </div>
            <Link href={`/${locale}/shop`} className="text-xs font-semibold tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40 pb-0.5">
              {t("viewAll")}
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5">
            {specialOffers.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-44">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hairline */}
      <div className="px-8 my-10">
        <div className="hairline-gold" />
      </div>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="px-5 pb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="eyebrow mb-1">{t("bestSellers")}</p>
              <h2 className="h-display text-2xl text-brand-brown">Most Loved</h2>
            </div>
            <Link href={`/${locale}/shop`} className="text-xs font-semibold tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40 pb-0.5">
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
