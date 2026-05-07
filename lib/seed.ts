import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "./types";

type SeedProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;

// Picsum photos with consistent seeds — same seed = same image, always works
const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/900`;

const SEED_PRODUCTS: SeedProduct[] = [
  // ── Dresses ──────────────────────────────────────────────────────────────
  {
    name: { en: "Floral Midi Dress", he: "שמלת מידי פרחונית" },
    description: {
      en: "Elegant floral midi dress with a flowing silhouette. Perfect for weddings and special occasions.",
      he: "שמלת מידי פרחונית אלגנטית עם סילואט זורם. מושלמת לחתונות ואירועים מיוחדים.",
    },
    category: "dresses",
    images: [img("floral-dress-1"), img("floral-dress-2")],
    isBestSeller: true,
    isSpecialOffer: false,
    variants: [
      { size: "S",  color: "White", colorHex: "#F5F5F5", quantity: 6,  price: 349 },
      { size: "M",  color: "White", colorHex: "#F5F5F5", quantity: 10, price: 349 },
      { size: "L",  color: "White", colorHex: "#F5F5F5", quantity: 4,  price: 349 },
      { size: "XL", color: "White", colorHex: "#F5F5F5", quantity: 3,  price: 349 },
      { size: "S",  color: "Rose",  colorHex: "#C5938A", quantity: 5,  price: 349 },
      { size: "M",  color: "Rose",  colorHex: "#C5938A", quantity: 8,  price: 349 },
      { size: "L",  color: "Rose",  colorHex: "#C5938A", quantity: 3,  price: 349 },
    ],
  },
  {
    name: { en: "Classic Black Dress", he: "שמלה שחורה קלאסית" },
    description: {
      en: "Timeless little black dress. Versatile and chic for any evening event.",
      he: "שמלה שחורה קצרה נצחית. רב-תכליתית ואלגנטית לכל אירוע ערב.",
    },
    category: "dresses",
    images: [img("black-dress-1"), img("black-dress-2")],
    isBestSeller: true,
    isSpecialOffer: true,
    variants: [
      { size: "XS", color: "Black", colorHex: "#1A1A1A", quantity: 4,  price: 299, salePrice: 229 },
      { size: "S",  color: "Black", colorHex: "#1A1A1A", quantity: 9,  price: 299, salePrice: 229 },
      { size: "M",  color: "Black", colorHex: "#1A1A1A", quantity: 12, price: 299, salePrice: 229 },
      { size: "L",  color: "Black", colorHex: "#1A1A1A", quantity: 7,  price: 299, salePrice: 229 },
      { size: "XL", color: "Black", colorHex: "#1A1A1A", quantity: 4,  price: 299, salePrice: 229 },
    ],
  },
  {
    name: { en: "Lace Evening Gown", he: "שמלת ערב תחרה" },
    description: {
      en: "Sophisticated lace evening gown with a subtle train. Statement piece for galas.",
      he: "שמלת ערב תחרה מתוחכמת עם שובל עדין. פריט בולט לאירועי גאלה.",
    },
    category: "dresses",
    images: [img("lace-gown-1"), img("lace-gown-2")],
    isBestSeller: false,
    isSpecialOffer: false,
    variants: [
      { size: "S",   color: "Champagne", colorHex: "#F7E7CE", quantity: 2, price: 699 },
      { size: "M",   color: "Champagne", colorHex: "#F7E7CE", quantity: 3, price: 699 },
      { size: "L",   color: "Champagne", colorHex: "#F7E7CE", quantity: 2, price: 699 },
      { size: "S",   color: "Navy",      colorHex: "#1B2A4A", quantity: 2, price: 699 },
      { size: "M",   color: "Navy",      colorHex: "#1B2A4A", quantity: 3, price: 699 },
    ],
  },

  // ── Tops ─────────────────────────────────────────────────────────────────
  {
    name: { en: "Silk Ruffle Blouse", he: "חולצת משי עם מלמלה" },
    description: {
      en: "Luxurious silk blouse with ruffle details. Effortlessly elevates any outfit.",
      he: "חולצת משי יוקרתית עם פרטי מלמלה. משדרגת כל תלבושת ללא מאמץ.",
    },
    category: "tops",
    images: [img("silk-blouse-1"), img("silk-blouse-2")],
    isBestSeller: false,
    isSpecialOffer: true,
    variants: [
      { size: "XS", color: "Ivory",  colorHex: "#FFFFF0", quantity: 5,  price: 249, salePrice: 179 },
      { size: "S",  color: "Ivory",  colorHex: "#FFFFF0", quantity: 8,  price: 249, salePrice: 179 },
      { size: "M",  color: "Ivory",  colorHex: "#FFFFF0", quantity: 10, price: 249, salePrice: 179 },
      { size: "L",  color: "Ivory",  colorHex: "#FFFFF0", quantity: 5,  price: 249, salePrice: 179 },
      { size: "XS", color: "Black",  colorHex: "#1A1A1A", quantity: 4,  price: 249, salePrice: 179 },
      { size: "S",  color: "Black",  colorHex: "#1A1A1A", quantity: 6,  price: 249, salePrice: 179 },
      { size: "M",  color: "Black",  colorHex: "#1A1A1A", quantity: 8,  price: 249, salePrice: 179 },
    ],
  },
  {
    name: { en: "Linen Wrap Top", he: "טופ כריכה מפשתן" },
    description: {
      en: "Breezy linen wrap top with a flattering V-neckline. Ideal for warm-weather days.",
      he: "טופ כריכה מפשתן קליל עם מחשוף V מחמיא. אידיאלי לימים חמים.",
    },
    category: "tops",
    images: [img("linen-top-1"), img("linen-top-2")],
    isBestSeller: true,
    isSpecialOffer: false,
    variants: [
      { size: "XS", color: "Sage",  colorHex: "#8FAF8F", quantity: 7,  price: 189 },
      { size: "S",  color: "Sage",  colorHex: "#8FAF8F", quantity: 10, price: 189 },
      { size: "M",  color: "Sage",  colorHex: "#8FAF8F", quantity: 9,  price: 189 },
      { size: "L",  color: "Sage",  colorHex: "#8FAF8F", quantity: 5,  price: 189 },
      { size: "XS", color: "Beige", colorHex: "#D4B896", quantity: 6,  price: 189 },
      { size: "S",  color: "Beige", colorHex: "#D4B896", quantity: 9,  price: 189 },
      { size: "M",  color: "Beige", colorHex: "#D4B896", quantity: 7,  price: 189 },
      { size: "L",  color: "Beige", colorHex: "#D4B896", quantity: 4,  price: 189 },
    ],
  },

  // ── Jackets ───────────────────────────────────────────────────────────────
  {
    name: { en: "Leather Biker Jacket", he: "ז'קט עור בסגנון בייקר" },
    description: {
      en: "Classic leather biker jacket with gold hardware. Adds edge to any look.",
      he: "ז'קט עור בייקר קלאסי עם אבזמי זהב. מוסיף קצה לכל מראה.",
    },
    category: "tops",
    images: [img("biker-jacket-1"), img("biker-jacket-2")],
    isBestSeller: false,
    isSpecialOffer: true,
    variants: [
      { size: "XS", color: "Black", colorHex: "#1A1A1A", quantity: 3,  price: 599, salePrice: 449 },
      { size: "S",  color: "Black", colorHex: "#1A1A1A", quantity: 5,  price: 599, salePrice: 449 },
      { size: "M",  color: "Black", colorHex: "#1A1A1A", quantity: 6,  price: 599, salePrice: 449 },
      { size: "L",  color: "Black", colorHex: "#1A1A1A", quantity: 4,  price: 599, salePrice: 449 },
      { size: "S",  color: "Brown", colorHex: "#5C2E00", quantity: 3,  price: 599, salePrice: 449 },
      { size: "M",  color: "Brown", colorHex: "#5C2E00", quantity: 4,  price: 599, salePrice: 449 },
    ],
  },
  {
    name: { en: "Denim Jacket", he: "ג'קט ג'ינס" },
    description: {
      en: "Relaxed-fit denim jacket, a wardrobe staple that pairs with everything.",
      he: "ג'קט ג'ינס בגזרה רפויה, עמוד תווך בארון שמתאים לכל דבר.",
    },
    category: "tops",
    images: [img("denim-jacket-1"), img("denim-jacket-2")],
    isBestSeller: false,
    isSpecialOffer: false,
    variants: [
      { size: "XS", color: "Light Blue", colorHex: "#7EC8E3", quantity: 4,  price: 319 },
      { size: "S",  color: "Light Blue", colorHex: "#7EC8E3", quantity: 7,  price: 319 },
      { size: "M",  color: "Light Blue", colorHex: "#7EC8E3", quantity: 9,  price: 319 },
      { size: "L",  color: "Light Blue", colorHex: "#7EC8E3", quantity: 6,  price: 319 },
      { size: "XL", color: "Light Blue", colorHex: "#7EC8E3", quantity: 3,  price: 319 },
    ],
  },

  // ── Coats ─────────────────────────────────────────────────────────────────
  {
    name: { en: "Wool Blend Overcoat", he: "מעיל צמר" },
    description: {
      en: "Tailored wool-blend overcoat with a structured silhouette. A winter investment piece.",
      he: "מעיל צמר מחויט עם סילואט מובנה. פריט השקעה לחורף.",
    },
    category: "suits",
    images: [img("wool-coat-1"), img("wool-coat-2")],
    isBestSeller: true,
    isSpecialOffer: false,
    variants: [
      { size: "XS", color: "Camel",  colorHex: "#C19A6B", quantity: 3,  price: 899 },
      { size: "S",  color: "Camel",  colorHex: "#C19A6B", quantity: 5,  price: 899 },
      { size: "M",  color: "Camel",  colorHex: "#C19A6B", quantity: 6,  price: 899 },
      { size: "L",  color: "Camel",  colorHex: "#C19A6B", quantity: 4,  price: 899 },
      { size: "XL", color: "Camel",  colorHex: "#C19A6B", quantity: 2,  price: 899 },
      { size: "XS", color: "Black",  colorHex: "#1A1A1A", quantity: 3,  price: 899 },
      { size: "S",  color: "Black",  colorHex: "#1A1A1A", quantity: 4,  price: 899 },
      { size: "M",  color: "Black",  colorHex: "#1A1A1A", quantity: 5,  price: 899 },
      { size: "L",  color: "Black",  colorHex: "#1A1A1A", quantity: 3,  price: 899 },
    ],
  },

  // ── Accessories ───────────────────────────────────────────────────────────
  {
    name: { en: "Structured Leather Bag", he: "תיק עור מובנה" },
    description: {
      en: "Premium structured leather bag with gold chain strap. Fits all essentials.",
      he: "תיק עור איכותי ומובנה עם רצועת שרשרת זהב. מתאים לכל הצרכים.",
    },
    category: "suits",
    images: [img("leather-bag-1"), img("leather-bag-2")],
    isBestSeller: true,
    isSpecialOffer: true,
    variants: [
      { size: "S", color: "Black",  colorHex: "#1A1A1A", quantity: 8,  price: 499, salePrice: 379 },
      { size: "S", color: "Cognac", colorHex: "#9E4A2A", quantity: 6,  price: 499, salePrice: 379 },
      { size: "S", color: "Cream",  colorHex: "#FFFDD0", quantity: 4,  price: 499, salePrice: 379 },
    ],
  },
  {
    name: { en: "Pearl & Gold Necklace", he: "שרשרת פנינה וזהב" },
    description: {
      en: "Delicate layered necklace combining freshwater pearls and 18k gold-plated chain.",
      he: "שרשרת שכבות עדינה המשלבת פנינים מים מתוקים ושרשרת מצופה זהב 18K.",
    },
    category: "suits",
    images: [img("pearl-necklace-1"), img("pearl-necklace-2")],
    isBestSeller: false,
    isSpecialOffer: false,
    variants: [
      { size: "S", color: "Gold",   colorHex: "#C9A84C", quantity: 15, price: 249 },
      { size: "S", color: "Silver", colorHex: "#C0C0C0", quantity: 12, price: 249 },
    ],
  },
];

export async function seedProducts(): Promise<number> {
  const results = await Promise.allSettled(
    SEED_PRODUCTS.map((product) =>
      addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
  return results.filter((r) => r.status === "fulfilled").length;
}
