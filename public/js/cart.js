function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push({ id, name, price });

  localStorage.setItem("cart", JSON.stringify(cart));

  alert("Added to cart");
}

function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const container = document.getElementById("cart");

  container.innerHTML = cart.map(item => `
    <p>${item.name} - ₹${item.price}</p>
  `).join("");
}

loadCart();