// Invoice page: invoice.html?id=5 loads sale 5 from GET /api/sales/5

async function loadInvoice() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) {
        showAlert('No invoice selected', 'warning');
        return;
    }

    try {
        const sale = await api('/sales/' + encodeURIComponent(id));
        const units = sale.items.reduce((sum, item) => sum + item.quantity, 0);

        setText('storeName', STORE_NAME);
        setText('invoiceNo', invoiceNo(sale.id));
        setText('invoiceNoTop', invoiceNo(sale.id));
        setText('invoiceDate', formatDay(sale.saleDate));
        setText('invoiceTime', formatTime(sale.saleDate));
        setText('invoiceUnits', units);
        setText('invoiceSubtotal', money(sale.totalAmount));
        setText('invoiceTotal', money(sale.totalAmount));

        // item.price is the price saved at the time of sale, not today's price
        document.getElementById('invoiceItems').innerHTML = sale.items.map((item, index) => `
            <tr>
                <td class="text-muted">${index + 1}</td>
                <td>
                    <div class="item-name">${escapeHtml(item.product.name)}</div>
                    <div class="item-sub">${escapeHtml(item.product.category)}</div>
                </td>
                <td class="text-end">${money(item.price)}</td>
                <td class="text-end">${item.quantity}</td>
                <td class="text-end fw-semibold">${money(item.subtotal)}</td>
            </tr>`).join('');

        document.getElementById('invoice').classList.remove('d-none');
        document.title = invoiceNo(sale.id) + ' - BillEase';

        // Coming straight from the billing page
        if (params.get('new')) {
            showAlert('Bill ' + invoiceNo(sale.id) + ' saved. Stock updated.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function setText(id, text) {
    document.getElementById(id).textContent = text;
}

loadInvoice();
