// Stock Management page: stock levels, low-stock warnings and restocking

let allProducts = [];
let lowStockIds = new Set();
let threshold = 10;
let currentFilter = 'all';

async function loadStock() {
    try {
        // Products list + dashboard summary (has the low-stock list and threshold)
        const [products, summary] = await Promise.all([api('/products'), api('/dashboard')]);
        allProducts = products;
        threshold = summary.lowStockThreshold;
        lowStockIds = new Set(summary.lowStockProducts.map(p => p.id));
        renderSummary();
        renderStock();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function statusOf(p) {
    if (p.quantity === 0) return 'out';
    if (lowStockIds.has(p.id)) return 'low';
    return 'ok';
}

function renderSummary() {
    const units = allProducts.reduce((sum, p) => sum + p.quantity, 0);
    const value = allProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const out = allProducts.filter(p => statusOf(p) === 'out').length;
    const low = allProducts.filter(p => statusOf(p) === 'low').length;

    document.getElementById('totalUnits').textContent = units.toLocaleString('en-IN');
    document.getElementById('stockValue').textContent = 'Worth ' + moneyShort(value);
    document.getElementById('inStockCount').textContent = allProducts.length - out - low;
    document.getElementById('lowCount').textContent = low;
    document.getElementById('outCount').textContent = out;
    document.getElementById('thresholdNote').textContent = 'Stock ≤ ' + threshold;
}

function renderStock() {
    const text = document.getElementById('searchInput').value.trim().toLowerCase();
    const list = allProducts.filter(p => {
        const status = statusOf(p);
        const matchesFilter = currentFilter === 'all'
            || (currentFilter === 'low' && status !== 'ok')
            || (currentFilter === 'out' && status === 'out');
        return matchesFilter && (p.name.toLowerCase().includes(text) || String(p.id) === text);
    });

    const tbody = document.getElementById('stockTable');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">${emptyState('boxes', 'Nothing to show here')}</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        const status = statusOf(p);
        const color = status === 'out' ? 'var(--danger)' : status === 'low' ? 'var(--warning)' : 'var(--success)';
        // The bar is full at 5x the low-stock threshold
        const percent = Math.min(100, Math.max(p.quantity ? 4 : 0, (p.quantity / (threshold * 5)) * 100));
        const badge = status === 'out'
            ? '<span class="chip chip-dot tone-danger">Out of stock</span>'
            : status === 'low'
                ? '<span class="chip chip-dot tone-warning">Low stock</span>'
                : '<span class="chip chip-dot tone-success">In stock</span>';
        return `
        <tr>
            <td>
                <div class="item-cell">
                    ${productAvatar(p)}
                    <div>
                        <div class="item-name">${escapeHtml(p.name)}</div>
                        <div class="item-sub">ID #${p.id} &middot; ${money(p.price)}</div>
                    </div>
                </div>
            </td>
            <td>${categoryChip(p.category)}</td>
            <td>
                <div class="d-flex align-items-center gap-3">
                    <div class="level flex-grow-1"><span style="width: ${percent}%; background: ${color}"></span></div>
                    <span class="fw-bold" style="min-width: 36px">${p.quantity}</span>
                </div>
            </td>
            <td>${badge}</td>
            <td>
                <div class="input-group input-group-sm">
                    <input type="number" class="form-control" id="add-${p.id}" min="1" step="1" placeholder="Qty"
                           onkeydown="if (event.key === 'Enter') addStock(${p.id})">
                    <button class="btn btn-primary btn-sm" onclick="addStock(${p.id})">
                        <i class="bi bi-plus-lg"></i> Add
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function addStock(id) {
    const input = document.getElementById('add-' + id);
    const amount = Number(input.value);
    if (!Number.isInteger(amount) || amount <= 0) {
        showAlert('Enter a whole number greater than 0', 'warning');
        input.focus();
        return;
    }
    try {
        const product = await api('/products/' + id + '/stock?add=' + amount, { method: 'PUT' });
        showAlert('Added ' + amount + ' × ' + product.name + '. New stock: ' + product.quantity);
        loadStock();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Filter tabs
document.querySelectorAll('#filterTabs button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('#filterTabs button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderStock();
    });
});
document.getElementById('searchInput').addEventListener('input', renderStock);

loadStock();
