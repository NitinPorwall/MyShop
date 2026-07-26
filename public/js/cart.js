// Logic for cart.html — reads/writes the localStorage cart and places
// the order through the authenticated /api/orders endpoint at checkout.

function renderCart() {
  const cart = getCart();
  const container = document.querySelector('#cart-items');
  const summary = document.querySelector('#cart-summary');

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty">
        <h2 class="display">Your cart is empty.</h2>
        <p>ADD SOMETHING FROM THE CATALOGUE</p>
      </div>`;
    summary.style.display = 'none';
    return;
  }

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="swatch-area" style="background:${item.color}22">
        <span class="letter">${item.name.charAt(0)}</span>
      </div>
      <div class="info">
        <p class="name">${item.name}</p>
        <p class="meta mono">₹${item.price.toLocaleString('en-IN')} each</p>
        <div class="qty-control" style="margin-top:8px; padding:4px 10px;">
          <button data-minus="${item.productId}">−</button>
          <span>${item.qty}</span>
          <button data-plus="${item.productId}">+</button>
        </div>
      </div>
      <div style="text-align:right;">
        <p class="mono">₹${(item.price * item.qty).toLocaleString('en-IN')}</p>
        <button data-remove="${item.productId}" class="btn btn-danger" style="margin-top:8px; padding:5px 10px; font-size:0.75rem;">Remove</button>
      </div>
    </div>`
    )
    .join('');

  document.querySelectorAll('[data-plus]').forEach((btn) =>
    btn.addEventListener('click', () => {
      updateCartQty(btn.dataset.plus, 1);
      renderCart();
    })
  );
  document.querySelectorAll('[data-minus]').forEach((btn) =>
    btn.addEventListener('click', () => {
      updateCartQty(btn.dataset.minus, -1);
      renderCart();
    })
  );
  document.querySelectorAll('[data-remove]').forEach((btn) =>
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.remove);
      renderCart();
    })
  );

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.querySelector('#cart-subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  summary.style.display = 'block';
}

document.querySelector('#checkout-btn').addEventListener('click', async () => {
  const msgEl = document.querySelector('#checkout-msg');
  msgEl.style.display = 'none';

  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  if (user.role !== 'customer') {
    msgEl.textContent = 'Seller accounts cannot place orders. Log in as a customer to check out.';
    msgEl.style.display = 'block';
    return;
  }

  const cart = getCart();
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
      }),
    });
    clearCart();
    renderCart();
    msgEl.style.color = 'var(--moss)';
    msgEl.textContent = 'Order placed. Thanks for shopping with MyShop!';
    msgEl.style.display = 'block';
  } catch (err) {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = err.message;
    msgEl.style.display = 'block';
  }
});

renderCart();
