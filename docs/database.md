# Database Design

Database name: **`billease_db`** (MySQL 8)

```
products (1) ────< sale_items >──── (1) sales

users (1) ────< user_sessions
```

## Tables

### products
| Column | Type | Notes |
|---|---|---|
| id | BIGINT, PK, auto increment | |
| name | VARCHAR(100), NOT NULL | |
| category | VARCHAR(50), NOT NULL | |
| price | DECIMAL(10,2), NOT NULL | CHECK ≥ 0 |
| quantity | INT, NOT NULL | current stock, CHECK ≥ 0 |
| active | BIT(1), NOT NULL | 0 = deleted (soft delete) |

### sales
| Column | Type | Notes |
|---|---|---|
| id | BIGINT, PK, auto increment | shown as invoice number `INV-0001` |
| sale_date | DATETIME(6), NOT NULL | |
| total_amount | DECIMAL(12,2), NOT NULL | grand total of the bill |

### sale_items
| Column | Type | Notes |
|---|---|---|
| id | BIGINT, PK, auto increment | |
| sale_id | BIGINT, FK → sales.id | which bill |
| product_id | BIGINT, FK → products.id | which product (ON DELETE RESTRICT) |
| quantity | INT, NOT NULL | CHECK > 0 |
| price | DECIMAL(10,2), NOT NULL | price **at the time of sale** |
| subtotal | DECIMAL(12,2), NOT NULL | price × quantity |

### users
| Column | Type | Notes |
|---|---|---|
| id | BIGINT, PK, auto increment | |
| name | VARCHAR(100), NOT NULL | |
| email | VARCHAR(150), NOT NULL, UNIQUE | saved in lower case |
| password_hash | VARCHAR(100), NOT NULL | BCrypt hash; the real password is never stored |
| created_at | DATETIME(6), NOT NULL | |

### user_sessions
| Column | Type | Notes |
|---|---|---|
| token | VARCHAR(64), PK | random login token the browser sends as `Authorization: Bearer <token>` |
| user_id | BIGINT, FK → users.id | who is logged in |
| created_at | DATETIME(6), NOT NULL | |
| expires_at | DATETIME(6), NOT NULL | 7 days after login; expired rows are removed when used |

## How the tables relate

- **One sale has many sale items.** `sale_items.sale_id` points to `sales.id`.
- **One product can appear in many sale items** across different bills. `sale_items.product_id` points to `products.id`.
- `sale_items` is the link table between products and sales: a *many-to-many* relationship broken into two *one-to-many* relationships.
- `sale_items.price` stores the price charged at the time, so changing a product's price later doesn't change old invoices.
- **Soft delete:** deleting a product only sets `active = 0`. The row stays, so old sale items still point to a real product. The foreign key also stops MySQL from hard-deleting a product that has been sold.
- **One user can be logged in on many browsers.** Each login adds a `user_sessions` row; logging out deletes that row, so the token stops working at once.

## In Java (JPA)

| Table | Entity | Relationship annotations |
|---|---|---|
| products | `Product` | — |
| sales | `Sale` | `@OneToMany(mappedBy = "sale", cascade = ALL)` → items |
| sale_items | `SaleItem` | `@ManyToOne` → sale, `@ManyToOne` → product |
| users | `User` | — (`passwordHash` has `@JsonIgnore`, so it is never sent to the browser) |
| user_sessions | `UserSession` | `@ManyToOne` → user |

## SQL files

- `database/schema.sql`: creates the database and tables with all keys and constraints. This is optional, because Spring Boot creates the tables automatically.
- `database/sample-data.sql`: 8 sample products, plus practice queries (low stock, invoice JOIN, best sellers, sales per day).
