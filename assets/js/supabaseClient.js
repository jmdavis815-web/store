// assets/js/supabaseClient.js
window.getSupabase = function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};
