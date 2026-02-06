// assets/js/category.js
(async function () {
  renderNavbar();

  // Load sales (needed for banner + price display + cart totals later)
  await window.Sales?.ensureLoaded?.();
  const allSales = window.Sales?.getCached ? window.Sales.getCached() : [];

  const slug = qs("slug");
  const titleEl = document.getElementById("title");
  const grid = document.getElementById("grid");
  const saleAdEl = document.getElementById("saleAd");

  const cat = await StoreApi.getCategoryBySlug(slug);
  if (!cat) {
    titleEl.textContent = "Category not found";
    if (saleAdEl) saleAdEl.innerHTML = "";
    return;
  }
  titleEl.textContent = cat.name;

  // Show banner only if a sale applies to this category (or store-wide)
  const bestSaleForThisCat = window.Sales?.bestForCategoryId
    ? window.Sales.bestForCategoryId(cat.id)
    : null;

  if (saleAdEl) {
    if (bestSaleForThisCat) {
      window.renderSaleBanner?.(saleAdEl, [bestSaleForThisCat], {
        ctaHref: `#grid`,
      });
    } else {
      saleAdEl.innerHTML = "";
    }
  }

  const products = await StoreApi.getProductsByCategory(cat.id);

  grid.innerHTML = products
    .map((p) => {
      const sp = window.salePriceFor ? window.salePriceFor(p) : null;
      const finalCents = sp ? sp.finalCents : p.price_cents;
      const pct = Number(sp?.sale?.percent_off || 0);

      const priceHtml =
        pct > 0
          ? `
            <div class="small">
              <span class="badge text-bg-success me-2">${pct}% OFF</span>
              <span class="text-muted text-decoration-line-through me-1">${fmtMoney(p.price_cents, p.currency)}</span>
              <span class="fw-semibold">${fmtMoney(finalCents, p.currency)}</span>
            </div>
          `
          : `<div class="text-muted small">${fmtMoney(p.price_cents, p.currency)}</div>`;

      return `
        <div class="col-12 col-md-3">
          <div class="card h-100 product-card">
            <img src="${p.image_url || "https://placehold.co/600x400"}" alt="">
            <div class="card-body">
              <div class="fw-semibold">${p.name}</div>
              ${priceHtml}
            </div>
            <div class="card-footer bg-white border-0 d-flex gap-2">
              <a class="btn btn-outline-secondary btn-sm w-50" href="product.html?slug=${encodeURIComponent(
                p.slug,
              )}">View</a>
              <button class="btn btn-primary btn-sm w-50" data-add="${p.id}">Add</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  grid.addEventListener("click", (e) => {
    const id = e.target?.dataset?.add;
    if (!id) return;

    const p = products.find((x) => x.id === id);
    if (!p) return;

    Cart.add(
      {
        id: p.id,
        name: p.name,
        price_cents: p.price_cents,
        currency: p.currency,
        image_url: p.image_url,
        category_id: p.category_id || cat.id || null, // IMPORTANT
      },
      1,
    );

    renderNavbar();
  });
})();
