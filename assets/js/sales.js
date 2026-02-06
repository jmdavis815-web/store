// assets/js/sales.js
// Client-side sale cache + discount helpers.

const SALES_KEY = "store_sales_v1";
const SALES_TTL_MS = 60 * 1000; // 1 minute cache

function readSalesCache() {
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || "null");
  } catch {
    return null;
  }
}

function writeSalesCache(payload) {
  localStorage.setItem(SALES_KEY, JSON.stringify(payload));
}

function isActiveSale(s) {
  if (!s) return false;
  if (s.active === false) return false;

  const now = Date.now();
  const starts = s.starts_at ? new Date(s.starts_at).getTime() : null;
  const ends = s.ends_at ? new Date(s.ends_at).getTime() : null;

  if (starts && now < starts) return false;
  if (ends && now > ends) return false;
  return true;
}

function saleAppliesToCategoryId(sale, categoryId) {
  if (!isActiveSale(sale)) return false;
  if (sale.scope === "store") return true;
  if (sale.scope === "categories") {
    const ids = sale.category_ids || [];
    return ids.includes(categoryId);
  }
  return false;
}

function pickBestSaleForCategoryId(sales, categoryId) {
  const applicable = (sales || []).filter((s) =>
    saleAppliesToCategoryId(s, categoryId),
  );
  if (!applicable.length) return null;
  applicable.sort((a, b) => (b.percent_off || 0) - (a.percent_off || 0));
  return applicable[0];
}

window.Sales = {
  async ensureLoaded(force = false) {
    const cached = readSalesCache();
    const freshEnough =
      cached && Date.now() - (cached.fetchedAt || 0) < SALES_TTL_MS;
    if (!force && freshEnough && Array.isArray(cached.sales))
      return cached.sales;

    const sales = await StoreApi.getActiveSales();
    writeSalesCache({ fetchedAt: Date.now(), sales });
    return sales;
  },

  getCached() {
    const cached = readSalesCache();
    return Array.isArray(cached?.sales) ? cached.sales : [];
  },

  bestForCategoryId(categoryId) {
    return pickBestSaleForCategoryId(window.Sales.getCached(), categoryId);
  },

  priceAfterSale(priceCents, sale) {
    const pct = Number(sale?.percent_off || 0);
    if (!pct || pct <= 0) return { finalCents: priceCents, discountCents: 0 };
    const discountCents = Math.round((priceCents * pct) / 100);
    return {
      finalCents: Math.max(0, priceCents - discountCents),
      discountCents,
    };
  },

  bestForProduct(product) {
    const catId = product?.category_id || product?.categoryId || null;
    if (!catId) return null;
    return pickBestSaleForCategoryId(window.Sales.getCached(), catId);
  },

  // Returns { sale, finalCents, discountCents }
  applyToProductPrice(product, priceCents) {
    const sale = window.Sales.bestForProduct(product);
    const { finalCents, discountCents } = window.Sales.priceAfterSale(
      priceCents,
      sale,
    );
    return { sale, finalCents, discountCents };
  },
};
