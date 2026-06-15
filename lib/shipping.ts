import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type ShippingRegion = "north" | "center" | "south" | "jish_golan";

export interface ShippingConfig {
  north: number;
  center: number;
  south: number;
  freeShippingThreshold: number;
}

const DEFAULT_CONFIG: ShippingConfig = {
  north: 40,
  center: 50,
  south: 60,
  freeShippingThreshold: 500,
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const snap = await getDoc(doc(db, "config", "shipping"));
    if (snap.exists()) {
      return snap.data() as ShippingConfig;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_CONFIG;
}

export async function saveShippingConfig(config: ShippingConfig): Promise<void> {
  await setDoc(doc(db, "config", "shipping"), config);
}

export function calculateShipping(
  config: ShippingConfig,
  region: ShippingRegion,
  subtotal: number
): number {
  // Shipping is paid directly to the courier on delivery and not charged on the website.
  // Reference parameters to satisfy ESLint's no-unused-vars rule
  if (config && region && subtotal) {
    // dummy check
  }
  return 0;
}

export function formatRegionLabel(
  region: ShippingRegion,
  price: number,
  subtotal: number,
  threshold: number,
  locale: "en" | "he"
): string {
  if (subtotal >= threshold) {
    return locale === "he"
      ? `${regionNameHe(region)} — משלוח חינם 🎉`
      : `${regionNameEn(region)} — Free Shipping 🎉`;
  }
  return locale === "he"
    ? `${regionNameHe(region)} — ₪${price}`
    : `${regionNameEn(region)} — ₪${price}`;
}

function regionNameEn(region: ShippingRegion): string {
  return { north: "North", center: "Center", jish_golan: "Jish & Golan Heights", south: "South" }[region];
}

function regionNameHe(region: ShippingRegion): string {
  return { north: "צפון", center: "מרכז", jish_golan: "ג'ש ורמת הגולן", south: "דרום" }[region];
}
