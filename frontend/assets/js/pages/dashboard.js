// Dashboard page: summary cards, charts and lists

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6'];

async function loadDashboard() {
    try {
        // Load everything at the same time
        const [summary, sales] = await Promise.all([api('/dashboard'), api('/sales')]);

        renderKpis(summary, sales);
        renderRevenueChart(sales);
        renderCategoryChart(sales);
        renderTopProducts(sales);
        renderLowStock(summary.lowStockProducts, summary.lowStockThreshold);
        renderRecentSales(summary.recentSales);
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ----- KPI cards -----
function renderKpis(summary, sales) {
    const todayKey = dayKey(new Date());
    const todaySales = sales.filter(s => dayKey(new Date(s.saleDate)) === todayKey);
    const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

    setText('kpiRevenue', money(summary.totalRevenue));
    setText('kpiRevenueNote', summary.totalSales + ' bill' + (summary.totalSales === 1 ? '' : 's') + ' in total');
    setText('kpiToday', money(todayTotal));
    setText('kpiTodayNote', todaySales.length + ' bill' + (todaySales.length === 1 ? '' : 's') + ' today');
    setText('kpiProducts', summary.totalProducts);
    setText('kpiProductsNote', 'Active products');
    setText('kpiLow', summary.lowStockCount);
    setText('kpiLowNote', summary.lowStockCount ? 'Need restocking' : 'All well stocked');
    setText('thresholdText', 'Products with stock ≤ ' + summary.lowStockThreshold);
}

// ----- Revenue chart: last 7 days -----
function renderRevenueChart(sales) {
    const labels = [];
    const totals = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const key = dayKey(day);
        labels.push(i === 0 ? 'Today' : day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
        totals.push(sales
            .filter(s => dayKey(new Date(s.saleDate)) === key)
            .reduce((sum, s) => sum + Number(s.totalAmount), 0));
    }
    setText('weekTotal', moneyShort(totals.reduce((a, b) => a + b, 0)) + ' earned this week');

    const ctx = document.getElementById('revenueChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.28)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: totals,
                borderColor: '#4f46e5',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4f46e5',
                pointBorderWidth: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: c => ' ' + money(c.parsed.y) } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b' } },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: '#eef1f6' },
                    ticks: { color: '#64748b', callback: v => moneyShort(v) }
                }
            }
        }
    });
}

// ----- Category doughnut chart -----
function renderCategoryChart(sales) {
    const byCategory = {};
    sales.forEach(s => s.items.forEach(item => {
        const cat = item.product.category;
        byCategory[cat] = (byCategory[cat] || 0) + Number(item.subtotal);
    }));
    const categories = Object.keys(byCategory);

    if (categories.length === 0) {
        document.getElementById('categoryChartBox').innerHTML =
            emptyState('pie-chart', 'No sales yet', '<div class="small">Create a bill to see this chart</div>');
        return;
    }

    new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: categories.map(c => byCategory[c]),
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, color: '#334155' } },
                tooltip: { callbacks: { label: c => ' ' + c.label + ': ' + money(c.parsed) } }
            }
        }
    });
}

// ----- Top selling products -----
function renderTopProducts(sales) {
    const totals = {};
    sales.forEach(s => s.items.forEach(item => {
        const p = item.product;
        if (!totals[p.id]) totals[p.id] = { product: p, units: 0, revenue: 0 };
        totals[p.id].units += item.quantity;
        totals[p.id].revenue += Number(item.subtotal);
    }));
    const top = Object.values(totals).sort((a, b) => b.units - a.units).slice(0, 5);
    const box = document.getElementById('topProducts');

    if (top.length === 0) {
        box.innerHTML = emptyState('trophy', 'No sales yet');
        return;
    }
    const maxUnits = top[0].units;
    box.innerHTML = top.map(t => `
        <div class="mb-3">
            <div class="d-flex align-items-center gap-3 mb-2">
                ${productAvatar(t.product)}
                <div class="flex-grow-1 min-w-0">
                    <div class="item-name text-truncate">${escapeHtml(t.product.name)}</div>
                    <div class="item-sub">${t.units} units sold</div>
                </div>
                <div class="fw-bold">${moneyShort(t.revenue)}</div>
            </div>
            <div class="level"><span style="width: ${(t.units / maxUnits) * 100}%; background: var(--primary)"></span></div>
        </div>`).join('');
}

// ----- Low stock list -----
function renderLowStock(products, threshold) {
    const box = document.getElementById('lowStockList');
    if (products.length === 0) {
        box.innerHTML = emptyState('check2-circle', 'All products are well stocked');
        return;
    }
    box.innerHTML = products.slice(0, 5).map(p => {
        const percent = Math.max(4, (p.quantity / threshold) * 100);
        const color = p.quantity === 0 ? 'var(--danger)' : 'var(--warning)';
        return `
        <div class="mb-3">
            <div class="d-flex align-items-center gap-3 mb-2">
                ${productAvatar(p)}
                <div class="flex-grow-1 min-w-0">
                    <div class="item-name text-truncate">${escapeHtml(p.name)}</div>
                    <div class="item-sub">${escapeHtml(p.category)}</div>
                </div>
                <span class="chip ${p.quantity === 0 ? 'tone-danger' : 'tone-warning'}">
                    ${p.quantity === 0 ? 'Out of stock' : p.quantity + ' left'}
                </span>
            </div>
            <div class="level"><span style="width: ${Math.min(100, percent)}%; background: ${color}"></span></div>
        </div>`;
    }).join('');
}

// ----- Recent sales list -----
function renderRecentSales(sales) {
    const box = document.getElementById('recentSales');
    if (sales.length === 0) {
        box.innerHTML = emptyState('receipt', 'No sales yet', '<div class="small"><a href="billing.html">Create the first bill</a></div>');
        return;
    }
    box.innerHTML = sales.map(s => {
        const units = s.items.reduce((sum, i) => sum + i.quantity, 0);
        return `
        <a href="invoice.html?id=${s.id}" class="d-flex align-items-center gap-3 mb-3 text-reset">
            <div class="avatar tone-success"><i class="bi bi-receipt"></i></div>
            <div class="flex-grow-1">
                <div class="item-name">${invoiceNo(s.id)}</div>
                <div class="item-sub">${formatDate(s.saleDate)} &middot; ${units} item${units === 1 ? '' : 's'}</div>
            </div>
            <div class="fw-bold">${money(s.totalAmount)}</div>
        </a>`;
    }).join('');
}

// ----- helpers -----
function dayKey(date) {
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
}

function setText(id, text) {
    document.getElementById(id).textContent = text;
}

loadDashboard();
