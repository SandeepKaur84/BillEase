// ===== Sidebar + top bar, built on every page =====

// Shown on invoices
const STORE_NAME = 'My Store';

// The app pages are only for logged-in users
if (!getToken()) {
    goToLogin();
}

/**
 * Every page has <body data-page="..." data-title="..." data-subtitle="...">
 * and a <main class="main"> with its content. This builds the sidebar and top bar.
 */
function renderLayout() {
    const page = document.body.dataset.page;
    const user = getUser() || {};
    const sections = [
        { title: 'Overview', links: [
            { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: 'grid-1x2' }
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
        <a href="dashboard.html" class="brand">
            <img class="brand-logo" src="../assets/img/logo.svg" alt="">
            <div>BillEase<small>Inventory &amp; Billing</small></div>
        </a>
        <nav>${nav}</nav>
        <div class="sidebar-footer">
            <div class="avatar">${escapeHtml((user.name || '?').trim().charAt(0).toUpperCase())}</div>
            <div class="min-w-0 flex-grow-1">
                <div class="fw-semibold text-truncate">${escapeHtml(user.name || '')}</div>
                <small class="text-truncate">${escapeHtml(user.email || '')}</small>
            </div>
            <button class="logout-btn" type="button" title="Log out" aria-label="Log out">
                <i class="bi bi-box-arrow-right"></i>
            </button>
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

    sidebar.querySelector('.logout-btn').addEventListener('click', logout);
}

/** Ends the session on the server, forgets it in the browser, back to the home page. */
async function logout() {
    try {
        await api('/auth/logout', { method: 'POST' });
    } catch (e) {
        // already logged out on the server, or server down: still log out here
    }
    clearSession();
    location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', renderLayout);
