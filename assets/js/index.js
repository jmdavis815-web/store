// assets/js/index.js
(async function () {
  renderNavbar();

  const categoriesEl = document.getElementById("categories");
  const featuredEl = document.getElementById("featured");

  const categories = await StoreApi.getCategories();
  categoriesEl.innerHTML = categories
    .map(
      (c) => `
    <div class="col-6 col-md-3">
      <a class="text-decoration-none" href="category.html?slug=${encodeURIComponent(c.slug)}">
        <div class="card h-100">
          <div class="card-body">
            <div class="fw-semibold">${c.name}</div>
            <div class="text-muted small">Shop now</div>
          </div>
        </div>
      </a>
    </div>
  `,
    )
    .join("");

  const featured = await StoreApi.getFeaturedProducts(8);
  featuredEl.innerHTML = featured
    .map(
      (p) => `
    <div class="col-12 col-md-3">
      <div class="card h-100 product-card">
        <img src="${p.image_url || "https://placehold.co/600x400"}" alt="">
        <div class="card-body">
          <div class="fw-semibold">${p.name}</div>
          <div class="text-muted small">${fmtMoney(p.price_cents, p.currency)}</div>
        </div>
        <div class="card-footer bg-white border-0 d-flex gap-2">
          <a class="btn btn-outline-secondary btn-sm w-50" href="product.html?slug=${encodeURIComponent(p.slug)}">View</a>
          <button class="btn btn-primary btn-sm w-50" data-add="${p.id}">Add</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  featuredEl.addEventListener("click", async (e) => {
    const id = e.target?.dataset?.add;
    if (!id) return;
    const p = featured.find((x) => x.id === id);
    Cart.add(
      {
        id: p.id,
        name: p.name,
        price_cents: p.price_cents,
        currency: p.currency,
        image_url: p.image_url,
      },
      1,
    );
    renderNavbar();
  });
})();
