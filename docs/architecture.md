# Architecture

```
Browser (HTML + JS)  --fetch() JSON-->  Controller  -->  Service  -->  Repository  -->  MySQL
                     <---- JSON -------             (business logic)  (Spring Data JPA)
```

BillEase is split into two independent parts:

- **backend/** is a Spring Boot REST API. It holds all the business rules and is the only part that talks to MySQL.
- **frontend/** is plain HTML, CSS and JavaScript. It only talks to the backend through `/api/...` URLs. The backend address is set once, in `API_BASE` at the top of `frontend/assets/js/core/api.js`.

`WebConfig.java` allows calls from other addresses (CORS, for Live Server) and also serves the frontend folder at `http://localhost:8080`. Opening `http://localhost:8080/` shows the public home page (`index.html`).

## Backend packages (`com.billease`)

The code is grouped **by feature**: everything about products is in `product/`, everything about sales in `sale/`. Inside each feature the classes still follow the usual layers.

| Package | Classes | Job |
|---|---|---|
| `product/` | `Product`, `ProductRepository`, `ProductService`, `ProductController` | Products and stock |
| `sale/` | `Sale`, `SaleItem`, `SaleRequest`, `SaleRepository`, `SaleService`, `SaleController` | Bills, invoices and sales history |
| `dashboard/` | `DashboardController` | Summary numbers for the dashboard (uses the product and sale services) |
| `auth/` | `User`, `UserSession`, `UserRepository`, `UserSessionRepository`, `AuthService`, `AuthController`, `AuthInterceptor`, `SignupRequest`, `LoginRequest`, `AuthResponse` | Accounts, log in / log out, and the login check on every API call |
| `common/config/` | `WebConfig`, `DataSeeder` | CORS, the login check on `/api/**`, serving the frontend, sample data on first run |
| `common/exception/` | `GlobalExceptionHandler`, `BadRequestException`, `ResourceNotFoundException`, `UnauthorizedException` | Turns errors into JSON `{ "message": ... }` with status 400/401/404 |

| Layer | Example | Job |
|---|---|---|
| Entity | `Product`, `Sale`, `SaleItem` | Java classes mapped to tables |
| Repository | `ProductRepository` | Database operations. Spring writes the SQL from method names |
| Service | `SaleService` | Business rules: stock checks, totals, soft delete, transactions |
| Controller | `SaleController` | REST endpoints that receive and return JSON |
| DTO | `SaleRequest` | The JSON the billing page sends |

## Frontend files

Pages are in `frontend/pages/`; scripts and styles are in `frontend/assets/`.

| Page | Script (`assets/js/pages/`) | Uses API |
|---|---|---|
| `../index.html` (home) | `landing.js` | none |
| `login.html`, `signup.html` | `auth.js` | `POST /api/auth/login`, `POST /api/auth/signup` |
| `dashboard.html` | `dashboard.js` | `GET /api/dashboard` |
| `products.html` | `products.js` | `GET/POST/PUT/DELETE /api/products` |
| `stock.html` | `stock.js` | `GET /api/products`, `/low-stock`, `PUT /{id}/stock` |
| `billing.html` | `billing.js` | `GET /api/products`, `POST /api/sales` |
| `invoice.html` | `invoice.js` | `GET /api/sales/{id}` |
| `sales.html` | `sales.js` | `GET /api/sales` |

Every page loads the shared scripts in `assets/js/core/` first, in this order:

| File | Holds |
|---|---|
| `api.js` | `API_BASE`, the `api()` fetch helper, and the login token (`getToken`, `getUser`, `saveSession`, `clearSession`, `goToLogin`) |
| `format.js` | Money and date formatting, `invoiceNo()`, `escapeHtml()` |
| `ui.js` | Avatars and chips, empty states, toast notifications (`showAlert`), the confirm dialog (`confirmDialog`), the modal open/close helper (`createModal`) |
| `layout.js` | The login check, `STORE_NAME`, the sidebar with the user and a log out button, and the top bar (`renderLayout`, `logout`) |

Each app page only declares `<body data-page="..." data-title="...">` and its own content. The home, log in and sign up pages load only `api.js` (plus `format.js` on the home page) and have no sidebar.

The styles are plain CSS (no framework) in `assets/css/`. Every page loads `base.css` (color tokens in `:root`, page defaults, a 12-column grid, utility classes), `layout.css` (sidebar, top bar, print rules) and `components.css` (cards, tables, chips, buttons, forms, toasts, modals). The billing and invoice pages also load `billing.css` and `invoice.css`. The home page uses `landing.css`, and the log in / sign up pages use `auth.css` (without `layout.css`). The dashboard charts use **Chart.js** (loaded from a CDN).

## How logging in works

1. **Sign up / log in:** `auth.js` sends `POST /api/auth/signup` or `/api/auth/login`. `AuthService` checks the password against the BCrypt hash in `users`, creates a random 43-character token, saves it in `user_sessions` (valid 7 days) and returns `{ token, user }`.
2. **Browser:** `saveSession()` keeps the token and user in `localStorage`, then goes to the dashboard (or the page in `?next=`).
3. **Every API call:** `api()` adds `Authorization: Bearer <token>`. On the server, `AuthInterceptor` runs before every `/api/**` controller (except sign up and log in), looks the token up, and either stores the user on the request or stops with **401**.
4. **Logged out or expired:** `layout.js` sends visitors with no token to `login.html?next=<page>`; `api()` does the same when the server answers 401.
5. **Log out:** `POST /api/auth/logout` deletes the `user_sessions` row, `clearSession()` empties `localStorage`, and the browser goes back to the home page.

## How a sale works (data flow)

1. **Browser:** `billing.js` keeps the bill in a JavaScript array and shows live totals.
2. **Generate Bill:** it sends only `productId` + `quantity` to `POST /api/sales`. Prices never come from the browser.
3. **Controller:** `SaleController` turns the JSON into a `SaleRequest` and calls `SaleService.createSale()`.
4. **Service** (`@Transactional`), for each line:
   - checks that the quantity is greater than 0
   - loads the product and **locks its row** (`SELECT ... FOR UPDATE`)
   - checks that enough stock is available
   - reduces the stock
   - creates a `SaleItem` with the current price and `subtotal = price × quantity`
5. It adds up the grand total and saves the `Sale`. Because of `cascade = ALL`, the items are saved too.
6. **Transaction:** if any line fails, an exception is thrown and MySQL **rolls back everything**: no sale is saved and no stock changes.
7. The browser goes to `invoice.html?id=<saleId>`, which shows the printable invoice.

## Business rules and where they are enforced

| Rule | Where |
|---|---|
| Price/quantity cannot be negative | `@DecimalMin`/`@Min` in `Product` + `@Valid` in the controller; also HTML `min="0"` |
| Name and category required | `@NotBlank` in `Product` |
| Sale quantity must be > 0 | `SaleService.createSaleItem()` |
| No sale if stock is too low | `SaleService.createSaleItem()` |
| Total uses the database price | `SaleService` reads `product.getPrice()` |
| Stock and sale saved together | `@Transactional` on `createSale()` |
| No overselling when two bills are made at once | `@Lock(PESSIMISTIC_WRITE)` in `ProductRepository.findActiveByIdForUpdate()` |
| Old invoices keep the old price | `sale_items.price` column |
| Delete doesn't break history | Soft delete (`active = false`) in `ProductService.deleteProduct()` |
| Only logged-in users reach the shop data | `AuthInterceptor` on `/api/**` (registered in `WebConfig`); `layout.js` redirects pages |
| Passwords are never stored or returned | BCrypt hash in `AuthService`; `@JsonIgnore` on `User.passwordHash` |
| One account per email | `existsByEmail()` check in `AuthService.signup()` + UNIQUE `users.email`; emails saved in lower case |
| Log in errors don't reveal which emails exist | Same "Invalid email or password" message in `AuthService.login()` |
