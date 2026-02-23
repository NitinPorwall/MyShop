const API_BASE = "http://localhost:5000/api";

// ===== AUTH: LOGIN =====
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save token and user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect by role
        if (data.user.role === "seller") {
          window.location.href = "seller.html";
        } else if (data.user.role === "customer") {
          window.location.href = "customer.html";
        } else {
          message.textContent = "Invalid role.";
        }
      } else {
        message.textContent = data.message || "Login failed.";
      }
    } catch (err) {
      console.error("Login Error:", err);
      message.textContent = "Server error — check backend.";
    }
  });
}


// ===== AUTH: REGISTER =====
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const message = document.getElementById("message");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        message.textContent = "✅ Registered! You can now log in.";
      } else {
        message.textContent = data.message || "Registration failed";
      }
    } catch {
      message.textContent = "Server error";
    }
  });
}

// ===== LOGOUT =====
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
}

// ===== SELLER DASHBOARD =====
const addProductBtn = document.getElementById("addProductBtn");
if (addProductBtn) {
  const seller = JSON.parse(localStorage.getItem("user"));
  if (!seller || seller.role !== "seller") {
    window.location.href = "login.html";
  }

  document.getElementById("sellerName").textContent = seller.name;
  const token = localStorage.getItem("token");

  // Add product
  addProductBtn.addEventListener("click", async () => {
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = document.getElementById("productPrice").value;
    const productMsg = document.getElementById("productMsg");

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price,
          sellerName: seller.name,
          sellerId: seller._id,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        productMsg.textContent = "✅ Product added!";
        document.getElementById("productName").value = "";
        document.getElementById("productDescription").value = "";
        document.getElementById("productPrice").value = "";
        loadSellerProducts();
      } else {
        productMsg.textContent = data.message || "Failed to add product.";
      }
    } catch {
      productMsg.textContent = "Server error";
    }
  });

  // Load seller’s products
  async function loadSellerProducts() {
  const list = document.getElementById("productList");
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();

  // Fix: Compare ObjectIds as strings
  const sellerProducts = products.filter(
    (p) => String(p.sellerId) === String(seller._id)
  );

  if (sellerProducts.length === 0) {
    list.innerHTML = "<p>No products found. Add one above!</p>";
    return;
  }

  list.innerHTML = sellerProducts
    .map(
      (p) => `
      <div class="product-card">
        <h4>${p.name}</h4>
        <p>${p.description}</p>
        <p>💰 ₹${p.price}</p>
        <button onclick="editProduct('${p._id}', '${p.name}', '${p.description}', ${p.price})">✏️ Edit</button>
        <button onclick="deleteProduct('${p._id}')">🗑️ Delete</button>
      </div>`
    )
    .join("");
}


  window.editProduct = async (id, oldName, oldDesc, oldPrice) => {
    const name = prompt("Edit Name:", oldName);
    const description = prompt("Edit Description:", oldDesc);
    const price = prompt("Edit Price:", oldPrice);

    if (name && description && price) {
      await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, price }),
      });
      loadSellerProducts();
    }
  };

  window.deleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      loadSellerProducts();
    }
  };

  loadSellerProducts();
}

// ===== CUSTOMER DASHBOARD =====
const customerName = document.getElementById("customerName");
if (customerName) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "customer") {
    window.location.href = "login.html";
  }
  customerName.textContent = user.name;

  let cart = [];

  async function loadAllProducts() {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();

    const list = document.getElementById("allProducts");
    list.innerHTML = products
      .map(
        (p) => `
        <div class="product-card">
          <h4>${p.name}</h4>
          <p>${p.description}</p>
          <p>💰 ₹${p.price}</p>
          <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
        </div>`
      )
      .join("");
  }

  window.addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    renderCart();
  };

  function renderCart() {
    const cartDiv = document.getElementById("cartItems");
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    document.getElementById("cartTotal").textContent = `Total: ₹${total}`;

    cartDiv.innerHTML = cart
      .map(
        (item) => `
        <div>
          ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}
          <button onclick="removeFromCart('${item._id}')">Remove</button>
        </div>`
      )
      .join("");
  }

  window.removeFromCart = (id) => {
    cart = cart.filter((item) => item._id !== id);
    renderCart();
  };

  const checkoutBtn = document.getElementById("checkoutBtn");
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const orderData = {
      customerId: user._id,
      customerName: user.name,
      items: cart.map((i) => ({
        productId: i._id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        sellerName: i.sellerName,
      })),
      totalAmount: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById("orderMsg").textContent = "✅ Order placed!";
      cart = [];
      renderCart();
    } else {
      document.getElementById("orderMsg").textContent = data.message || "Error placing order.";
    }
  });

  loadAllProducts();
}
