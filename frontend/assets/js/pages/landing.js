// Home page (index.html):
// 1. If the visitor is already logged in, swap "Log in / Sign up" for a button that opens the app.
// 2. Sections fade in as they scroll into view.
// 3. The top bar gets a shadow once the page is scrolled.

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

// ----- Reveal sections on scroll -----
// Elements marked data-reveal start hidden (see landing.css) and get .in-view
// the first time they come on screen. Old browsers just show everything.
if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

// ----- Shadow under the top bar after scrolling -----
const nav = document.querySelector('.site-nav');
const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();
