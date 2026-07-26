// Logic for index.html — fetches products from the API and renders the grid.
let currentCategory = 'All';
let currentSort = '';
let currentSearch = '';
let searchTimer = null;

function renderProducts(products) {
  const grid = document.querySelector('#product-grid');
  if (!products.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <h2 class="display">Nothing matches that search.</h2>
        <p>TRY A DIFFERENT CATEGORY OR KEYWORD</p>
      </div>`;
    return;
  }

  grid.innerHTML = products
    .map(
      (p) => `
    <div class="card">
      <div class="tag-hole"></div>
      <a href="/product.html?id=${p._id}">
        <div class="swatch-area" style="background:${p.color}22">
          <span class="letter">${p.name.charAt(0)}</span>
        </div>
      </a>
      <div class="body">
        <p class="cat mono">${p.category}</p>
        <a href="/product.html?id=${p._id}"><p class="name display">${p.name}</p></a>
        <div class="row">
          <span class="price">₹${p.price.toLocaleString('en-IN')}</span>
          <button class="btn btn-outline" data-add="${p._id}" style="padding:6px 12px; font-size:0.75rem;">
            Add to cart
          </button>
        </div>
        <p class="stock mono">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
      </div>
    </div>`
    )
    .join('');

  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = products.find((p) => p._id === btn.dataset.add);
      if (!product || product.stock === 0) return;
      addToCart(product, 1);
      btn.textContent = 'Added ✓';
      setTimeout(() => (btn.textContent = 'Add to cart'), 1200);
    });
  });
}

async function loadProducts() {
  const grid = document.querySelector('#product-grid');
  grid.innerHTML = `<p class="mono" style="grid-column:1/-1; color:var(--ink-soft)">Loading catalogue…</p>`;
  try {
    const params = new URLSearchParams();
    if (currentCategory !== 'All') params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);
    if (currentSort) params.set('sort', currentSort);

    const products = await apiFetch(`/products?${params.toString()}`);
    renderProducts(products);
  } catch (err) {
    grid.innerHTML = `<p class="error-msg" style="grid-column:1/-1">${err.message}</p>`;
  }
}

document.querySelectorAll('#filters .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#filters .pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    loadProducts();
  });
});

document.querySelector('#search-input').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 300);
});

document.querySelector('#sort-select').addEventListener('change', (e) => {
  currentSort = e.target.value;
  loadProducts();
});

loadProducts();
