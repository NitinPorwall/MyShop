// Logic for product.html — loads a single product by ?id= and lets the
// shopper choose a quantity before adding it to their cart.
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
let currentQty = 1;
let loadedProduct = null;

function renderProduct(p) {
  loadedProduct = p;
  document.querySelector('#product-detail').innerHTML = `
    <div class="swatch-area" style="background:${p.color}22">
      <span class="letter">${p.name.charAt(0)}</span>
    </div>
    <div>
      <p class="cat mono">${p.category}</p>
      <h1 class="display">${p.name}</h1>
      <p class="price">₹${p.price.toLocaleString('en-IN')}</p>
      <p class="desc">${p.description || 'No description provided.'}</p>
      <p class="mono" style="font-size:0.75rem; color:var(--ink-soft); margin-bottom:16px;">
        ${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
        ${p.seller && p.seller.name ? ` · Sold by ${p.seller.name}` : ''}
      </p>
      <div class="qty-control" id="qty-control">
        <button id="qty-minus">−</button>
        <span id="qty-value">1</span>
        <button id="qty-plus">+</button>
      </div>
      <div style="margin-top:20px;">
        <button id="add-btn" class="btn btn-primary" ${p.stock === 0 ? 'disabled' : ''}>
          Add to cart
        </button>
      </div>
    </div>
  `;

  document.querySelector('#qty-minus').addEventListener('click', () => {
    currentQty = Math.max(1, currentQty - 1);
    document.querySelector('#qty-value').textContent = currentQty;
  });
  document.querySelector('#qty-plus').addEventListener('click', () => {
    currentQty = Math.min(p.stock || 9, currentQty + 1);
    document.querySelector('#qty-value').textContent = currentQty;
  });
  document.querySelector('#add-btn').addEventListener('click', () => {
    addToCart(loadedProduct, currentQty);
    const btn = document.querySelector('#add-btn');
    btn.textContent = 'Added ✓';
    setTimeout(() => (btn.textContent = 'Add to cart'), 1200);
  });
}

async function loadProduct() {
  const container = document.querySelector('#product-detail');
  if (!productId) {
    container.innerHTML = `<p class="error-msg">No product specified.</p>`;
    return;
  }
  try {
    const product = await apiFetch(`/products/${productId}`);
    renderProduct(product);
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

loadProduct();
