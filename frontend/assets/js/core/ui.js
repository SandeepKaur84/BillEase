// ===== Shared UI pieces: avatars, chips, empty states, toasts, dialogs =====

// ----- Small HTML builders -----

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
        <button type="button" class="btn-close mt-1" aria-label="Close"></button>`;
    area.appendChild(toast);

    const close = () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('.btn-close').addEventListener('click', close);
    setTimeout(close, type === 'danger' ? 6000 : 3500);
}

// ----- Confirm dialog (nicer than window.confirm) -----

/** Shows a modal and resolves to true (confirm) or false (cancel). */
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
                            <button type="button" class="btn btn-light px-4" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} px-4" data-confirm>
                                ${escapeHtml(confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        const element = wrapper.firstElementChild;
        document.body.appendChild(element);

        let confirmed = false;
        const modal = createModal(element, {
            onHidden: () => {
                element.remove();
                resolve(confirmed);
            }
        });
        element.querySelector('[data-confirm]').addEventListener('click', () => {
            confirmed = true;
            modal.hide();
        });
        modal.show();
    });
}

// ----- Modal dialogs -----

/**
 * Opens and closes a <div class="modal fade"> with a fade animation.
 * It closes on the Cancel/X buttons (data-dismiss="modal"), a click outside the box, or Escape.
 * onShown runs after it has opened, onHidden after it has closed.
 */
function createModal(element, { onShown, onHidden } = {}) {
    const onKey = event => {
        if (event.key === 'Escape') hide();
    };

    function show() {
        element.classList.add('open');
        document.body.classList.add('modal-open');
        element.offsetWidth; // let the browser draw it once, so the fade-in animates
        element.classList.add('show');
        document.addEventListener('keydown', onKey);
        setTimeout(() => onShown && onShown(), 200);
    }

    function hide() {
        if (!element.classList.contains('show')) return;
        element.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => {
            element.classList.remove('open');
            document.body.classList.remove('modal-open');
            if (onHidden) onHidden();
        }, 200);
    }

    element.addEventListener('click', event => {
        const outside = event.target === element || event.target.classList.contains('modal-dialog');
        if (outside || event.target.closest('[data-dismiss="modal"]')) hide();
    });

    return { show, hide };
}
