// ===== Formatting money, dates and text =====

/** 1234.5 -> "₹1,234.50" */
function money(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/** 1234.5 -> "₹1,235" (for charts and big numbers) */
function moneyShort(value) {
    return '₹' + Math.round(Number(value || 0)).toLocaleString('en-IN');
}

/** "2026-10-23T14:05:00" -> "23 Oct 2026, 2:05 pm" */
function formatDate(value) {
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
}

/** "2026-10-23T14:05:00" -> "23 Oct 2026" */
function formatDay(value) {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "2026-10-23T14:05:00" -> "2:05 pm" */
function formatTime(value) {
    return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Sale id 7 -> "INV-0007" */
function invoiceNo(id) {
    return 'INV-' + String(id).padStart(4, '0');
}

/** Stops user text (like product names) from being read as HTML. */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}
