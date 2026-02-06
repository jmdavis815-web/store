// assets/js/cart.js
const CART_KEY = "store_cart_v1";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

window.Cart = {
  get() {
    return readCart();
  },

  add(item, qty = 1) {
    const cart = readCart();
    const found = cart.find((x) => x.id === item.id);
    if (found) found.qty += qty;
    else cart.push({ ...item, qty });
    writeCart(cart);
  },

  updateQty(id, qty) {
    const cart = readCart();
    const found = cart.find((x) => x.id === id);
    if (!found) return;
    found.qty = Math.max(1, qty);
    writeCart(cart);
  },

  remove(id) {
    writeCart(readCart().filter((x) => x.id !== id));
  },

  clear() {
    writeCart([]);
  },

  totals() {
    const cart = readCart();
    const subtotalCents = cart.reduce((s, x) => s + x.price_cents * x.qty, 0);
    return { subtotalCents };
  },
};
