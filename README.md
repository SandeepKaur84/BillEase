# BillEase: Inventory and Billing System

**BillEase** ("billing made easy") is a beginner-friendly Java full-stack web app for small shops. It manages products and stock, creates bills, prints invoices and keeps a sales history. A public home page explains the app; shop staff sign up or log in to reach the dashboard.

**Stack:** Java 17 · Spring Boot 3.3 · Spring Data JPA · MySQL 8 · HTML/CSS/JavaScript (no CSS framework) · Maven

## Features

| Module | What it does |
|---|---|
| Home page | Public page that explains BillEase, with Log in and Sign up buttons |
| Accounts | Sign up, log in, log out; passwords hashed with BCrypt; every app page and API call needs a login |
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
│       │   ├── auth/          User + UserSession (entities), AuthService, AuthController,
│       │   │                  AuthInterceptor (checks the login token on every /api call)
│       │   └── common/
│       │       ├── config/    WebConfig (CORS + serves frontend), DataSeeder (sample data)
│       │       └── exception/ GlobalExceptionHandler + custom exceptions
│       ├── main/resources/application.properties   MySQL settings
│       └── test/java/com/billease/                 JUnit tests (H2 in-memory DB)
│           ├── auth/AuthControllerTest.java
│           ├── product/ProductControllerTest.java
│           └── sale/SaleServiceTest.java
│
├── frontend/                HTML + CSS + JavaScript (no framework)
│   ├── index.html           Public home page (Log in / Sign up)
│   ├── pages/
│   │   ├── login.html       Log in
│   │   ├── signup.html      Sign up
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
│       │   ├── landing.css      home page only
│       │   ├── auth.css         log in + sign up pages
│       │   ├── billing.css      billing page only
│       │   └── invoice.css      invoice page only (+ print styles)
│       └── js/
│           ├── core/            loaded on every page, in this order:
│           │   ├── api.js       API_BASE, api() fetch helper, login token (getToken, saveSession)
│           │   ├── format.js    money, dates, invoice numbers, escapeHtml
│           │   ├── ui.js        avatars, chips, toasts, confirm dialog, createModal
│           │   └── layout.js    login check, sidebar (with user + log out) + top bar
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
4. Open **http://localhost:8080** and click **Sign up** to create your account. The database `billease_db`, its tables and 8 sample products are created automatically.

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
