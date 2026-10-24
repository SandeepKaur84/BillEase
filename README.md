# BillEase: Inventory and Billing System

**BillEase** ("billing made easy") is a beginner-friendly Java full-stack web app for small shops. It manages products and stock, creates bills, prints invoices and keeps a sales history.

**Stack:** Java 17 · Spring Boot 3.3 · Spring Data JPA · MySQL 8 · HTML/CSS/JavaScript (no CSS framework) · Maven

## Features

| Module | What it does |
|---|---|
| Product Management | Add, edit, delete (soft delete) and search products by name or ID, with validation |
| Stock Management | Stock levels, low-stock warnings, add stock; stock drops automatically after each sale |
| Billing | Pick products, set quantities, live line totals and grand total; overselling is blocked |
| Invoice | Printable invoice for every sale |
| Sales History | All past bills with totals; old bills keep the price charged at the time |
| Dashboard | Total products, low-stock items, number of sales, revenue, recent sales |

## Project structure

```
BillEase/
├── backend/                 Spring Boot REST API (Java)
│   ├── mvnw.cmd, mvnw       Maven Wrapper (no Maven install needed)
│   ├── pom.xml              Dependencies
│   └── src/
│       ├── main/java/com/billease/          one package per feature
│       │   ├── BillEaseApplication.java     main(): start here
│       │   ├── product/       Product (entity), ProductRepository, ProductService, ProductController
│       │   ├── sale/          Sale + SaleItem (entities), SaleRequest (DTO), SaleRepository,
│       │   │                  SaleService, SaleController
│       │   ├── dashboard/     DashboardController
│       │   └── common/
│       │       ├── config/    WebConfig (CORS + serves frontend), DataSeeder (sample data)
│       │       └── exception/ GlobalExceptionHandler + custom exceptions
│       ├── main/resources/application.properties   MySQL settings
│       └── test/java/com/billease/                 JUnit tests (H2 in-memory DB)
│           ├── product/ProductControllerTest.java
│           └── sale/SaleServiceTest.java
│
├── frontend/                HTML + CSS + JavaScript (no framework)
│   ├── index.html           Entry point: redirects to pages/dashboard.html
│   ├── pages/
│   │   ├── dashboard.html   Dashboard
│   │   ├── products.html    Product Management
│   │   ├── stock.html       Stock Management
│   │   ├── billing.html     Billing
│   │   ├── invoice.html     Invoice
│   │   └── sales.html       Sales History
│   └── assets/
│       ├── css/
│       │   ├── base.css         colors, page defaults, grid, utility classes
│       │   ├── layout.css       sidebar, top bar, content area
│       │   ├── components.css   cards, tables, chips, buttons, forms, toasts, modals
│       │   ├── billing.css      billing page only
│       │   └── invoice.css      invoice page only (+ print styles)
│       └── js/
│           ├── core/            loaded on every page, in this order:
│           │   ├── api.js       API_BASE + api() fetch helper
│           │   ├── format.js    money, dates, invoice numbers, escapeHtml
│           │   ├── ui.js        avatars, chips, toasts, confirm dialog, createModal
│           │   └── layout.js    sidebar + top bar
│           └── pages/           one script per page (dashboard.js, products.js, ...)
│
├── database/                schema.sql, sample-data.sql
├── api-tests/               billease.postman_collection.json (Thunder Client / Postman)
└── docs/                    Detailed documentation (see below)
```

## Quick start

1. Install **JDK 17+** ([Temurin](https://adoptium.net/), tick "Set JAVA_HOME") and make sure **MySQL 8** is running.
2. Put your MySQL root password in `backend/src/main/resources/application.properties`.
3. Start the backend:
   ```bash
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
4. Open **http://localhost:8080**. The database `billease_db`, its tables and 8 sample products are created automatically.

To run the automated tests: `cd backend` then `.\mvnw.cmd test`.

## Documentation

| Document | Contents |
|---|---|
| [docs/setup-guide.md](docs/setup-guide.md) | Step-by-step installation, running, Live Server option |
| [docs/architecture.md](docs/architecture.md) | Layers, data flow of a sale, business rules |
| [docs/database.md](docs/database.md) | Tables, keys and relationships |
| [docs/api.md](docs/api.md) | REST endpoints, sample requests and responses |
| [docs/testing.md](docs/testing.md) | Automated tests and manual test checklist |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common errors and fixes |

## Ideas for next versions
- Customer name and phone on the invoice
- GST/tax and discount
- Date-range filter and reports in sales history
- Login for admin and cashier
