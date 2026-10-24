// Log in and sign up pages: <form id="authForm" data-mode="login | signup">

const form = document.getElementById('authForm');
const mode = form.dataset.mode;
const formError = document.getElementById('formError');

/**
 * Where to go after logging in: the page the user was sent away from
 * (login.html?next=products.html), or the dashboard.
 * Only plain page names are accepted, never another website's address.
 */
function nextPage() {
    const next = new URLSearchParams(location.search).get('next');
    return next && /^[a-z]+\.html(\?[\w=&-]*)?$/.test(next) ? next : 'dashboard.html';
}

// Already logged in? Go straight into the app.
if (getToken()) {
    location.replace(nextPage());
}

// Keep ?next=... when switching between log in and sign up
const switchLink = document.getElementById('switchLink');
switchLink.href += location.search;

// ----- Show / hide password -----
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.querySelector('i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
        button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
});

// ----- Checks in the browser before calling the server -----
function validateForm() {
    const checks = {
        name: input => input.value.trim() !== '',
        email: input => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()),
        password: input => mode === 'login' ? input.value !== '' : input.value.length >= 6,
        confirmPassword: input => input.value !== '' && input.value === document.getElementById('password').value
    };
    let valid = true;
    for (const [id, check] of Object.entries(checks)) {
        const input = document.getElementById(id);
        if (!input) continue; // the login form has no name / confirm fields
        const ok = check(input);
        input.classList.toggle('is-invalid', !ok);
        if (!ok && valid) input.focus();
        if (!ok) valid = false;
    }
    return valid;
}

// Fix the red border as soon as the user corrects a field
form.addEventListener('input', event => event.target.classList.remove('is-invalid'));

function showError(message) {
    formError.textContent = message;
    formError.classList.remove('d-none');
}

// ----- Submit -----
form.addEventListener('submit', async event => {
    event.preventDefault();
    formError.classList.add('d-none');
    if (!validateForm()) return;

    const body = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };
    if (mode === 'signup') {
        body.name = document.getElementById('name').value.trim();
    }

    const button = document.getElementById('submitBtn');
    const label = button.textContent;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Please wait...';

    try {
        const result = await api('/auth/' + mode, { method: 'POST', body: JSON.stringify(body) });
        saveSession(result.token, result.user);
        location.href = nextPage();
    } catch (error) {
        showError(error.message);
        button.disabled = false;
        button.textContent = label;
    }
});
