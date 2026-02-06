// assets/js/search.js
(async function () {
  renderNavbar();

  // Load sales so search results can show discounted pricing
  await window.Sales?.ensureLoaded?.();

  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || "").trim();

  const metaEl = document.getElementById("searchMeta");
  const resultsEl = document.getElementById("results");

  if (!q) {
    metaEl.textContent = "Type a search term in the box above.";
    resultsEl.innerHTML = "";
    return;
  }

  metaEl.textContent = `Results for “${q}”`;

  const results = await StoreApi.searchProducts(q, 60);

  if (!results.length) {
    resultsEl.innerHTML = `<div class="text-muted">No products found.</div>`;
    return;
  }

  resultsEl.innerHTML = results
    .map((p) => {
      const sp = window.salePriceFor ? window.salePriceFor(p) : null;
      const finalCents = sp ? sp.finalCents : p.price_cents;
      const pct = Number(sp?.sale?.percent_off || 0);

      const priceHtml =
        pct > 0
          ? `
            <div class="small">
              <span class="badge text-bg-success me-2">${pct}% OFF</span>
              <span class="text-muted text-decoration-line-through me-1">${fmtMoney(p.price_cents, p.currency || "USD")}</span>
              <span class="fw-semibold">${fmtMoney(finalCents, p.currency || "USD")}</span>
            </div>
          `
          : `<div class="text-muted small">${fmtMoney(p.price_cents, p.currency || "USD")}</div>`;

      return `
        <div class="col-12 col-md-3">
          <a class="text-decoration-none" href="product.html?slug=${encodeURIComponent(p.slug)}">
            <div class="card h-100 product-card">
              <img
                src="${p.image_url || "https://placehold.co/600x600?text=Product"}"
                class="card-img-top"
                alt="${(p.name || "").replaceAll('"', "&quot;")}"
                loading="lazy"
              />
              <div class="card-body">
                <div class="fw-semibold">${(p.name || "").replaceAll("<", "&lt;")}</div>
                ${priceHtml}
              </div>
            </div>
          </a>
        </div>
      `;
    })
    .join("");
})();
