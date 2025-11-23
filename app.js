let price = 25.99;
let cart = 0;
let cartTotal = 0;

// Load saved info
if (localStorage.getItem("cart")) {
    cart = parseInt(localStorage.getItem("cart"));
}
if (localStorage.getItem("cartTotal")) {
    cartTotal = parseInt(localStorage.getItem("cartTotal"));
}

const cartItem = document.getElementById("cartItem");
const priceTotal = document.getElementById("priceTotal");
const cartBadge = document.getElementById("cartBadge");

// Update UI when page loads
function updateUI() {
    cartItem.textContent = `${cart}`;
    cartBadge.textContent = `${cartTotal}`;

    let total = price * cart;
    priceTotal.textContent = `Total: $${total.toFixed(2)}`;
}
updateUI();

function saveCart() {
    localStorage.setItem("cart", cart);
    localStorage.setItem("cartTotal", cartTotal);
}

function removeCartTest() {
    if (cart <= 0) {
        cart = 0;
        cartTotal = 0;
    } else {
        cart = cart - 1;
        cartTotal = cartTotal - 1;
    }

    updateUI();
    saveCart();
}

function addCartTest() {
    if (cart >= 99) {
        cart = 99;
    } else {
        cart = cart + 1;
        cartTotal = cartTotal + 1;
    }

    updateUI();
    saveCart();
}

function loadCartOnPage() {
    let savedCartTotal = localStorage.getItem("cartTotal");

    if (cartBadge && savedCartTotal !== null) {
        cartBadge.textContent = savedCartTotal;
    }
}

loadCartOnPage();
