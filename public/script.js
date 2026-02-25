// script.js
const API_BASE = "https://myshop-msmy.onrender.com/api"; // Replace with your Render API URL
console.log("Script Loaded");

/* ===================== LOGOUT ===================== */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = "login.html";
  };
}

/* ===================== LOGIN PAGE ===================== */
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("message");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        messageEl.textContent = data.message || "Login failed";
        return;
      }

      // Save user and token
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Redirect based on role
      if (data.user.role === "seller") window.location.href = "seller.html";
      else window.location.href = "customer.html";
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Server error";
    }
  };
}

/* ===================== REGISTER PAGE ===================== */
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.onclick = async () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const messageEl = document.getElementById("message");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        messageEl.textContent = data.message || "Registration failed";
        return;
      }

      messageEl.textContent = "Registration successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (err) {
      console.error(err);
      messageEl.textContent = "Server error";
    }
  };
}

/* ===================== SELLER DASHBOARD ===================== */
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

    if (!name || !description || !price || !imageFile) {
      return alert("Please fill all fields and select an image!");
    }

    const imageBase64 = await toBase64(imageFile);

    try {
      await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          image: imageBase64,
          sellerName: seller.name,
          sellerId: seller._id,
        }),
      });

      // Clear form
      document.getElementById("productName").value = "";
      document.getElementById("productDescription").value = "";
      document.getElementById("productPrice").value = "";
      document.getElementById("productImage").value = "";

      loadSellerProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  async function loadSellerProducts() {
    try {
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
    } catch (err) {
      console.error("Failed to load seller products:", err);
    }
  }

  loadSellerProducts(); // initial load
}

/* ===================== CUSTOMER DASHBOARD ===================== */
if (document.getElementById("customerName")) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) window.location.href = "login.html";

  document.getElementById("customerName").textContent = user.name;

  async function loadAllProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const products = await res.json();
      const list = document.getElementById("allProducts");

      list.innerHTML = products
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
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }

  loadAllProducts(); // initial load
}