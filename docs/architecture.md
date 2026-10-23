# Architecture

```
Browser (HTML + JS)  --fetch() JSON-->  Controller  -->  Service  -->  Repository  -->  MySQL
                     <---- JSON -------             (business logic)  (Spring Data JPA)
```

BillEase is split into two independent parts:

- **backend/** is a Spring Boot REST API. It holds all the business rules and is the only part that talks to MySQL.
- **frontend/** is plain HTML, CSS and JavaScript. It only talks to the backend through `/api/...` URLs. The backend address is set once, in `API_BASE` at the top of `frontend/js/common.js`.

`WebConfig.java` allows calls from other addresses (CORS, for Live Server) and also serves the frontend folder at `http://localhost:8080`.

## Backend layers (`com.billease`)

| Layer | Package | Job |
|---|---|---|
| Entity | `entity/` | Java classes mapped to tables (`Product`, `Sale`, `SaleItem`) |
| Repository | `repository/` | Database operations. Spring writes the SQL from method names |
| Service | `service/` | Business rules: stock checks, totals, soft delete, transactions |
| Controller | `controller/` | REST endpoints that receive and return JSON |
| DTO | `dto/` | `SaleRequest`, the JSON the billing page sends |
| Exception | `exception/` | Turns errors into JSON `{ "message": ... }` with status 400/404 |
| Config | `config/` | CORS, serving the frontend, sample data on first run |

## Frontend files

| Page | Script | Uses API |
|---|---|---|
| `index.html` (Dashboard) | `js/dashboard.js` | `GET /api/dashboard` |
| `products.html` | `js/products.js` | `GET/POST/PUT/DELETE /api/products` |
| `stock.html` | `js/stock.js` | `GET /api/products`, `/low-stock`, `PUT /{id}/stock` |
| `billing.html` | `js/billing.js` | `GET /api/products`, `POST /api/sales` |
| `invoice.html` | `js/invoice.js` | `GET /api/sales/{id}` |
| `sales.html` | `js/sales.js` | `GET /api/sales` |

`js/common.js` is loaded on every page. It holds `API_BASE`, the `api()` fetch helper, money and date formatting, toast notifications (`showAlert`), the confirm dialog (`confirmDialog`) and the sidebar + top bar layout (`renderLayout`). Each page only declares `<body data-page="..." data-title="...">` and its own content.

`css/style.css` is the design system: color tokens in `:root`, the sidebar layout, cards, tables, chips, the billing screen, the invoice and print styles. The dashboard charts use **Chart.js** (loaded from a CDN).

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
