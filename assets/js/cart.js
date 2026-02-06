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
    const sales = window.Sales?.getCached ? window.Sales.getCached() : [];

    const subtotalCents = cart.reduce((s, x) => s + x.price_cents * x.qty, 0);

    const discountCents = cart.reduce((s, x) => {
      const sale = (sales || []).length
        ? (function () {
            const catId = x.category_id || x.categoryId || null;
            if (!catId) {
              const storeSale = (sales || [])
                .filter((ss) => ss.scope === "store" && ss.active !== false)
                .sort((a, b) => (b.percent_off || 0) - (a.percent_off || 0))[0];
              return storeSale || null;
            }
            return window.Sales.bestForCategoryId(catId);
          })()
        : null;

      const pct = Number(sale?.percent_off || 0);
      if (!pct) return s;
      const perItem = Math.round((x.price_cents * pct) / 100);
      return s + perItem * x.qty;
    }, 0);

    const totalCents = Math.max(0, subtotalCents - discountCents);
    return { subtotalCents, discountCents, totalCents };
  },
};
