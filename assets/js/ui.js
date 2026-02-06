// assets/js/ui.js
window.fmtMoney = function (cents, currency = "USD") {
  const v = (cents / 100).toFixed(2);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(v));
};

window.qs = (k) => new URLSearchParams(location.search).get(k);

window.renderNavbar = function () {
  const count = (window.Cart.get() || []).reduce((s, x) => s + x.qty, 0);
  const el = document.getElementById("cartBadge");
  if (el) el.textContent = String(count);
};

window.renderSaleBanner = function (mountEl, sales, opts = {}) {
  if (!mountEl) return;
  const list = (sales || []).filter((s) => s?.active !== false);
  if (!list.length) {
    mountEl.innerHTML = "";
    return;
  }

  list.sort((a, b) => (b.percent_off || 0) - (a.percent_off || 0));
  const s = list[0];

  const scopeText = s.scope === "store" ? "Store-wide" : "Selected categories";

  mountEl.innerHTML = `
    <div class="sale-banner alert alert-success d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2" role="alert">
      <div>
        <div class="fw-semibold">${(s.name || "Sale").replaceAll("<", "&lt;")}</div>
        <div class="small">${scopeText} • <span class="fw-semibold">${Number(s.percent_off || 0)}% off</span></div>
      </div>
      ${opts?.ctaHref ? `<a class="btn btn-success btn-sm" href="${opts.ctaHref}">Shop the sale</a>` : ""}
    </div>
  `;
};

// Returns { sale, finalCents, discountCents }
window.salePriceFor = function (product) {
  const priceCents = Number(product?.price_cents || 0);
  if (!window.Sales?.applyToProductPrice)
    return { sale: null, finalCents: priceCents, discountCents: 0 };
  return window.Sales.applyToProductPrice(product, priceCents);
};
