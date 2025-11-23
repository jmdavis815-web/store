// ===== PRODUCT CATALOG (single source of truth) =====
const PRODUCT_DATA = {
  chakraWater: {
    id: "chakraWater",
    name: "Chakra Water",
    price: 24.99,
    description: "Reiki infused water",
    image: "bottle-3.jpg",
    url: "chakra-water.html",
    stock: 5
  },
  protectionCandle: {
    id: "protectionCandle",
    name: "Protection Candle",
    price: 14.99,
    description: "Hand-poured protection spell candle",
    image: "candle.jpg",
    url: "#",
    stock: 10
  }
  // Add more products here as you build your store...
};

// ===== CART CORE =====
const STORAGE_KEY = "storeCart";

// Global cart object
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  cart = {};
}

// ===== INVENTORY (persistent, derived from PRODUCT_DATA on first run) =====
const INVENTORY_KEY = "storeInventory";
let INVENTORY = {};

// Try to load saved inventory from localStorage
try {
  const savedInv = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  if (savedInv && typeof savedInv === "object") {
    INVENTORY = savedInv;
  } else {
    INVENTORY = {};
  }
} catch (e) {
  INVENTORY = {};
}

// If no saved inventory, build it from PRODUCT_DATA (first run / reset)
if (Object.keys(INVENTORY).length === 0) {
  for (const [id, product] of Object.entries(PRODUCT_DATA)) {
    if (product.stock !== undefined) {
      INVENTORY[id] = product.stock;
    }
  }
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(INVENTORY));
}

// Helper to save inventory
function saveInventory() {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(INVENTORY));
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

// Save cart to localStorage
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// Convenience getter
function loadCart() {
  return cart;
}

// Update navbar badge + top total + per-product quantities
function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const priceTotal = document.getElementById("priceTotal");

  if (priceTotal) {
    priceTotal.style.color = "green";
  }

  let totalQty = 0;
  let totalPrice = 0;

  Object.entries(cart).forEach(([id, item]) => {
    totalQty += item.qty;
    totalPrice += item.qty * item.price;

    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) {
      qtyEl.textContent = item.qty;
    }
  });

  if (cartBadge) {
    cartBadge.textContent = totalQty > 0 ? totalQty : "";
  }

  if (priceTotal) {
    priceTotal.textContent = totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "";
  }
}

// Adjust cart by delta (±1, etc.)
function adjustCart(productId, delta, name, price) {
  if (!cart[productId]) {
    cart[productId] = {
      name: name || (PRODUCT_DATA[productId]?.name ?? "Item"),
      price: parseFloat(price ?? PRODUCT_DATA[productId]?.price ?? 0),
      qty: 0
    };
  }

  const limit = INVENTORY[productId];
  const currentQty = cart[productId].qty;
  const nextQty = currentQty + delta;

  // If we're trying to ADD and that would exceed stock, block it
  if (delta > 0 && limit !== undefined && nextQty > limit) {
    showCartToast(`Only ${limit} of ${cart[productId].name} in stock.`);
    return false; // nothing added
  }

  // Apply the change, but don't go below 0
  cart[productId].qty = Math.max(0, nextQty);

  saveCart();
  updateCartUI();

  return true; // successfully changed
}

// ===== PAGE INITIALIZATION (product pages, index.html, etc.) =====
document.addEventListener("DOMContentLoaded", () => {
  // Fade-in effect
  document.body.classList.add("page-loaded");

  // Wire up all product controls on this page
  const productGroups = document.querySelectorAll(".btn-group[data-product-id]");

  productGroups.forEach(group => {
    const id = group.dataset.productId;
    const product = PRODUCT_DATA[id] || {};

    const name =
      group.dataset.productName ||
      product.name ||
      "Item";

    const price = parseFloat(
      group.dataset.productPrice ||
      product.price ||
      0
    );

    // Ensure entry exists in cart
    if (!cart[id]) {
      cart[id] = { name, price, qty: 0 };
    }

    const plusBtn = group.querySelector(".btn-cart-plus");
    const minusBtn = group.querySelector(".btn-cart-minus");
    const qtyBtn = document.getElementById(`qty-${id}`);

    if (qtyBtn) {
      qtyBtn.textContent = cart[id].qty;
    }

    // Disable buttons if out of stock
    const currentStock = INVENTORY[id];
    if (currentStock !== undefined && currentStock <= 0) {
      if (plusBtn) plusBtn.disabled = true;
      if (minusBtn) minusBtn.disabled = true;
      if (qtyBtn) qtyBtn.textContent = "0";
      group.style.opacity = "0.5";
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        const changed = adjustCart(id, +1, name, price);

        if (changed) {
          const item = cart[id];
          showCartToast(`${item.name} added to cart.`);
        }
        // If not changed, adjustCart already showed the "Only X in stock" toast
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        adjustCart(id, -1);
      });
    }
  });

  // Update stock labels under products, if present
  Object.keys(INVENTORY).forEach(pid => {
    const stockEl = document.getElementById(`stock-${pid}`);
    if (!stockEl) return;

    const amount = INVENTORY[pid];

    if (amount <= 0) {
      stockEl.textContent = "Out of stock";
      stockEl.classList.add("text-danger");
      stockEl.classList.remove("text-muted");
    } else {
      stockEl.textContent = `In stock: ${amount}`;
      stockEl.classList.add("text-muted");
      stockEl.classList.remove("text-danger");
    }
  });

  // Initial UI sync
  updateCartUI();
});

// ADMIN: Add stock to an item
function addStock(productId, amount) {
  if (INVENTORY[productId] !== undefined) {
    INVENTORY[productId] += amount;
    saveInventory();
    console.log(`Added ${amount} to ${productId}. New total: ${INVENTORY[productId]}`);
  } else {
    console.error("Product not found:", productId);
  }
}

