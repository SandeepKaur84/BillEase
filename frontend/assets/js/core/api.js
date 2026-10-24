// ===== Talking to the backend (loaded first on every page) =====

// Address of the Spring Boot backend.
// If the page is served by the backend itself (port 8080) we can use a relative URL,
// otherwise (Live Server, or opening the file directly) we call the backend directly.
const API_BASE = location.port === '8080' ? '/api' : 'http://localhost:8080/api';

// ----- Login session (kept in the browser's localStorage) -----

const TOKEN_KEY = 'billease.token';
const USER_KEY = 'billease.user';

/** The login token, or null when nobody is logged in. */
function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

/** The logged-in user { id, name, email }, or null. */
function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (e) {
        return null;
    }
}

/** Called after a successful login or sign-up. */
function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch (e) {
        // storage blocked: nothing to clear
    }
}

/** "products.html?x=1" for the page we are on, so login can bring us back here. */
function currentPage() {
    return location.pathname.split('/').pop() + location.search;
}

/** Sends the user to the login page, remembering where they were. */
function goToLogin() {
    location.replace('login.html?next=' + encodeURIComponent(currentPage()));
}

/**
 * Calls the Spring Boot REST API and returns the JSON response.
 * The login token is sent with every call. If the server returns an error,
 * it throws an Error with the server's message. If the login has expired
 * (HTTP 401), it goes to the login page.
 */
async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }

    let response;
    try {
        response = await fetch(API_BASE + path, { ...options, headers });
    } catch (e) {
        throw new Error('Cannot reach the server. Is the backend running?');
    }
    if (response.status === 204) {
        return null; // "No Content", e.g. after DELETE
    }
    const data = await response.json().catch(() => null);
    if (response.status === 401 && !path.startsWith('/auth/')) {
        clearSession();
        goToLogin();
    }
    if (!response.ok) {
        throw new Error(data && data.message ? data.message : 'Request failed (' + response.status + ')');
    }
    return data;
}
