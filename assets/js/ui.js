// assets/js/ui.js
window.fmtMoney = function (cents, currency = "USD") {
  const v = (cents / 100).toFixed(2);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(v));
};

window.qs = (k) => new URLSearchParams(location.search).get(k);

window.renderNavbar = function () {
  const count = (window.Cart.get() || []).reduce((s, x) => s + x.qty, 0);
  const el = document.getElementById("cartBadge");
  if (el) el.textContent = String(count);
};
