// ===== Shared code used by every page =====

// Address of the Spring Boot backend.
// If the page is served by the backend itself (port 8080) we can use a relative URL,
// otherwise (Live Server, or opening the file directly) we call the backend directly.
const API_BASE = location.port === '8080' ? '/api' : 'http://localhost:8080/api';

const STORE_NAME = 'My Store';

/**
 * Calls the Spring Boot REST API and returns the JSON response.
 * If the server returns an error, it throws an Error with the server's message.
 */
async function api(path, options = {}) {
    let response;
    try {
        response = await fetch(API_BASE + path, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
    } catch (e) {
        throw new Error('Cannot reach the server. Is the backend running?');
    }
    if (response.status === 204) {
        return null; // "No Content", e.g. after DELETE
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data && data.message ? data.message : 'Request failed (' + response.status + ')');
    }
    return data;
}

// ----- Formatting helpers -----

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

/** Same category always gets the same color class (cat-0 ... cat-5). */
function categoryClass(category) {
    let hash = 0;
    for (const ch of String(category || '')) {
        hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
    }
    return 'cat-' + (hash % 6);
}

/** Colored square with the first letter of the product name. */
function productAvatar(product) {
    const letter = escapeHtml((product.name || '?').trim().charAt(0).toUpperCase());
    return `<div class="avatar ${categoryClass(product.category)}">${letter}</div>`;
}

function categoryChip(category) {
    return `<span class="chip chip-dot ${categoryClass(category)}">${escapeHtml(category)}</span>`;
}

/** HTML for an empty table/list. */
function emptyState(icon, title, text = '') {
    return `<div class="empty"><i class="bi bi-${icon}"></i><strong>${title}</strong>${text}</div>`;
}

// ----- Toast notifications -----

/** Shows a small notification in the corner. type: success | danger | warning | info */
function showAlert(message, type = 'success') {
    let area = document.querySelector('.toast-area');
    if (!area) {
        area = document.createElement('div');
        area.className = 'toast-area';
        document.body.appendChild(area);
    }
    const icons = { success: 'check-lg', danger: 'x-lg', warning: 'exclamation-lg', info: 'info-lg' };
    const tones = { success: 'tone-success', danger: 'tone-danger', warning: 'tone-warning', info: 'tone-info' };

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
        <div class="toast-icon ${tones[type]}"><i class="bi bi-${icons[type]}"></i></div>
        <div class="flex-grow-1 pt-1">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-sm mt-1" aria-label="Close"></button>`;
    area.appendChild(toast);

    const close = () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('.btn-close').addEventListener('click', close);
    setTimeout(close, type === 'danger' ? 6000 : 3500);
}

// ----- Confirm dialog (nicer than window.confirm) -----

/** Shows a Bootstrap modal and resolves to true (confirm) or false (cancel). */
function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
    return new Promise(resolve => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 400px">
                    <div class="modal-content text-center">
                        <div class="modal-body pt-4">
                            <div class="confirm-icon ${danger ? 'tone-danger' : 'tone-primary'}">
                                <i class="bi bi-${danger ? 'trash3' : 'question-lg'}"></i>
                            </div>
                            <h5 class="fw-bold mb-2">${escapeHtml(title)}</h5>
                            <p class="text-muted mb-0">${escapeHtml(message)}</p>
                        </div>
                        <div class="modal-footer justify-content-center gap-2">
                            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} px-4" data-confirm>
                                ${escapeHtml(confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        const element = wrapper.firstElementChild;
        document.body.appendChild(element);

        const modal = new bootstrap.Modal(element);
        let confirmed = false;
        element.querySelector('[data-confirm]').addEventListener('click', () => {
            confirmed = true;
            modal.hide();
        });
        element.addEventListener('hidden.bs.modal', () => {
            element.remove();
            resolve(confirmed);
        });
        modal.show();
    });
}

// ----- Page layout: sidebar + top bar -----

/**
 * Every page has <body data-page="..." data-title="..." data-subtitle="...">
 * and a <main class="main"> with its content. This builds the sidebar and top bar.
 */
function renderLayout() {
    const page = document.body.dataset.page;
    const sections = [
        { title: 'Overview', links: [
            { id: 'dashboard', href: 'index.html', label: 'Dashboard', icon: 'grid-1x2' }
        ] },
        { title: 'Inventory', links: [
            { id: 'products', href: 'products.html', label: 'Products', icon: 'box-seam' },
            { id: 'stock', href: 'stock.html', label: 'Stock', icon: 'boxes' }
        ] },
        { title: 'Sales', links: [
            { id: 'billing', href: 'billing.html', label: 'New Bill', icon: 'cart3' },
            { id: 'sales', href: 'sales.html', label: 'Sales History', icon: 'receipt' }
        ] }
    ];

    const nav = sections.map(section => `
        <div class="nav-section">${section.title}</div>
        ${section.links.map(link => `
            <a class="side-link ${link.id === page ? 'active' : ''}" href="${link.href}">
                <i class="bi bi-${link.icon}"></i>${link.label}
            </a>`).join('')}
    `).join('');

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar no-print';
    sidebar.innerHTML = `
        <a href="index.html" class="brand">
            <div class="brand-logo"><i class="bi bi-receipt-cutoff"></i></div>
            <div>BillEase<small>Inventory &amp; Billing</small></div>
        </a>
        <nav>${nav}</nav>
        <div class="sidebar-footer">
            <div class="avatar"><i class="bi bi-shop"></i></div>
            <div>
                <div class="fw-semibold">${escapeHtml(STORE_NAME)}</div>
                <small>Administrator</small>
            </div>
        </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay no-print';

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const topbar = document.createElement('header');
    topbar.className = 'topbar no-print';
    topbar.innerHTML = `
        <button class="menu-btn" type="button" aria-label="Menu"><i class="bi bi-list"></i></button>
        <div>
            <h1>${escapeHtml(document.body.dataset.title || '')}</h1>
            <p>${escapeHtml(document.body.dataset.subtitle || '')}</p>
        </div>
        <div class="topbar-right">
            <div class="date-chip"><i class="bi bi-calendar3"></i>${today}</div>
            ${page !== 'billing' ? `
            <a href="billing.html" class="btn btn-primary">
                <i class="bi bi-plus-lg"></i><span class="ms-1">New Bill</span>
            </a>` : ''}
        </div>`;

    const main = document.querySelector('.main');
    main.prepend(topbar);
    document.body.prepend(overlay);
    document.body.prepend(sidebar);

    // Mobile: open/close the sidebar
    const toggle = open => {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('show', open);
    };
    topbar.querySelector('.menu-btn').addEventListener('click', () => toggle(true));
    overlay.addEventListener('click', () => toggle(false));
}

document.addEventListener('DOMContentLoaded', renderLayout);
