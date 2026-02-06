(async function () {
  renderNavbar();

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
    .map(
      (p) => `
      <div class="col-12 col-md-3">
        <a class="text-decoration-none" href="product.html?slug=${encodeURIComponent(p.slug)}">
          <div class="card h-100 product-card">
            <img
              src="${p.image_url || "https://placehold.co/600x600?text=Product"}"
              class="card-img-top"
              alt="${p.name}"
              loading="lazy"
            />
            <div class="card-body">
              <div class="fw-semibold">${p.name}</div>
              <div class="text-muted small">$${(p.price_cents / 100).toFixed(2)}</div>
            </div>
          </div>
        </a>
      </div>
    `,
    )
    .join("");
})();
