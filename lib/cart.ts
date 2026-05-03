export interface CartItem {
  productId: string;
  nameEn: string;
  nameHe: string;
  size: string;
  color: string;
  colorHex: string;
  qty: number;
  unitPrice: number;
  imageUrl: string;
}

const CART_KEY = "gala_cart";
const REGION_KEY = "gala_shipping_region";
const LOCALE_KEY = "gala_locale";

function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getCart(): CartItem[] {
  const ls = safeLocalStorage();
  if (!ls) return [];
  try {
    return JSON.parse(ls.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart(): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.removeItem(CART_KEY);
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (c) =>
      c.productId === item.productId &&
      c.size === item.size &&
      c.color === item.color
  );

  if (existingIndex >= 0) {
    cart[existingIndex].qty = Math.min(
      cart[existingIndex].qty + item.qty,
      10
    );
  } else {
    cart.push(item);
  }

  setCart(cart);
  return cart;
}

export function removeFromCart(productId: string, size: string, color: string): CartItem[] {
  const cart = getCart().filter(
    (c) => !(c.productId === productId && c.size === size && c.color === color)
  );
  setCart(cart);
  return cart;
}

export function updateCartItemQty(
  productId: string,
  size: string,
  color: string,
  qty: number
): CartItem[] {
  const cart = getCart().map((c) =>
    c.productId === productId && c.size === size && c.color === color
      ? { ...c, qty: Math.max(1, Math.min(qty, 10)) }
      : c
  );
  setCart(cart);
  return cart;
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export function getShippingRegion(): string {
  const ls = safeLocalStorage();
  if (!ls) return "center";
  return ls.getItem(REGION_KEY) || "center";
}

export function setShippingRegion(region: string): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.setItem(REGION_KEY, region);
}

export function getLocale(): string {
  const ls = safeLocalStorage();
  if (!ls) return "en";
  return ls.getItem(LOCALE_KEY) || "en";
}

export function setLocale(locale: string): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.setItem(LOCALE_KEY, locale);
}
