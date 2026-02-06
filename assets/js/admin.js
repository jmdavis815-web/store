// assets/js/admin.js
(async function () {
  const loginCard = document.getElementById("loginCard");
  const adminArea = document.getElementById("adminArea");
  const logoutBtn = document.getElementById("logoutBtn");

  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");

  // Products UI
  const listEl = document.getElementById("list");
  const newBtn = document.getElementById("newBtn");

  const pidEl = document.getElementById("pid");
  const nameEl = document.getElementById("name");
  const slugEl = document.getElementById("slug");
  const categoryEl = document.getElementById("category");
  const priceEl = document.getElementById("price");
  const descEl = document.getElementById("description");
  const activeEl = document.getElementById("active");
  const imageFileEl = document.getElementById("imageFile");

  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const msgEl = document.getElementById("msg");

  // Categories UI
  const catListEl = document.getElementById("catList");
  const newCatBtn = document.getElementById("newCatBtn");
  const cidEl = document.getElementById("cid");
  const cnameEl = document.getElementById("cname");
  const cslugEl = document.getElementById("cslug");
  const saveCatBtn = document.getElementById("saveCatBtn");
  const deleteCatBtn = document.getElementById("deleteCatBtn");
  const catMsgEl = document.getElementById("catMsg");

  // Sales UI
  const saleListEl = document.getElementById("saleList");
  const newSaleBtn = document.getElementById("newSaleBtn");
  const sidEl = document.getElementById("sid");
  const snameEl = document.getElementById("sname");
  const spercentEl = document.getElementById("spercent");
  const sscopeEl = document.getElementById("sscope");
  const saleCategoriesEl = document.getElementById("saleCategories");
  const sactiveEl = document.getElementById("sactive");
  const saveSaleBtn = document.getElementById("saveSaleBtn");
  const endSaleBtn = document.getElementById("endSaleBtn");
  const saleMsgEl = document.getElementById("saleMsg");

  let categories = [];
  let products = [];
  let sales = [];

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function setMsg(t) {
    if (msgEl) msgEl.textContent = t || "";
  }
  function setCatMsg(t) {
    if (catMsgEl) catMsgEl.textContent = t || "";
  }
  function setSaleMsg(t) {
    if (saleMsgEl) saleMsgEl.textContent = t || "";
  }

  function priceToCents(v) {
    const n = Number(v || 0);
    return Math.round(n * 100);
  }
  function centsToPrice(cents) {
    return (Number(cents || 0) / 100).toFixed(2);
  }

  function fillCategoryOptions() {
    if (!categoryEl) return;
    categoryEl.innerHTML =
      `<option value="">(none)</option>` +
      (categories || [])
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join("");
  }

  function renderProductList() {
    if (!listEl) return;
    listEl.innerHTML = (products || [])
      .map(
        (p) => `
      <button class="btn btn-outline-secondary text-start" data-edit="${p.id}">
        <div class="d-flex justify-content-between">
          <div>
            <div class="fw-semibold">${p.name}</div>
            <div class="small text-muted">${p.slug} • ${p.active ? "active" : "inactive"}</div>
          </div>
          <div class="fw-semibold">$${(p.price_cents / 100).toFixed(2)}</div>
        </div>
      </button>
    `,
      )
      .join("");
  }

  function renderCatList() {
    if (!catListEl) return;
    catListEl.innerHTML = (categories || [])
      .map(
        (c) => `
        <button class="btn btn-outline-secondary text-start" data-cedit="${c.id}">
          <div class="d-flex justify-content-between">
            <div>
              <div class="fw-semibold">${c.name}</div>
              <div class="small text-muted">${c.slug}</div>
            </div>
          </div>
        </button>
      `,
      )
      .join("");
  }

  function renderSaleCategoryChecks(selectedIds = []) {
    if (!saleCategoriesEl) return;
    const sel = new Set(selectedIds || []);
    saleCategoriesEl.innerHTML = (categories || [])
      .map(
        (c) => `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${c.id}" id="sc_${c.id}" ${sel.has(c.id) ? "checked" : ""}>
          <label class="form-check-label" for="sc_${c.id}">${c.name}</label>
        </div>
      `,
      )
      .join("");

    const enabled = (sscopeEl?.value || "store") === "categories";
    saleCategoriesEl.classList.toggle("opacity-50", !enabled);
    saleCategoriesEl
      .querySelectorAll("input")
      .forEach((el) => (el.disabled = !enabled));
  }

  function selectedSaleCategoryIds() {
    if (!saleCategoriesEl) return [];
    return Array.from(
      saleCategoriesEl.querySelectorAll("input[type=checkbox]:checked"),
    ).map((x) => x.value);
  }

  function renderSaleList() {
    if (!saleListEl) return;
    saleListEl.innerHTML = (sales || [])
      .map((s) => {
        const pct = Number(s.percent_off || 0);
        const scope = s.scope === "store" ? "Store-wide" : "Categories";
        const active = s.active ? "active" : "inactive";
        return `
          <button class="btn btn-outline-secondary text-start" data-sedit="${s.id}">
            <div class="d-flex justify-content-between">
              <div>
                <div class="fw-semibold">${(s.name || "(unnamed sale)").replaceAll("<", "&lt;")}</div>
                <div class="small text-muted">${scope} • ${pct}% off • ${active}</div>
              </div>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function clearProductForm() {
    if (!pidEl) return;
    pidEl.value = "";
    nameEl.value = "";
    slugEl.value = "";
    categoryEl.value = "";
    priceEl.value = "0.00";
    descEl.value = "";
    activeEl.value = "true";
    imageFileEl.value = "";
    setMsg("");
  }

  function loadProductToForm(p) {
    pidEl.value = p.id || "";
    nameEl.value = p.name || "";
    slugEl.value = p.slug || "";
    categoryEl.value = p.category_id || "";
    priceEl.value = centsToPrice(p.price_cents);
    descEl.value = p.description || "";
    activeEl.value = String(!!p.active);
    imageFileEl.value = "";
    setMsg("");
  }

  function clearCatForm() {
    if (!cidEl) return;
    cidEl.value = "";
    cnameEl.value = "";
    cslugEl.value = "";
    setCatMsg("");
  }

  function loadCatToForm(c) {
    cidEl.value = c.id || "";
    cnameEl.value = c.name || "";
    cslugEl.value = c.slug || "";
    setCatMsg("");
  }

  function clearSaleForm() {
    if (!sidEl) return;
    sidEl.value = "";
    snameEl.value = "";
    spercentEl.value = "";
    sscopeEl.value = "store";
    sactiveEl.value = "true";
    renderSaleCategoryChecks([]);
    setSaleMsg("");
  }

  function loadSaleToForm(s) {
    sidEl.value = s.id || "";
    snameEl.value = s.name || "";
    spercentEl.value = String(s.percent_off || "");
    sscopeEl.value = s.scope || "store";
    sactiveEl.value = String(!!s.active);
    renderSaleCategoryChecks(s.category_ids || []);
    setSaleMsg("");
  }

  async function refresh() {
    categories = await StoreApi.getCategories();
    fillCategoryOptions();
    renderCatList();
    renderSaleCategoryChecks(selectedSaleCategoryIds());

    sales = await StoreApi.adminListSales();
    renderSaleList();

    products = await StoreApi.adminListProducts();
    renderProductList();
  }

  async function ensureAuthed() {
    const session = await StoreApi.getSession();
    if (session) {
      loginCard.classList.add("d-none");
      adminArea.classList.remove("d-none");
      logoutBtn.classList.remove("d-none");
      await refresh();
      clearProductForm();
      clearCatForm();
      clearSaleForm();
    } else {
      loginCard.classList.remove("d-none");
      adminArea.classList.add("d-none");
      logoutBtn.classList.add("d-none");
    }
  }

  // Auth
  loginBtn?.addEventListener("click", async () => {
    try {
      loginMsg.textContent = "Signing in…";
      await StoreApi.signIn(
        document.getElementById("email").value,
        document.getElementById("password").value,
      );
      loginMsg.textContent = "";
      await ensureAuthed();
    } catch (e) {
      console.error(e);
      loginMsg.textContent = e.message || "Login failed";
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await StoreApi.signOut();
    await ensureAuthed();
  });

  // Categories
  cnameEl?.addEventListener("input", () => {
    if (!cslugEl.value.trim()) cslugEl.value = slugify(cnameEl.value);
  });

  newCatBtn?.addEventListener("click", clearCatForm);

  catListEl?.addEventListener("click", (e) => {
    const id = e.target.closest("[data-cedit]")?.dataset?.cedit;
    if (!id) return;
    const c = (categories || []).find((x) => x.id === id);
    if (c) loadCatToForm(c);
  });

  saveCatBtn?.addEventListener("click", async () => {
    try {
      setCatMsg("Saving…");
      const id = cidEl.value || crypto.randomUUID();
      const category = {
        id,
        name: cnameEl.value.trim(),
        slug: cslugEl.value.trim() || slugify(cnameEl.value),
      };
      if (!category.name || !category.slug) {
        setCatMsg("Name and slug are required.");
        return;
      }
      await StoreApi.adminUpsertCategory(category);
      await refresh();
      loadCatToForm(category);
      setCatMsg("Saved.");
    } catch (e) {
      console.error(e);
      setCatMsg(e.message || "Save failed");
    }
  });

  deleteCatBtn?.addEventListener("click", async () => {
    try {
      const id = cidEl.value;
      if (!id) {
        setCatMsg("Select a category first.");
        return;
      }
      const inUse = (products || []).filter((p) => p.category_id === id);
      if (inUse.length) {
        setCatMsg(
          `Cannot delete. ${inUse.length} product(s) still use this category.`,
        );
        return;
      }
      const name = cnameEl.value || "this category";
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

      setCatMsg("Deleting…");
      await StoreApi.adminDeleteCategory(id);
      await refresh();
      clearCatForm();
      setCatMsg("Deleted.");
    } catch (e) {
      console.error(e);
      setCatMsg(e.message || "Delete failed");
    }
  });

  // Sales
  newSaleBtn?.addEventListener("click", clearSaleForm);

  saleListEl?.addEventListener("click", (e) => {
    const id = e.target.closest("[data-sedit]")?.dataset?.sedit;
    if (!id) return;
    const s = (sales || []).find((x) => x.id === id);
    if (s) loadSaleToForm(s);
  });

  sscopeEl?.addEventListener("change", () => {
    renderSaleCategoryChecks(selectedSaleCategoryIds());
  });

  saveSaleBtn?.addEventListener("click", async () => {
    try {
      setSaleMsg("Saving…");
      const id = sidEl.value || crypto.randomUUID();
      const name = (snameEl.value || "").trim();
      const percent_off = Math.max(
        1,
        Math.min(90, Number(spercentEl.value || 0)),
      );
      const scope = sscopeEl.value || "store";
      const active = sactiveEl.value === "true";

      if (!name) return setSaleMsg("Sale name is required.");
      if (!percent_off) return setSaleMsg("Percent off is required.");

      const category_ids =
        scope === "categories" ? selectedSaleCategoryIds() : [];
      if (scope === "categories" && !category_ids.length)
        return setSaleMsg(
          "Pick at least one category (or set scope to Store-wide).",
        );

      const sale = {
        id,
        name,
        percent_off,
        scope,
        category_ids,
        active,
        starts_at: active ? new Date().toISOString() : null,
      };

      await StoreApi.adminUpsertSale(sale);
      await refresh();
      const saved = (sales || []).find((x) => x.id === id) || sale;
      loadSaleToForm(saved);
      setSaleMsg("Saved.");
    } catch (e) {
      console.error(e);
      setSaleMsg(e.message || "Save failed");
    }
  });

  endSaleBtn?.addEventListener("click", async () => {
    try {
      const id = sidEl.value;
      if (!id) return setSaleMsg("Select a sale first.");
      const s = (sales || []).find((x) => x.id === id);
      if (!confirm(`End "${s?.name || "this sale"}" now?`)) return;

      setSaleMsg("Ending…");
      await StoreApi.adminEndSale(id);
      await refresh();
      const ended = (sales || []).find((x) => x.id === id);
      if (ended) loadSaleToForm(ended);
      setSaleMsg("Ended.");
    } catch (e) {
      console.error(e);
      setSaleMsg(e.message || "End failed");
    }
  });

  // Products
  newBtn?.addEventListener("click", clearProductForm);

  listEl?.addEventListener("click", (e) => {
    const id = e.target.closest("[data-edit]")?.dataset?.edit;
    if (!id) return;
    const p = (products || []).find((x) => x.id === id);
    if (p) loadProductToForm(p);
  });

  saveBtn?.addEventListener("click", async () => {
    try {
      setMsg("Saving…");

      const existingId = pidEl.value || null;
      let image_url =
        (products || []).find((x) => x.id === existingId)?.image_url || null;

      const file = imageFileEl.files?.[0];
      const id = existingId || crypto.randomUUID();

      if (file) image_url = await StoreApi.uploadProductImage(file, id);

      const product = {
        id,
        name: nameEl.value.trim(),
        slug: slugEl.value.trim(),
        category_id: categoryEl.value || null,
        description: descEl.value.trim(),
        price_cents: priceToCents(priceEl.value),
        currency: "USD",
        image_url,
        active: activeEl.value === "true",
      };

      if (!product.name || !product.slug)
        return setMsg("Name and slug are required.");

      await StoreApi.adminUpsertProduct(product);
      await refresh();
      loadProductToForm(product);
      setMsg("Saved.");
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Save failed");
    }
  });

  deleteBtn?.addEventListener("click", async () => {
    try {
      const id = pidEl.value;
      if (!id) return setMsg("Select a product first.");
      if (!confirm("Delete this product?")) return;

      setMsg("Deleting…");
      await StoreApi.adminDeleteProduct(id);
      await refresh();
      clearProductForm();
      setMsg("Deleted.");
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Delete failed");
    }
  });

  await ensureAuthed();
})();
