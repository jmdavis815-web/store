// ===== Cart Setup =====
const PRICE_PER_ITEM = 25.99;

// Load saved cart value or default to 0
let cart = parseInt(localStorage.getItem("cart") || "0", 10);

// These will be set after the DOM is ready
let cartBadge;
let cartItem;
let priceTotal;

// Grab elements once the page is loaded, then sync UI
document.addEventListener("DOMContentLoaded", () => {
    cartBadge  = document.getElementById("cartBadge"); // navbar badge
    cartItem   = document.getElementById("cartItem");  // middle button on product
    priceTotal = document.getElementById("priceTotal"); // total in navbar (or cart page)

    updateUI();
});

// Save to localStorage so all pages can read it
function saveCart() {
    localStorage.setItem("cart", cart.toString());
}

// Update all visible elements that exist on this page
function updateUI() {
    const total = cart * PRICE_PER_ITEM;

    if (cartBadge) {
        cartBadge.textContent = cart;
    }

    if (cartItem) {
        cartItem.textContent = cart;
    }

    if (priceTotal) {
        priceTotal.textContent = `Total: $${total.toFixed(2)}`;
    }
}

// Called by: onclick="addCartTest()"
function addCartTest() {
    if (cart < 99) {
        cart++;
        saveCart();
        updateUI();
    }
}

// Called by: onclick="removeCartTest()"
function removeCartTest() {
    if (cart > 0) {
        cart--;
        saveCart();
        updateUI();
    }
}
