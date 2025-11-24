// =======================
//  FIREBASE SETUP
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDS7_y8tvBkbBk48OD8z6XzU9e1_s_zqyI",
  authDomain: "magicmoonstore-776e1.firebaseapp.com",
  projectId: "magicmoonstore-776e1",
  storageBucket: "magicmoonstore-776e1.firebasestorage.app",
  messagingSenderId: "74334250156",
  appId: "1:74334250156:web:78f4a3937c5795155eeb09",
  measurementId: "G-VN37CQNL8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// =======================
//  PRODUCT CATALOG
// =======================
const PRODUCT_DATA = {
  chakraWater: {
    id: "chakraWater",
    name: "Chakra Water",
    price: 24.99,
    description: "Reiki infused water",
    image: "chakra-water.png",
    url: "chakra-water.html",
    stock: 5
  },
  protectionCandle: {
    id: "protectionCandle",
    name: "Protection Candle",
    price: 12.99,
    description: "Hand-poured protection spell candle.",
    image: "protection-candle-img.png",
    url: "protection-candle.html",
    stock: 10
  }
  // Add more products here...
};

// =======================
//  INVENTORY (Firestore)
// =======================

// This will hold the live inventory numbers keyed by product ID
let INVENTORY = {};

// Start with defaults from PRODUCT_DATA so we always have something
for (const [id, product] of Object.entries(PRODUCT_DATA)) {
  if (typeof product.stock === "number") {
    INVENTORY[id] = product.stock;
  }
}

/**
 * Load inventory from Firestore.
 * If no document exists yet, create it from PRODUCT_DATA.stock.
 */
async function loadInventoryFromDB() {
  try {
    const invRef = doc(db, "store", "inventory");
    const snap = await getDoc(invRef);

    if (snap.exists()) {
      const data = snap.data() || {};
      Object.assign(INVENTORY, data);   // merge DB → memory
    } else {
      await setDoc(invRef, INVENTORY);  // first time, seed DB
    }

    updateStockDisplays();              // ✅ show DB values
  } catch (err) {
    console.error("Error loading inventory from Firestore:", err);

    // ✅ Fallback: still show the PRODUCT_DATA defaults
    updateStockDisplays();
  }
}

/**
 * Save current INVENTORY into Firestore.
 * This is used by checkout, restock, etc.
 */
async function saveInventory() {
  try {
    const invRef = doc(db, "store", "inventory");
    await setDoc(invRef, INVENTORY);
  } catch (err) {
    console.error("Error saving inventory to Firestore:", err);
  }
}

/**
 * Update stock labels on the page, if present.
 * Looks for elements with IDs: stock-<productId>
 */
function updateStockDisplays() {
  Object.keys(INVENTORY).forEach((id) => {
    const stockEl = document.getElementById(`stock-${id}`);
    if (!stockEl) return;

    const amount = INVENTORY[id] ?? 0;
    if (amount <= 0) {
      stockEl.textContent = "Out of stock";
      stockEl.classList.add("text-danger");
    } else {
      stockEl.textContent = `In stock: ${amount}`;
      stockEl.classList.remove("text-danger");
    }

    // Also optionally disable buttons if out of stock
    const group = document.querySelector(`.btn-group[data-product-id="${id}"]`);
    if (group) {
      const plusBtn = group.querySelector(".btn-cart-plus");
      if (plusBtn) {
        plusBtn.disabled = amount <= 0;
      }
      if (amount <= 0) {
        group.style.opacity = "0.5";
      } else {
        group.style.opacity = "1";
      }
    }
  });
}

// =======================
//  CART CORE (localStorage)
// =======================
const STORAGE_KEY = "storeCart";

// Global cart object
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  cart = {};
}

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

// =======================
//  adjustCart with Firestore-backed INVENTORY
// =======================
function adjustCart(productId, delta, name, price) {
  // Ensure a cart entry exists
  if (!cart[productId]) {
    const fallbackProduct = PRODUCT_DATA[productId] || {};
    cart[productId] = {
      name: name || fallbackProduct.name || "Item",
      price: parseFloat(
        price ?? fallbackProduct.price ?? 0
      ),
      qty: 0
    };
  }

  const limit = INVENTORY[productId]; // from Firestore (or default)
  const currentQty = cart[productId].qty;
  const nextQty = currentQty + delta;

  // If we're trying to ADD and that would exceed stock, block it
  if (delta > 0 && typeof limit === "number" && nextQty > limit) {
    showCartToast(`Only ${limit} of ${cart[productId].name} in stock.`);
    return false; // nothing changed
  }

  // Apply the change, but don't go below 0
  cart[productId].qty = Math.max(0, nextQty);

  saveCart();
  updateCartUI();

  return true; // successfully changed
}

// =======================
//  DOM WIRING FOR PRODUCT PAGES
// =======================

document.addEventListener("DOMContentLoaded", () => {
  // Fade-in effect
  document.body.classList.add("page-loaded");

  // Wire up all product controls on this page
  const productGroups = document.querySelectorAll(".btn-group[data-product-id]");

  productGroups.forEach((group) => {
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

    // Ensure cart entry exists
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

  // Load inventory from Firestore and update stock text / buttons
  loadInventoryFromDB();

  // Initial cart UI sync
  updateCartUI();
});

// =======================
//  ORDER LOGGING
// =======================
async function logOrder(orderData) {
  try {
    const ref = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    console.log("Order saved with ID:", ref.id);
  } catch (err) {
    console.error("Error saving order:", err);
  }
}

// Helper to clear the cart (so checkout page can use it safely)
function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
}

// =======================
//  Expose functions globally (for inline scripts in other pages)
// =======================

// So checkout.html, cart.html, restock.html, etc. can call these
window.PRODUCT_DATA = PRODUCT_DATA;
window.INVENTORY = INVENTORY;
window.saveInventory = saveInventory;
window.loadCart = loadCart;
window.saveCart = saveCart;
window.updateCartUI = updateCartUI;
window.adjustCart = adjustCart;
window.showCartToast = showCartToast;
window.updateStockDisplays = updateStockDisplays;

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
}

// Expose functions globally (for inline scripts)
window.clearCart = clearCart;
