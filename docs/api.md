# REST API

Base URL: `http://localhost:8080/api`

| Method | URL | Purpose | Success |
|---|---|---|---|
| GET | `/products` | All products | 200 |
| GET | `/products?search=pen` | Search by name or ID | 200 |
| GET | `/products/{id}` | One product | 200 / 404 |
| GET | `/products/low-stock` | Products with stock ≤ 10 | 200 |
| POST | `/products` | Add product | 201 / 400 |
| PUT | `/products/{id}` | Edit product | 200 / 400 / 404 |
| PUT | `/products/{id}/stock?add=20` | Add stock | 200 / 400 |
| DELETE | `/products/{id}` | Soft-delete product | 204 / 404 |
| POST | `/sales` | Create a bill (reduces stock) | 201 / 400 |
| GET | `/sales` | Sales history, newest first | 200 |
| GET | `/sales/{id}` | One sale with its items (invoice) | 200 / 404 |
| GET | `/dashboard` | Dashboard summary | 200 |

## Thunder Client collection

In VS Code, open **Thunder Client → Collections → ☰ menu → Import** and choose `api-tests/billease.postman_collection.json`. It contains every request above, plus two that are expected to fail, so you can show the validation and stock errors.

## Sample requests

**Add a product:** `POST /api/products`
```json
{ "name": "Green Tea 100g", "category": "Grocery", "price": 120.00, "quantity": 30 }
```

**Create a bill:** `POST /api/sales`
```json
{ "items": [ { "productId": 1, "quantity": 2 }, { "productId": 2, "quantity": 5 } ] }
```
Response `201 Created`:
```json
{
  "id": 1,
  "saleDate": "2026-10-23T17:42:23",
  "totalAmount": 170.00,
  "items": [
    { "id": 1, "product": { "id": 1, "name": "Notebook A4", ... }, "quantity": 2, "price": 60.00, "subtotal": 120.00 },
    { "id": 2, "product": { "id": 2, "name": "Ball Pen (Blue)", ... }, "quantity": 5, "price": 10.00, "subtotal": 50.00 }
  ]
}
```

## Errors

Every error has the same shape:

```json
{ "message": "Not enough stock for Wireless Mouse. Available: 1, requested: 5" }
```

| Status | When |
|---|---|
| 400 Bad Request | Validation failed, not enough stock, quantity ≤ 0, empty bill, broken JSON |
| 404 Not Found | Product or sale ID does not exist (or the product was deleted) |
| 500 Internal Server Error | Unexpected error (details in the backend console) |
