// ===== CART CORE =====
const STORAGE_KEY = "storeCart";

// Global cart object
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  cart = {};
}

// Optional inventory limits (per product ID)
const INVENTORY = {
  chakraWater: 5,
  protectionCandle: 10, // example for another product
  // add more: productId: maxQty
};

// Save cart to localStorage
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// Convenience getter
function loadCart() {
  return cart;
}

// Toast popup for add-to-cart etc.
function showCartToast(message) {
  const toastEl = document.getElementById("cartToast");
  if (!toastEl || typeof bootstrap === "undefined") return;

  const bodyEl = toastEl.querySelector(".toast-body");
  if (bodyEl) bodyEl.textContent = message;

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}

// Update navbar badge + top total + per-product quantities
function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const priceTotal = document.getElementById("priceTotal");

  let totalQty = 0;
  let totalPrice = 0;

  Object.entries(cart).forEach(([id, item]) => {
    totalQty += item.qty;
    totalPrice += item.qty * item.price;

    // Update any quantity buttons on the page
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) {
      qtyEl.textContent = item.qty;
    }
  });

  // Badge
  if (cartBadge) {
    cartBadge.textContent = totalQty > 0 ? totalQty : "";
  }

  // Price in navbar
  if (priceTotal) {
    priceTotal.textContent = totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "";
  }
}

// Adjust cart by delta (±1, etc.)
function adjustCart(productId, delta, name, price) {
  if (!cart[productId]) {
    cart[productId] = {
      name: name || "Item",
      price: parseFloat(price) || 0,
      qty: 0
    };
  }

  const limit = INVENTORY[productId];

  // Enforce inventory
  if (delta > 0 && limit !== undefined && cart[productId].qty >= limit) {
    showCartToast(`Only ${limit} of ${cart[productId].name} in stock.`);
    return;
  }

  cart[productId].qty += delta;

  if (cart[productId].qty < 0) {
    cart[productId].qty = 0;
  }

  saveCart();
  updateCartUI();
}

// ===== PAGE INITIALIZATION (product pages, index.html, etc.) =====
document.addEventListener("DOMContentLoaded", () => {
  // Fade-in effect
  document.body.classList.add("page-loaded");

  // Wire up all product controls on this page
  const productGroups = document.querySelectorAll(".btn-group[data-product-id]");

  productGroups.forEach(group => {
    const id = group.dataset.productId;
    const name = group.dataset.productName || "Item";
    const price = parseFloat(group.dataset.productPrice) || 0;

    // Ensure entry exists
    if (!cart[id]) {
      cart[id] = { name, price, qty: 0 };
    }

    const plusBtn = group.querySelector(".btn-cart-plus");
    const minusBtn = group.querySelector(".btn-cart-minus");
    const qtyBtn = document.getElementById(`qty-${id}`);

    if (qtyBtn) {
      qtyBtn.textContent = cart[id].qty;
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        adjustCart(id, +1, name, price);
        const item = cart[id];
        showCartToast(`${item.name} added to cart.`);
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        adjustCart(id, -1);
      });
    }
  });

  // Initial UI sync
  updateCartUI();
});
