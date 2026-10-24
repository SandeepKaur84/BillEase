// ===== Talking to the backend (loaded first on every page) =====

// Address of the Spring Boot backend.
// If the page is served by the backend itself (port 8080) we can use a relative URL,
// otherwise (Live Server, or opening the file directly) we call the backend directly.
const API_BASE = location.port === '8080' ? '/api' : 'http://localhost:8080/api';

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
