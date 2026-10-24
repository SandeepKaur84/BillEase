// Product Management page: add, edit, delete, search and filter products

const LOW_STOCK = 10;
const form = document.getElementById('productForm');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
// Put the cursor in the first field when the modal opens
const modal = createModal(document.getElementById('productModal'), {
    onShown: () => document.getElementById('name').focus()
});
let products = [];

// ----- Load and show products -----
async function loadProducts() {
    try {
        const search = searchInput.value.trim();
        const query = search ? '?search=' + encodeURIComponent(search) : '';
        products = await api('/products' + query);
        if (!search) fillCategories();
        renderProducts();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function renderProducts() {
    const category = categoryFilter.value;
    const list = category ? products.filter(p => p.category === category) : products;
    const tbody = document.getElementById('productTable');

    document.getElementById('productCount').textContent =
        list.length + ' product' + (list.length === 1 ? '' : 's');

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">${emptyState('box-seam', 'No products found',
            '<div class="small">Try a different search, or add a new product</div>')}</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(p => `
        <tr>
            <td>
                <div class="item-cell">
                    ${productAvatar(p)}
                    <div>
                        <div class="item-name">${escapeHtml(p.name)}</div>
                        <div class="item-sub">ID #${p.id}</div>
                    </div>
                </div>
            </td>
            <td>${categoryChip(p.category)}</td>
            <td class="text-end fw-semibold">${money(p.price)}</td>
            <td>${stockChip(p.quantity)}</td>
            <td class="text-end text-muted">${money(p.price * p.quantity)}</td>
            <td class="text-end text-nowrap">
                <button class="btn-icon" onclick="openEdit(${p.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon danger ms-1" onclick="deleteProduct(${p.id})" title="Delete"><i class="bi bi-trash3"></i></button>
            </td>
        </tr>`).join('');
}

function stockChip(quantity) {
    if (quantity === 0) return '<span class="chip chip-dot tone-danger">Out of stock</span>';
    if (quantity <= LOW_STOCK) return `<span class="chip chip-dot tone-warning">${quantity} &middot; Low</span>`;
    return `<span class="chip chip-dot tone-success">${quantity} in stock</span>`;
}

// Fill the category filter and the suggestions in the form
function fillCategories() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    const selected = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">All categories</option>' +
        categories.map(c => `<option ${c === selected ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    document.getElementById('categoryList').innerHTML =
        categories.map(c => `<option value="${escapeHtml(c)}">`).join('');
}

// ----- Open the modal -----
document.getElementById('addBtn').addEventListener('click', () => {
    resetForm();
    modal.show();
});

function openEdit(id) {
    const p = products.find(item => item.id === id);
    resetForm();
    document.getElementById('productId').value = p.id;
    document.getElementById('name').value = p.name;
    document.getElementById('category').value = p.category;
    document.getElementById('price').value = p.price;
    document.getElementById('quantity').value = p.quantity;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('modalSubtitle').textContent = 'Product ID #' + p.id;
    document.getElementById('saveBtn').textContent = 'Update Product';
    modal.show();
}

function resetForm() {
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('modalSubtitle').textContent = 'Fill in the product details';
    document.getElementById('saveBtn').textContent = 'Save Product';
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// ----- Save (add or update) -----
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const id = document.getElementById('productId').value;
    const product = {
        name: document.getElementById('name').value.trim(),
        category: document.getElementById('category').value.trim(),
        price: Number(document.getElementById('price').value),
        quantity: Number(document.getElementById('quantity').value)
    };

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    try {
        if (id) {
            await api('/products/' + id, { method: 'PUT', body: JSON.stringify(product) });
            showAlert(product.name + ' updated');
        } else {
            await api('/products', { method: 'POST', body: JSON.stringify(product) });
            showAlert(product.name + ' added');
        }
        modal.hide();
        loadProducts();
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        saveBtn.disabled = false;
    }
});

// Checks the form in the browser before sending it to the server
function validateForm() {
    let valid = true;
    ['name', 'category', 'price', 'quantity'].forEach(field => {
        const input = document.getElementById(field);
        let ok = input.value.trim() !== '' && input.checkValidity();
        if (field === 'quantity' && ok) ok = Number.isInteger(Number(input.value));
        input.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
    });
    return valid;
}

// ----- Delete -----
async function deleteProduct(id) {
    const p = products.find(item => item.id === id);
    const ok = await confirmDialog({
        title: 'Delete product?',
        message: '"' + p.name + '" will be removed from the list. Old sales and invoices are kept.',
        confirmText: 'Delete',
        danger: true
    });
    if (!ok) return;

    try {
        await api('/products/' + id, { method: 'DELETE' });
        showAlert(p.name + ' deleted');
        loadProducts();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ----- Search (wait until the user stops typing) and filter -----
let searchTimer;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadProducts, 300);
});
categoryFilter.addEventListener('change', renderProducts);

loadProducts();
