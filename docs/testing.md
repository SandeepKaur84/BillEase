# Testing

## Automated tests

```bash
cd backend
.\mvnw.cmd test
```

The tests use an in-memory **H2** database (configured in `backend/src/test/resources/application.properties`). They don't need MySQL and never touch your real data.

Expected result: `Tests run: 12, Failures: 0, Errors: 0` and `BUILD SUCCESS`.

| Test class | What it checks |
|---|---|
| `sale/SaleServiceTest` | Total = 2×60 + 5×10 = 170 and stock goes down; a bill with one line over stock saves **nothing** (rollback); the same product added twice can't exceed stock; zero quantity and empty bills are rejected; an old invoice keeps its price after the product is edited and deleted |
| `product/ProductControllerTest` | POST returns 201; negative price/quantity and blank name return 400 with messages; search by name; delete then GET returns 404; add stock (and reject 0); unknown ID returns 404 |

## Manual checklist

These were all tested end to end with MySQL 8.4:

- [x] Add, edit, search (by name and by ID) and delete products
- [x] A negative price or quantity, or an empty name, gives a 400 error with the reason
- [x] Billing totals: 2 × ₹60 + 5 × ₹10 = ₹170.00
- [x] A sale reduces stock; the dashboard and sales history update
- [x] A bill with one valid line and one line over stock is rejected, and the valid line's stock is **not** reduced (rollback)
- [x] Zero quantity or an empty bill is rejected
- [x] After changing a product's price and deleting it, its old invoice still shows the original price
- [x] Low-stock warnings appear on the dashboard and stock pages
- [x] Invoice prints without the navbar or buttons
- [x] 10 simultaneous sales of a product with only 3 in stock: exactly 3 succeed, 7 are rejected, and stock ends at 0
