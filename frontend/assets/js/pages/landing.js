// Home page (index.html): if the visitor is already logged in,
// swap "Log in / Sign up" for a button that opens the app.

if (getToken()) {
    const user = getUser() || {};
    const firstName = escapeHtml((user.name || '').split(' ')[0]);

    document.getElementById('navActions').innerHTML =
        '<a href="pages/dashboard.html" class="btn btn-primary">Open dashboard</a>';

    document.getElementById('heroActions').innerHTML = `
        <a href="pages/dashboard.html" class="btn btn-primary btn-lg">
            ${firstName ? 'Welcome back, ' + firstName : 'Open dashboard'}<i class="bi bi-arrow-right ms-2"></i>
        </a>
        <a href="pages/billing.html" class="btn btn-light btn-lg">New bill</a>`;

    const cta = document.getElementById('ctaBtn');
    cta.href = 'pages/dashboard.html';
    cta.textContent = 'Open dashboard';
}
