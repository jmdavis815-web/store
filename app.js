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
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// =======================
//  STRIPE CHECKOUT CONFIG
// =======================

// 🔹 Replace this with the actual URL shown in Firebase Console
// Go to: Firebase Console → Functions → createCheckoutSession → "Trigger" URL
const CHECKOUT_ENDPOINT =
  "https://createcheckoutsession-2vmbgfumbq-uc.a.run.app";


// =======================
//  SITE VIEW COUNTER
// =======================
async function incrementPageViews() {
  try {
    const statsRef = doc(db, "store", "stats");
    const snap = await getDoc(statsRef);

    if (snap.exists()) {
      const data = snap.data() || {};
      const current = typeof data.pageViews === "number" ? data.pageViews : 0;
      await setDoc(statsRef, { pageViews: current + 1 }, { merge: true });
    } else {
      // First time: create stats doc with pageViews = 1
      await setDoc(statsRef, { pageViews: 1 });
    }
  } catch (err) {
    console.error("Error incrementing page views:", err);
  }
}

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

let INVENTORY = {};

// Load defaults
for (const [id, product] of Object.entries(PRODUCT_DATA)) {
  if (typeof product.stock === "number") {
    INVENTORY[id] = product.stock;
  }
}

async function loadInventoryFromDB() {
  try {
    const invRef = doc(db, "store", "inventory");
    const snap = await getDoc(invRef);

    if (snap.exists()) {
      Object.assign(INVENTORY, snap.data());
    } else {
      await setDoc(invRef, INVENTORY);
    }

    updateStockDisplays();
  } catch (err) {
    console.error("Error loading inventory:", err);
    updateStockDisplays();
  }
}

async function saveInventory() {
  try {
    const invRef = doc(db, "store", "inventory");
    await setDoc(invRef, INVENTORY);
  } catch (err) {
    console.error("Error saving inventory:", err);
  }
}

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

    const group = document.querySelector(`.btn-group[data-product-id="${id}"]`);
    if (group) {
      const plusBtn = group.querySelector(".btn-cart-plus");
      if (plusBtn) plusBtn.disabled = amount <= 0;
      group.style.opacity = amount <= 0 ? "0.5" : "1";
    }
  });
}

// =======================
//  VIEW TRACKING
// =======================

async function logPageView() {
  try {
    // Don't count admin pages as "views"
    if (location.pathname.includes("admin")) return;

    // 1) Update total view counter
    const statsRef = doc(db, "store", "stats");
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data() || {};
      const current = typeof data.pageViews === "number" ? data.pageViews : 0;
      await setDoc(
        statsRef,
        { pageViews: current + 1 },
        { merge: true }
      );
    } else {
      await setDoc(statsRef, { pageViews: 1 }, { merge: true });
    }

    // 2) Log individual view event (for graphs)
    await addDoc(collection(db, "viewEvents"), {
      path: window.location.pathname,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error logging page view:", err);
  }
}

// =======================
//  CART CORE
// =======================
const STORAGE_KEY = "storeCart";

let cart = {};
try {
  cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (e) {
  cart = {};
}

// 🔥 CLEAN UP zero items from previous versions
for (const [id, item] of Object.entries(cart)) {
  if (!item || typeof item.qty !== "number" || item.qty <= 0) {
    delete cart[id];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
  return cart;
}

function showCartToast(message) {
  const toastEl = document.getElementById("cartToast");
  if (!toastEl || typeof bootstrap === "undefined") return;

  const bodyEl = toastEl.querySelector(".toast-body");
  if (bodyEl) bodyEl.textContent = message;

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}

function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const priceTotal = document.getElementById("priceTotal");

  if (priceTotal) {
    priceTotal.style.color = "green";
  }

  // 🔹 First, reset all known product qty buttons to 0
  Object.keys(PRODUCT_DATA).forEach((id) => {
    const qtyResetEl = document.getElementById(`qty-${id}`);
    if (qtyResetEl) {
      qtyResetEl.textContent = "0";
    }
  });

  let totalQty = 0;
  let totalPrice = 0;

  // 🔹 Then, apply real quantities for items that are actually in the cart
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
//  adjustCart
// =======================
function adjustCart(productId, delta, name, price) {
  if (!cart[productId]) {
    const fallback = PRODUCT_DATA[productId] || {};
    cart[productId] = {
      name: name || fallback.name || "Item",
      price: parseFloat(price ?? fallback.price ?? 0),
      qty: 0
    };
  }

  const limit = INVENTORY[productId];
  const currentQty = cart[productId].qty;
  const nextQty = currentQty + delta;

  if (delta > 0 && typeof limit === "number" && nextQty > limit) {
    showCartToast(`Only ${limit} of ${cart[productId].name} in stock.`);
    return false;
  }

  cart[productId].qty = Math.max(0, nextQty);
  if (cart[productId].qty === 0) delete cart[productId];

  saveCart();
  updateCartUI();
  return true;
}

// =======================
//  DOM WIRING
// =======================
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");

  // 🔹 Log a view for any non-admin page
  logPageView();

  const productGroups = document.querySelectorAll(".btn-group[data-product-id]");

  productGroups.forEach((group) => {
    const id = group.dataset.productId;
    const product = PRODUCT_DATA[id] || {};

    const name = group.dataset.productName || product.name || "Item";
    const price = parseFloat(group.dataset.productPrice || product.price || 0);

    const plusBtn = group.querySelector(".btn-cart-plus");
    const minusBtn = group.querySelector(".btn-cart-minus");
    const qtyBtn = document.getElementById(`qty-${id}`);

    const existingItem = cart[id];
    if (qtyBtn) qtyBtn.textContent = existingItem ? existingItem.qty : 0;

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        const changed = adjustCart(id, +1, name, price);
        if (changed) showCartToast(`${name} added to cart.`);
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener("click", () => adjustCart(id, -1));
    }
  });

  loadInventoryFromDB();
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

// =======================
//  STRIPE CHECKOUT
// =======================

async function startCheckout() {
  try {
    // Build an array of items from the cart
    const items = Object.entries(cart)
      .map(([id, item]) => {
        if (!item || typeof item.qty !== "number" || item.qty <= 0) return null;
        const product = PRODUCT_DATA[id] || {};
        return {
          id,
          name: product.name || id,
          quantity: item.qty,
          price: product.price || 0,
        };
      })
      .filter(Boolean);

    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }

    if (!CHECKOUT_ENDPOINT) {
      console.error("Missing CHECKOUT_ENDPOINT");
      alert("Checkout is not configured yet.");
      return;
    }

    // Call your Firebase HTTPS function
    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // This shape must match what your Cloud Function expects
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Checkout error:", text);
      alert("Could not start checkout. Please try again.");
      return;
    }

    const data = await res.json();
    console.log("Checkout session response:", data);

    if (data.url) {
      // Stripe-hosted checkout page
      window.location.href = data.url;
    } else {
      alert("No checkout URL was returned from the server.");
    }
  } catch (err) {
    console.error("Checkout failed:", err);
    alert("Checkout failed. Please try again in a moment.");
  }
}

// =======================
//  GLOBAL EXPORTS
// =======================
window.PRODUCT_DATA = PRODUCT_DATA;
window.INVENTORY = INVENTORY;
window.saveInventory = saveInventory;
window.loadCart = loadCart;
window.saveCart = saveCart;
window.updateCartUI = updateCartUI;
window.adjustCart = adjustCart;
window.showCartToast = showCartToast;
window.updateStockDisplays = updateStockDisplays;
window.logOrder = logOrder;
window.startCheckout = startCheckout;

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
}
window.clearCart = clearCart;
