function increaseQuantity(btn) {
    let input = btn.parentNode.querySelector('input');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity(btn) {
    let input = btn.parentNode.querySelector('input');
    let value = parseInt(input.value);
    if (value > 1) {
        input.value = value - 1;
    }
}