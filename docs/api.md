# REST API

Base URL: `http://localhost:8080/api`

## Logging in

Every endpoint except **sign up** and **log in** needs a login token. Sign up or log in to get one, then send it with each request:

```
Authorization: Bearer <token>
```

Without a valid token the server answers `401 { "message": "Please log in to continue" }`. A token lasts 7 days (`app.session-days`) or until you log out.

| Method | URL | Purpose | Success |
|---|---|---|---|
| POST | `/auth/signup` | Create an account, returns a token | 201 / 400 |
| POST | `/auth/login` | Log in, returns a token | 200 / 401 |
| GET | `/auth/me` | The logged-in user | 200 / 401 |
| POST | `/auth/logout` | End this login (the token stops working) | 204 |

## Shop data (login required)

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

In VS Code, open **Thunder Client → Collections → ☰ menu → Import** and choose `api-tests/billease.postman_collection.json`. It contains every request above, plus three that are expected to fail, so you can show the validation, stock and wrong-password errors.

Run **Auth → Sign up** (or **Log in**) first. Every other request sends `Authorization: Bearer {{token}}`. Postman saves the token into the `token` variable automatically; in Thunder Client, copy `token` from the response into the collection's `token` variable.

## Sample requests

**Sign up:** `POST /api/auth/signup`
```json
{ "name": "Ravi Kumar", "email": "ravi@example.com", "password": "secret123" }
```
Response `201 Created` (log in returns the same shape with `200 OK`):
```json
{
  "token": "pX3k...43 random characters...",
  "user": { "id": 1, "name": "Ravi Kumar", "email": "ravi@example.com", "createdAt": "2026-10-24T12:49:30" }
}
```
The password and its hash are never sent back.

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
| 400 Bad Request | Validation failed, not enough stock, quantity ≤ 0, empty bill, broken JSON, email already registered |
| 401 Unauthorized | Not logged in, token unknown or expired, or wrong email/password at login |
| 404 Not Found | Product or sale ID does not exist (or the product was deleted) |
| 500 Internal Server Error | Unexpected error (details in the backend console) |
