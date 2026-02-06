// assets/js/storeApi.js
const sb = window.getSupabase();

window.StoreApi = {
  async getCategories() {
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  },

  async getFeaturedProducts(limit = 8) {
    const { data, error } = await sb
      .from("products")
      .select("id,name,slug,price_cents,currency,image_url,active,category_id")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getCategoryBySlug(slug) {
    const { data, error } = await sb
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getProductsByCategory(categoryId) {
    const { data, error } = await sb
      .from("products")
      .select("id,name,slug,price_cents,currency,image_url,active")
      .eq("active", true)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getProductBySlug(slug) {
    const { data, error } = await sb
      .from("products")
      .select("*, categories(name, slug)")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Admin
  async signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async adminListProducts() {
    const { data, error } = await sb
      .from("products")
      .select(
        "id,name,slug,price_cents,currency,active,image_url,category_id,created_at,updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async adminUpsertProduct(product) {
    const { data, error } = await sb
      .from("products")
      .upsert(product)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async adminDeleteProduct(id) {
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async adminUpsertCategory(category) {
    const { data, error } = await sb
      .from("categories")
      .upsert(category)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async uploadProductImage(file, productId) {
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await sb.storage
      .from("product-images")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (upErr) throw upErr;

    const { data } = sb.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  },
};
