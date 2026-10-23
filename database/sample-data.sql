-- =====================================================================
-- Sample data (optional). The app also inserts sample products itself
-- the first time it starts, if the products table is empty.
-- =====================================================================
USE billease_db;

INSERT INTO products (name, category, price, quantity, active) VALUES
('Notebook A4',       'Stationery',    60.00, 120, 1),
('Ball Pen (Blue)',   'Stationery',    10.00, 300, 1),
('Basmati Rice 1kg',  'Grocery',      145.00,  40, 1),
('Sunflower Oil 1L',  'Grocery',      175.50,   8, 1),
('Toothpaste 150g',   'Personal Care', 95.00,  25, 1),
('Hand Wash 250ml',   'Personal Care', 85.00,   5, 1),
('USB Cable Type-C',  'Electronics',  199.00,  15, 1),
('Wireless Mouse',    'Electronics',  549.00,   3, 1);


-- =====================================================================
-- Useful queries for practice / viva
-- =====================================================================

-- 1. Low-stock products
-- SELECT * FROM products WHERE active = 1 AND quantity <= 10 ORDER BY quantity;

-- 2. Full invoice for sale #1 (JOIN of all three tables)
-- SELECT s.id AS invoice_no, s.sale_date, p.name, si.price, si.quantity, si.subtotal
-- FROM sales s
-- JOIN sale_items si ON si.sale_id = s.id
-- JOIN products p    ON p.id = si.product_id
-- WHERE s.id = 1;

-- 3. Best-selling products
-- SELECT p.name, SUM(si.quantity) AS units_sold, SUM(si.subtotal) AS revenue
-- FROM sale_items si JOIN products p ON p.id = si.product_id
-- GROUP BY p.id, p.name ORDER BY units_sold DESC;

-- 4. Sales per day
-- SELECT DATE(sale_date) AS day, COUNT(*) AS bills, SUM(total_amount) AS revenue
-- FROM sales GROUP BY DATE(sale_date) ORDER BY day DESC;
