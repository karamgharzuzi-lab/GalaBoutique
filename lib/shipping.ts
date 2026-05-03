import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type ShippingRegion = "north" | "center" | "south";

export interface ShippingConfig {
  north: number;
  center: number;
  south: number;
  freeShippingThreshold: number;
}

const DEFAULT_CONFIG: ShippingConfig = {
  north: 45,
  center: 30,
  south: 40,
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
  if (subtotal >= config.freeShippingThreshold) return 0;
  return config[region];
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
  return { north: "North", center: "Center", south: "South" }[region];
}

function regionNameHe(region: ShippingRegion): string {
  return { north: "צפון", center: "מרכז", south: "דרום" }[region];
}
