import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GalaBoutique — Luxury Fashion",
  description: "Exclusive fashion boutique — Dresses, Tops, Jackets, Coats & Accessories",
  manifest: "/manifest.json",
  themeColor: "#3B1F0F",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as "en" | "he")) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === "he";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${inter.variable} ${heebo.variable}`}
    >
      <body className={`font-sans antialiased bg-brand-cream text-brand-brown min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
