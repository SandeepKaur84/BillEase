package com.billease.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * The JSON the billing page sends when creating a bill:
 * { "items": [ { "productId": 1, "quantity": 2 }, ... ] }
 * Only IDs and quantities come from the browser. Prices are always
 * read from the database so nobody can change them from the frontend.
 */
public class SaleRequest {

    private List<Item> items = new ArrayList<>();

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }

    public static class Item {
        private Long productId;
        private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
