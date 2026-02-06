// assets/js/product.js
(async function () {
  renderNavbar();

  // Load sales (needed for price display + cart totals)
  await window.Sales?.ensureLoaded?.();

  const slug = qs("slug");
  const wrap = document.getElementById("wrap");

  const p = await StoreApi.getProductBySlug(slug);
  if (!p) {
    wrap.innerHTML = `<div class="col-12"><h3>Product not found</h3></div>`;
    return;
  }

  // Sale pricing (display only)
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
      : `<div class="text-muted">${fmtMoney(p.price_cents, p.currency)}</div>`;

  // Back link (best effort)
  const backSlug =
    p?.categories?.slug || p?.category?.slug || p?.category_slug || "";

  const backHref = backSlug
    ? `category.html?slug=${encodeURIComponent(backSlug)}`
    : `index.html`;

  wrap.innerHTML = `
    <div class="col-12 col-md-6">
      <img class="w-100 rounded" style="height:420px;object-fit:cover" src="${
        p.image_url || "https://placehold.co/900x700"
      }" alt="">
    </div>
    <div class="col-12 col-md-6">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h2 class="mb-1">${(p.name || "").replaceAll("<", "&lt;")}</h2>
          ${priceHtml}
        </div>
        <a class="btn btn-outline-secondary btn-sm" href="${backHref}">Back</a>
      </div>

      <hr/>
      <p class="text-muted">${(p.description || "").replaceAll("<", "&lt;")}</p>

      <div class="d-flex gap-2">
        <button id="addBtn" class="btn btn-primary">Add to cart</button>
        <a class="btn btn-outline-primary" href="cart.html">Go to cart</a>
      </div>
    </div>
  `;

  document.getElementById("addBtn").addEventListener("click", () => {
    Cart.add(
      {
        id: p.id,
        name: p.name,
        price_cents: p.price_cents, // keep base price; cart totals compute discount
        currency: p.currency,
        image_url: p.image_url,
        category_id: p.category_id || null, // IMPORTANT for category-based sales
      },
      1,
    );
    renderNavbar();
  });
})();
