// Logic for seller-dashboard.html — guards the page to logged-in sellers
// and drives the create / edit / delete product flow via the REST API.

const user = getUser();
if (!user || user.role !== 'seller') {
  window.location.href = '/login.html';
}

let editingId = null;

const STANDARD_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Books',
  'Sports & Fitness',
  'Toys & Games',
  'Groceries',
];

const categorySelect = document.querySelector('#p-category');
const customCategoryField = document.querySelector('#custom-category-field');
const customCategoryInput = document.querySelector('#p-category-custom');

categorySelect.addEventListener('change', () => {
  customCategoryField.style.display = categorySelect.value === '__custom__' ? 'block' : 'none';
});

function getSelectedCategory() {
  return categorySelect.value === '__custom__' ? customCategoryInput.value.trim() : categorySelect.value;
}

function setCategoryInForm(category) {
  if (STANDARD_CATEGORIES.includes(category)) {
    categorySelect.value = category;
    customCategoryField.style.display = 'none';
  } else {
    categorySelect.value = '__custom__';
    customCategoryInput.value = category;
    customCategoryField.style.display = 'block';
  }
}

function renderTable(products) {
  const tbody = document.querySelector('#product-table-body');
  const empty = document.querySelector('#products-empty');

  if (!products.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₹${p.price.toLocaleString('en-IN')}</td>
      <td>${p.stock}</td>
      <td class="row-actions">
        <button class="btn btn-outline" data-edit="${p._id}">Edit</button>
        <button class="btn btn-danger" data-delete="${p._id}">Delete</button>
      </td>
    </tr>`
    )
    .join('');

  document.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const product = products.find((p) => p._id === btn.dataset.edit);
      startEdit(product);
    })
  );
  document.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', () => deleteProduct(btn.dataset.delete))
  );
}

async function loadMyProducts() {
  try {
    const products = await apiFetch('/products/seller/mine');
    renderTable(products);
    return products;
  } catch (err) {
    document.querySelector('#form-error').textContent = err.message;
    document.querySelector('#form-error').style.display = 'block';
  }
}

function startEdit(product) {
  editingId = product._id;
  document.querySelector('#form-title').textContent = 'Edit product';
  document.querySelector('#submit-btn').textContent = 'Save changes';
  document.querySelector('#cancel-edit').style.display = 'block';
  document.querySelector('#p-name').value = product.name;
  document.querySelector('#p-description').value = product.description || '';
  setCategoryInForm(product.category);
  document.querySelector('#p-price').value = product.price;
  document.querySelector('#p-stock').value = product.stock;
  document.querySelector('#p-color').value = product.color || '#4b5842';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  document.querySelector('#product-form').reset();
  document.querySelector('#form-title').textContent = 'Add a product';
  document.querySelector('#submit-btn').textContent = 'Add product';
  document.querySelector('#cancel-edit').style.display = 'none';
  customCategoryField.style.display = 'none';
}

document.querySelector('#cancel-edit').addEventListener('click', resetForm);

document.querySelector('#product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.querySelector('#form-error');
  const successEl = document.querySelector('#form-success');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const category = getSelectedCategory();
  if (!category) {
    errorEl.textContent = 'Enter a category name.';
    errorEl.style.display = 'block';
    return;
  }

  const payload = {
    name: document.querySelector('#p-name').value,
    description: document.querySelector('#p-description').value,
    category,
    price: Number(document.querySelector('#p-price').value),
    stock: Number(document.querySelector('#p-stock').value),
    color: document.querySelector('#p-color').value,
  };

  try {
    if (editingId) {
      await apiFetch(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      successEl.textContent = 'Product updated.';
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      successEl.textContent = 'Product added.';
    }
    successEl.style.display = 'block';
    resetForm();
    loadMyProducts();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
});

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    loadMyProducts();
  } catch (err) {
    alert(err.message);
  }
}

loadMyProducts();
