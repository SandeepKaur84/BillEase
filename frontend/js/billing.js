// Billing page: choose products, set quantities, calculate totals, save the sale

let products = [];      // all products from the server
let cart = [];          // [{ product, quantity }]
let activeCategory = '';

async function loadProducts() {
    try {
        products = await api('/products');
        renderCategoryChips();
        renderProductGrid();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ----- Left side: category chips + product grid -----
function renderCategoryChips() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    const chip = (value, label) =>
        `<button class="filter-chip ${value === activeCategory ? 'active' : ''}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`;

    const box = document.getElementById('categoryChips');
    box.innerHTML = chip('', 'All') + categories.map(c => chip(c, c)).join('');
    box.querySelectorAll('.filter-chip').forEach(button => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.category;
            renderCategoryChips();
            renderProductGrid();
        });
    });
}

function filteredProducts() {
    const text = document.getElementById('productSearch').value.trim().toLowerCase();
    return products.filter(p =>
        (!activeCategory || p.category === activeCategory) &&
        (p.name.toLowerCase().includes(text) || String(p.id) === text));
}

function renderProductGrid() {
    const list = filteredProducts();
    const grid = document.getElementById('productGrid');

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1">${emptyState('search', 'No products found')}</div>`;
        return;
    }
    grid.innerHTML = list.map(p => {
        const inCart = cart.find(item => item.product.id === p.id);
        const outOfStock = p.quantity === 0;
        const stockText = outOfStock
            ? '<span class="text-danger fw-semibold">Out of stock</span>'
            : p.quantity <= 10
                ? `<span class="text-warning fw-semibold">Only ${p.quantity} left</span>`
                : `${p.quantity} in stock`;
        return `
        <button type="button" class="product-card" onclick="addToCart(${p.id})" ${outOfStock ? 'disabled' : ''}>
            ${inCart ? `<span class="in-cart-badge">${inCart.quantity}</span>` : ''}
            ${productAvatar(p)}
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="stock">${stockText}</div>
            <div class="price">${money(p.price)}</div>
        </button>`;
    }).join('');
}

const searchInput = document.getElementById('productSearch');
searchInput.addEventListener('input', renderProductGrid);

// Enter adds the first matching product (handy with a barcode scanner or typing an ID)
searchInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const first = filteredProducts().find(p => p.quantity > 0);
    if (first) {
        addToCart(first.id);
        searchInput.value = '';
        renderProductGrid();
    }
});

// ----- Cart actions -----
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const line = cart.find(item => item.product.id === productId);

    if (line) {
        if (line.quantity >= product.quantity) {
            showAlert('Only ' + product.quantity + ' ' + product.name + ' in stock', 'warning');
            return;
        }
        line.quantity++;
    } else {
        cart.push({ product: product, quantity: 1 });
    }
    renderAll();
}

function setQuantity(productId, value) {
    const line = cart.find(item => item.product.id === productId);
    let quantity = parseInt(value, 10);

    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }
    if (quantity > line.product.quantity) {
        quantity = line.product.quantity;
        showAlert('Only ' + quantity + ' ' + line.product.name + ' in stock', 'warning');
    }
    line.quantity = quantity;
    renderAll();
}

function changeQuantity(productId, delta) {
    const line = cart.find(item => item.product.id === productId);
    if (line.quantity + delta < 1) {
        removeFromCart(productId);
        return;
    }
    setQuantity(productId, line.quantity + delta);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    renderAll();
}

document.getElementById('clearBtn').addEventListener('click', async () => {
    const ok = await confirmDialog({
        title: 'Clear the bill?',
        message: 'All items will be removed from the current bill.',
        confirmText: 'Clear',
        danger: true
    });
    if (ok) {
        cart = [];
        renderAll();
    }
});

// ----- Right side: bill items and totals -----
function lineTotal(item) {
    return item.product.price * item.quantity;
}

function renderCart() {
    const box = document.getElementById('cartItems');

    if (cart.length === 0) {
        box.innerHTML = emptyState('cart3', 'Your bill is empty', '<div class="small">Tap a product on the left to add it</div>');
    } else {
        box.innerHTML = cart.map(item => `
            <div class="cart-row">
                ${productAvatar(item.product)}
                <div class="info">
                    <div class="item-name">${escapeHtml(item.product.name)}</div>
                    <div class="item-sub">${money(item.product.price)} each</div>
                    <div class="stepper mt-2">
                        <button type="button" onclick="changeQuantity(${item.product.id}, -1)">&minus;</button>
                        <input type="number" min="1" max="${item.product.quantity}" value="${item.quantity}"
                               onchange="setQuantity(${item.product.id}, this.value)">
                        <button type="button" onclick="changeQuantity(${item.product.id}, 1)">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="line-total">${money(lineTotal(item))}</div>
                    <button class="btn-icon danger mt-2" onclick="removeFromCart(${item.product.id})" title="Remove">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>`).join('');
    }

    const total = cart.reduce((sum, item) => sum + lineTotal(item), 0);
    const units = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = cart.length
        ? cart.length + ' product' + (cart.length === 1 ? '' : 's')
        : 'No items';
    document.getElementById('itemCount').textContent = units;
    document.getElementById('subtotal').textContent = money(total);
    document.getElementById('grandTotal').textContent = money(total);
    document.getElementById('checkoutBtn').disabled = cart.length === 0;
    document.getElementById('clearBtn').disabled = cart.length === 0;
}

function renderAll() {
    renderCart();
    renderProductGrid();
}

// ----- Save the sale -----
// Only product IDs and quantities are sent. The server reads prices from MySQL,
// checks stock, saves the sale and reduces stock in one transaction.
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const button = document.getElementById('checkoutBtn');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    const request = {
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity }))
    };

    try {
        const sale = await api('/sales', { method: 'POST', body: JSON.stringify(request) });
        location.href = 'invoice.html?id=' + sale.id + '&new=1';
    } catch (error) {
        showAlert(error.message, 'danger');
        button.innerHTML = '<i class="bi bi-receipt me-2"></i>Generate Bill';
        button.disabled = false;
        loadProducts(); // refresh stock numbers in case they changed
    }
});

renderCart();
loadProducts();
