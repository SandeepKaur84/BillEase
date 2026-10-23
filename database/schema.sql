-- =====================================================================
-- BillEase (Inventory and Billing System) - MySQL schema
-- Optional: Spring Boot creates these tables automatically
-- (spring.jpa.hibernate.ddl-auto=update). Run this file yourself if you
-- want to create the database by hand or to study the SQL.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS billease_db;
USE billease_db;

-- One row per product
CREATE TABLE IF NOT EXISTS products (
    id        BIGINT        NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100)  NOT NULL,
    category  VARCHAR(50)   NOT NULL,
    price     DECIMAL(10,2) NOT NULL,
    quantity  INT           NOT NULL,
    active    BIT(1)        NOT NULL DEFAULT 1,   -- 0 = deleted (soft delete)
    PRIMARY KEY (id),
    CONSTRAINT chk_products_price    CHECK (price >= 0),
    CONSTRAINT chk_products_quantity CHECK (quantity >= 0)
);

-- One row per bill
CREATE TABLE IF NOT EXISTS sales (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    sale_date     DATETIME(6)   NOT NULL,
    total_amount  DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id)
);

-- One row per product line on a bill
CREATE TABLE IF NOT EXISTS sale_items (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    sale_id     BIGINT        NOT NULL,
    product_id  BIGINT        NOT NULL,
    quantity    INT           NOT NULL,
    price       DECIMAL(10,2) NOT NULL,   -- price at the time of sale
    subtotal    DECIMAL(12,2) NOT NULL,   -- price * quantity
    PRIMARY KEY (id),
    CONSTRAINT fk_sale_items_sale    FOREIGN KEY (sale_id)    REFERENCES sales (id),
    -- RESTRICT: MySQL refuses to hard-delete a product that appears in a sale
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_sale_items_quantity CHECK (quantity > 0)
);
