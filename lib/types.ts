import type { Timestamp } from "firebase/firestore";

export interface ProductVariant {
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
  color: string;
  colorHex: string;
  quantity: number;
  price: number;
  salePrice?: number;
}

export interface Product {
  id: string;
  name: { en: string; he: string };
  description: { en: string; he: string };
  category: "dresses" | "tops" | "jackets" | "coats" | "accessories";
  images: string[];
  variants: ProductVariant[];
  isBestSeller: boolean;
  isSpecialOffer: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderItem {
  productId: string;
  nameEn: string;
  nameHe: string;
  size: string;
  color: string;
  colorHex: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    notes: string;
  };
  items: OrderItem[];
  shippingRegion: "north" | "center" | "south";
  shippingCost: number;
  subtotal: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "failed";
  locale: "en" | "he";
  createdAt?: Timestamp;
}

export interface ShippingConfig {
  north: number;
  center: number;
  south: number;
  freeShippingThreshold: number;
}

export type ProductCategory = Product["category"];
export type ProductSize = ProductVariant["size"];
export type OrderStatus = Order["status"];
export type ShippingRegion = Order["shippingRegion"];

export const SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export const CATEGORIES: ProductCategory[] = ["dresses", "tops", "jackets", "coats", "accessories"];
