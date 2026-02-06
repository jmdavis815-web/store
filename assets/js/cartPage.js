// assets/js/cartPage.js
(function () {
  renderNavbar();

  const itemsEl = document.getElementById("items");
  const subtotalEl = document.getElementById("subtotal");
  const discountRowEl = document.getElementById("discountRow");
  const discountEl = document.getElementById("discount");
  const totalEl = document.getElementById("total");
  const statusEl = document.getElementById("status");
  const clearBtn = document.getElementById("clearBtn");

  async function render() {
    await window.Sales?.ensureLoaded?.();
    const cart = Cart.get();
    const { subtotalCents, discountCents, totalCents } = Cart.totals();

    subtotalEl.textContent = fmtMoney(subtotalCents, APP_CONFIG.CURRENCY);

    if (discountCents > 0) {
      discountRowEl?.classList.remove("d-none");
      if (discountEl)
        discountEl.textContent = `-${fmtMoney(discountCents, APP_CONFIG.CURRENCY)}`;
    } else {
      discountRowEl?.classList.add("d-none");
    }

    if (totalEl)
      totalEl.textContent = fmtMoney(totalCents, APP_CONFIG.CURRENCY);

    if (!cart.length) {
      itemsEl.innerHTML = `<div class="alert alert-secondary">Your cart is empty.</div>`;
      return;
    }

    itemsEl.innerHTML = cart
      .map(
        (x) => `
      <div class="card">
        <div class="card-body d-flex gap-3 align-items-center">
          <img src="${x.image_url || "https://placehold.co/120x90"}" style="width:120px;height:90px;object-fit:cover;border-radius:.5rem" alt="">
          <div class="flex-grow-1">
            <div class="fw-semibold">${x.name}</div>
            ${(() => {
              const sale = window.Sales?.bestForCategoryId?.(
                x.category_id || x.categoryId || null,
              );
              const pct = Number(sale?.percent_off || 0);
              if (!pct) {
                return `<div class="text-muted small">${fmtMoney(x.price_cents, x.currency)} each</div>`;
              }
              const dc = Math.round((x.price_cents * pct) / 100);
              const finalCents = Math.max(0, x.price_cents - dc);
              return `
                <div class="small">
                  <span class="badge text-bg-success me-2">${pct}% OFF</span>
                  <span class="text-muted text-decoration-line-through me-1">${fmtMoney(x.price_cents, x.currency)}</span>
                  <span class="fw-semibold">${fmtMoney(finalCents, x.currency)}</span>
                  <span class="text-muted"> each</span>
                </div>
              `;
            })()}
          </div>
          <div class="d-flex align-items-center gap-2">
            <input class="form-control form-control-sm" style="width:80px" type="number" min="1" value="${x.qty}" data-qty="${x.id}">
            <button class="btn btn-outline-danger btn-sm" data-rm="${x.id}">Remove</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  itemsEl.addEventListener("change", (e) => {
    const id = e.target?.dataset?.qty;
    if (!id) return;
    const qty = Number(e.target.value || 1);
    Cart.updateQty(id, qty);
    renderNavbar();
    render();
    rerenderPayPal();
  });

  itemsEl.addEventListener("click", (e) => {
    const id = e.target?.dataset?.rm;
    if (!id) return;
    Cart.remove(id);
    renderNavbar();
    render();
    rerenderPayPal();
  });

  clearBtn.addEventListener("click", () => {
    Cart.clear();
    renderNavbar();
    render();
    rerenderPayPal();
  });

  function cartTotalForPayPal() {
    const { totalCents } = Cart.totals();
    return (totalCents / 100).toFixed(2);
  }

  function rerenderPayPal() {
    const wrap = document.getElementById("paypalButtons");
    wrap.innerHTML = "";
    statusEl.textContent = "";

    const cart = Cart.get();
    if (!cart.length || !window.paypal) return;

    paypal
      .Buttons({
        createOrder: function (data, actions) {
          const total = cartTotalForPayPal();
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: APP_CONFIG.CURRENCY,
                  value: total,
                },
              },
            ],
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            statusEl.textContent = `Payment captured for ${details.payer.name.given_name}. Order: ${details.id}`;
            Cart.clear();
            renderNavbar();
            render();
          });
        },
        onError: function (err) {
          console.error(err);
          statusEl.textContent = "PayPal error. Please try again.";
        },
      })
      .render("#paypalButtons");
  }

  render();

  const timer = setInterval(() => {
    if (window.paypal) {
      clearInterval(timer);
      rerenderPayPal();
    }
  }, 200);
})();
