// Sales History page: lists all sales from GET /api/sales with search and date filters

let allSales = [];

async function loadSales() {
    try {
        allSales = await api('/sales');
        renderSales();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function filteredSales() {
    const text = document.getElementById('searchInput').value.trim().toLowerCase();
    const from = document.getElementById('fromDate').value; // "2026-10-23" or ""
    const to = document.getElementById('toDate').value;

    return allSales.filter(s => {
        const day = localDate(new Date(s.saleDate));
        if (from && day < from) return false;
        if (to && day > to) return false;
        if (!text) return true;
        return invoiceNo(s.id).toLowerCase().includes(text)
            || String(s.id) === text
            || s.items.some(i => i.product.name.toLowerCase().includes(text));
    });
}

function renderSales() {
    const sales = filteredSales();
    renderSummary(sales);

    const tbody = document.getElementById('salesTable');
    if (sales.length === 0) {
        const hint = allSales.length === 0
            ? '<div class="small"><a href="billing.html">Create the first bill</a></div>'
            : '<div class="small">Try changing the filters</div>';
        tbody.innerHTML = `<tr><td colspan="6">${emptyState('receipt', 'No sales found', hint)}</td></tr>`;
        return;
    }

    tbody.innerHTML = sales.map(s => {
        const names = s.items.map(i => i.product.name);
        const shown = names.slice(0, 2).map(escapeHtml).join(', ');
        const more = names.length > 2 ? ` <span class="chip tone-primary ms-1">+${names.length - 2} more</span>` : '';
        const units = s.items.reduce((sum, i) => sum + i.quantity, 0);
        return `
        <tr>
            <td>
                <div class="item-cell">
                    <div class="avatar tone-success"><i class="bi bi-receipt"></i></div>
                    <div class="item-name">${invoiceNo(s.id)}</div>
                </div>
            </td>
            <td>
                <div class="fw-semibold">${formatDay(s.saleDate)}</div>
                <div class="item-sub">${formatTime(s.saleDate)}</div>
            </td>
            <td class="text-muted">${shown}${more}</td>
            <td class="text-end">${units}</td>
            <td class="text-end fw-bold">${money(s.totalAmount)}</td>
            <td class="text-end">
                <a class="btn btn-light btn-sm" href="invoice.html?id=${s.id}"><i class="bi bi-eye me-1"></i>View</a>
            </td>
        </tr>`;
    }).join('');
}

function renderSummary(sales) {
    const revenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const units = sales.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0), 0);
    document.getElementById('sumRevenue').textContent = money(revenue);
    document.getElementById('sumBills').textContent = sales.length;
    document.getElementById('sumAverage').textContent = money(sales.length ? revenue / sales.length : 0);
    document.getElementById('sumUnits').textContent = units;
}

/** Date -> "2026-10-23" in the browser's time zone (same format as <input type="date">) */
function localDate(date) {
    const pad = n => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

['searchInput', 'fromDate', 'toDate'].forEach(id =>
    document.getElementById(id).addEventListener('input', renderSales));

document.getElementById('resetBtn').addEventListener('click', () => {
    ['searchInput', 'fromDate', 'toDate'].forEach(id => { document.getElementById(id).value = ''; });
    renderSales();
});

loadSales();
