const API = "https://myshop-msmy.onrender.com/api/products";
console.log("products.js loaded");
async function loadProducts() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    const container = document.getElementById("products");

    container.innerHTML = data.map(product => `
      <div class="product-card">
        <img src="${product.image}" width="150"/>
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading products:", err);
  }
}