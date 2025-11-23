// ===== Simple Cart Logic =====
const STORAGE_KEY = "storeCart";

// Load cart from localStorage or start fresh
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  cart = {};
}

// Save cart
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// Update navbar badge + price total + per-product qty
function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const priceTotal = document.getElementById("priceTotal");

  let totalQty = 0;
  let totalPrice = 0;

  Object.values(cart).forEach(item => {
    totalQty += item.qty;
    totalPrice += item.qty * item.price;
  });

  // Badge
  if (cartBadge) {
    cartBadge.textContent = totalQty > 0 ? totalQty : "";
  }

  // Price in navbar
  if (priceTotal) {
    priceTotal.textContent = totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "";
  }

  // Per-product quantity buttons
  Object.keys(cart).forEach(productId => {
    const qtyBtn = document.getElementById(`qty-${productId}`);
    if (qtyBtn) {
      qtyBtn.textContent = cart[productId].qty;
    }
  });
}

// Initialize once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const productGroups = document.querySelectorAll(
    ".btn-group[data-product-id]"
  );

  productGroups.forEach(group => {
    const productId = group.dataset.productId;
    const name = group.dataset.productName || "Item";
    const price = parseFloat(group.dataset.productPrice) || 0;

    // Ensure cart entry exists
    if (!cart[productId]) {
      cart[productId] = { name, price, qty: 0 };
    }

    const plusBtn = group.querySelector(".btn-cart-plus");
    const minusBtn = group.querySelector(".btn-cart-minus");
    const qtyBtn = document.getElementById(`qty-${productId}`);

    // Safety check
    if (!plusBtn || !minusBtn || !qtyBtn) return;

    // Set initial qty text
    qtyBtn.textContent = cart[productId].qty;

    plusBtn.addEventListener("click", () => {
      cart[productId].qty += 1;
      qtyBtn.textContent = cart[productId].qty;
      saveCart();
      updateCartUI();
    });

    minusBtn.addEventListener("click", () => {
      if (cart[productId].qty > 0) {
        cart[productId].qty -= 1;
        qtyBtn.textContent = cart[productId].qty;
        saveCart();
        updateCartUI();
      }
    });
  });

  // Initial paint
  updateCartUI();
});
