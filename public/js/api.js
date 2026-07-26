// Shared Fetch API wrapper + localStorage-backed session and cart helpers.
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('myshop_token');
}

function getUser() {
  const raw = localStorage.getItem('myshop_user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('myshop_token', token);
  localStorage.setItem('myshop_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('myshop_token');
  localStorage.removeItem('myshop_user');
}

// Wraps fetch(): attaches the JWT when present, parses JSON, and throws
// a plain Error with the server's message when the response isn't OK.
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

/* ---------------- Cart (localStorage) ---------------- */

function getCart() {
  return JSON.parse(localStorage.getItem('myshop_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('myshop_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === product._id);
  if (existing) existing.qty += qty;
  else {
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      color: product.color,
      qty,
    });
  }
  saveCart(cart);
}

function updateCartQty(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(9, item.qty + delta));
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.productId !== productId));
}

function clearCart() {
  saveCart([]);
}

function updateCartBadge() {
  const badge = document.querySelector('#cart-count');
  if (badge) badge.textContent = getCart().reduce((n, i) => n + i.qty, 0);
}

/* ---------------- Nav (shared across pages) ---------------- */

function initNav() {
  updateCartBadge();
  const user = getUser();

  document.querySelectorAll('.guest-only').forEach((el) => {
    el.style.display = user ? 'none' : '';
  });
  document.querySelectorAll('.auth-only').forEach((el) => {
    el.style.display = user ? '' : 'none';
  });
  document.querySelectorAll('.seller-only').forEach((el) => {
    el.style.display = user && user.role === 'seller' ? '' : 'none';
  });

  const nameEl = document.querySelector('#user-name');
  if (nameEl && user) nameEl.textContent = user.name;

  const logoutBtn = document.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = '/';
    });
  }
}

document.addEventListener('DOMContentLoaded', initNav);
