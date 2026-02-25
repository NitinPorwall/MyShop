const API_BASE = "https://myshop-msmy.onrender.com/api";
console.log("Script Loaded");

/* ================= LOGIN / LOGOUT ================= */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.onclick = () => {
  localStorage.clear();
  window.location.href = "login.html";
};

/* ================= SELLER DASHBOARD ================= */
if (document.getElementById("addProductBtn")) {
  const seller = JSON.parse(localStorage.getItem("user"));
  if (!seller) window.location.href = "login.html";

  document.getElementById("sellerName").textContent = seller.name;

  const addProductBtn = document.getElementById("addProductBtn");

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  addProductBtn.onclick = async () => {
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = document.getElementById("productPrice").value;
    const imageFile = document.getElementById("productImage").files[0];

    if (!imageFile) return alert("Please select an image!");

    const imageBase64 = await toBase64(imageFile);

    await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price,
        image: imageBase64,
        sellerName: seller.name,
        sellerId: seller._id,
      }),
    });

    document.getElementById("productName").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productImage").value = "";

    loadSellerProducts();
  };

  async function loadSellerProducts() {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();
    const list = document.getElementById("productList");

    const sellerProducts = products.filter(
      (p) => String(p.sellerId) === String(seller._id)
    );

    list.innerHTML = sellerProducts
      .map(
        (p) => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}" />
        <h4>${p.name}</h4>
        <p>${p.description}</p>
        <p class="price">₹${p.price}</p>
      </div>
    `
      )
      .join("");
  }

  loadSellerProducts(); // Initial load
}