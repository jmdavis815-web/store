// assets/js/admin.js
(async function () {
  const loginCard = document.getElementById("loginCard");
  const adminArea = document.getElementById("adminArea");
  const logoutBtn = document.getElementById("logoutBtn");

  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");

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

  const deleteCatBtn = document.getElementById("deleteCatBtn");

  // Categories UI
  const catListEl = document.getElementById("catList");
  const newCatBtn = document.getElementById("newCatBtn");
  const cidEl = document.getElementById("cid");
  const cnameEl = document.getElementById("cname");
  const cslugEl = document.getElementById("cslug");
  const saveCatBtn = document.getElementById("saveCatBtn");
  const catMsgEl = document.getElementById("catMsg");

  let categories = [];
  let products = [];

  deleteCatBtn?.addEventListener("click", async () => {
    try {
      const id = cidEl.value;
      if (!id) {
        setCatMsg("Select a category first.");
        return;
      }

      // SAFETY: block delete if products reference this category
      const inUse = (products || []).filter((p) => p.category_id === id);
      if (inUse.length > 0) {
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

  function setCatMsg(t) {
    if (catMsgEl) catMsgEl.textContent = t || "";
  }

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function setMsg(t) {
    msgEl.textContent = t || "";
  }

  function priceToCents(v) {
    const n = Number(v || 0);
    return Math.round(n * 100);
  }
  function centsToPrice(cents) {
    return (Number(cents || 0) / 100).toFixed(2);
  }

  function fillCategoryOptions() {
    categoryEl.innerHTML =
      `<option value="">(none)</option>` +
      categories
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join("");
  }

  function renderList() {
    listEl.innerHTML = products
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

  function clearForm() {
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

  function loadToForm(p) {
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

  async function refresh() {
    categories = await StoreApi.getCategories();
    fillCategoryOptions();
    renderCatList(); // <-- add this
    products = await StoreApi.adminListProducts();
    renderList();
  }

  async function ensureAuthed() {
    const session = await StoreApi.getSession();
    if (session) {
      loginCard.classList.add("d-none");
      adminArea.classList.remove("d-none");
      logoutBtn.classList.remove("d-none");
      await refresh();
      clearForm();
    } else {
      loginCard.classList.remove("d-none");
      adminArea.classList.add("d-none");
      logoutBtn.classList.add("d-none");
    }
  }

  // Auto-suggest slug from name (only if slug is blank)
  cnameEl?.addEventListener("input", () => {
    if (!cslugEl.value.trim()) cslugEl.value = slugify(cnameEl.value);
  });

  newCatBtn?.addEventListener("click", () => {
    clearCatForm();
  });

  catListEl?.addEventListener("click", (e) => {
    const id = e.target.closest("[data-cedit]")?.dataset?.cedit;
    if (!id) return;
    const c = categories.find((x) => x.id === id);
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

      await refresh(); // reload categories + products list
      loadCatToForm(category); // keep the form on what you just saved
      setCatMsg("Saved.");
    } catch (e) {
      console.error(e);
      setCatMsg(e.message || "Save failed");
    }
  });

  loginBtn.addEventListener("click", async () => {
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

  logoutBtn.addEventListener("click", async () => {
    await StoreApi.signOut();
    await ensureAuthed();
  });

  newBtn.addEventListener("click", () => {
    clearForm();
  });

  listEl.addEventListener("click", (e) => {
    const id = e.target.closest("[data-edit]")?.dataset?.edit;
    if (!id) return;
    const p = products.find((x) => x.id === id);
    if (p) loadToForm(p);
  });

  saveBtn.addEventListener("click", async () => {
    try {
      setMsg("Saving…");

      const id = pidEl.value || undefined;

      // Optional upload first (if file chosen)
      let image_url = products.find((x) => x.id === id)?.image_url || null;
      const file = imageFileEl.files?.[0];
      const tempId = id || crypto.randomUUID();

      if (file) {
        image_url = await StoreApi.uploadProductImage(file, tempId);
      }

      const product = {
        id: id || tempId,
        name: nameEl.value.trim(),
        slug: slugEl.value.trim(),
        category_id: categoryEl.value || null,
        description: descEl.value.trim(),
        price_cents: priceToCents(priceEl.value),
        currency: "USD",
        image_url,
        active: activeEl.value === "true",
      };

      if (!product.name || !product.slug) {
        setMsg("Name and slug are required.");
        return;
      }

      await StoreApi.adminUpsertProduct(product);
      await refresh();
      loadToForm(product);
      setMsg("Saved.");
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Save failed");
    }
  });

  deleteBtn.addEventListener("click", async () => {
    try {
      const id = pidEl.value;
      if (!id) {
        setMsg("Select a product first.");
        return;
      }
      setMsg("Deleting…");
      await StoreApi.adminDeleteProduct(id);
      await refresh();
      clearForm();
      setMsg("Deleted.");
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Delete failed");
    }
  });

  await ensureAuthed();
})();
