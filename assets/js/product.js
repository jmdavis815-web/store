// assets/js/product.js
(async function () {
  renderNavbar();
  const slug = qs("slug");
  const wrap = document.getElementById("wrap");

  const p = await StoreApi.getProductBySlug(slug);
  if (!p) {
    wrap.innerHTML = `<div class="col-12"><h3>Product not found</h3></div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="col-12 col-md-6">
      <img class="w-100 rounded" style="height:420px;object-fit:cover" src="${p.image_url || "https://placehold.co/900x700"}" alt="">
    </div>
    <div class="col-12 col-md-6">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h2 class="mb-1">${p.name}</h2>
          <div class="text-muted">${fmtMoney(p.price_cents, p.currency)}</div>
        </div>
        <a class="btn btn-outline-secondary btn-sm" href="category.html?slug=${encodeURIComponent(p.categories?.slug || "")}">Back</a>
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
        price_cents: p.price_cents,
        currency: p.currency,
        image_url: p.image_url,
      },
      1,
    );
    renderNavbar();
  });
})();
