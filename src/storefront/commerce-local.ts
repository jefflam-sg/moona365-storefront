export const CART_EVENT = "moona365:cart-change";
const CART_KEY = "moona365-storefront-cart";
const WISHLIST_KEY = "moona365-storefront-wishlist";

type CartLine = { productId: string; variantId: string; quantity: number };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

export function cartCount() {
  return read<CartLine[]>(CART_KEY, []).reduce((total, line) => total + line.quantity, 0);
}

export function addCartLine(productId: string, variantId: string, quantity = 1) {
  const lines = read<CartLine[]>(CART_KEY, []);
  const existing = lines.find((line) => line.productId === productId && line.variantId === variantId);
  if (existing) existing.quantity += quantity;
  else lines.push({ productId, variantId, quantity });
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function wishlistHas(productId: string) {
  return read<string[]>(WISHLIST_KEY, []).includes(productId);
}

export function toggleWishlist(productId: string) {
  const values = new Set(read<string[]>(WISHLIST_KEY, []));
  if (values.has(productId)) values.delete(productId); else values.add(productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify([...values]));
  return values.has(productId);
}
