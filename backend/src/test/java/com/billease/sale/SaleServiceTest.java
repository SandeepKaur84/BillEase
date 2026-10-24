package com.billease.sale;

import com.billease.common.exception.BadRequestException;
import com.billease.product.Product;
import com.billease.product.ProductRepository;
import com.billease.product.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests the billing rules: totals, stock reduction and transaction rollback.
 */
@SpringBootTest
class SaleServiceTest {

    @Autowired
    private SaleService saleService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Test
    void createSale_calculatesTotalAndReducesStock() {
        Product notebook = saveProduct("Test Notebook", "60.00", 10);
        Product pen = saveProduct("Test Pen", "10.00", 50);

        Sale sale = saleService.createSale(request(item(notebook, 2), item(pen, 5)));

        // 2 x 60 + 5 x 10 = 170
        assertThat(sale.getTotalAmount()).isEqualByComparingTo("170.00");
        assertThat(sale.getItems()).hasSize(2);
        assertThat(sale.getItems().get(0).getSubtotal()).isEqualByComparingTo("120.00");
        assertThat(stockOf(notebook)).isEqualTo(8);
        assertThat(stockOf(pen)).isEqualTo(45);
    }

    @Test
    void createSale_withNotEnoughStock_savesNothing() {
        Product rice = saveProduct("Test Rice", "145.00", 20);
        Product mouse = saveProduct("Test Mouse", "549.00", 1);
        long salesBefore = saleRepository.count();

        // The first line is fine, the second asks for more than is in stock
        assertThatThrownBy(() -> saleService.createSale(request(item(rice, 3), item(mouse, 5))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Not enough stock");

        // Rollback: no sale saved and NEITHER product's stock changed
        assertThat(saleRepository.count()).isEqualTo(salesBefore);
        assertThat(stockOf(rice)).isEqualTo(20);
        assertThat(stockOf(mouse)).isEqualTo(1);
    }

    @Test
    void createSale_sameProductTwice_checksCombinedQuantity() {
        Product oil = saveProduct("Test Oil", "175.50", 3);

        assertThatThrownBy(() -> saleService.createSale(request(item(oil, 2), item(oil, 2))))
                .isInstanceOf(BadRequestException.class);
        assertThat(stockOf(oil)).isEqualTo(3);
    }

    @Test
    void createSale_withZeroQuantity_isRejected() {
        Product soap = saveProduct("Test Soap", "40.00", 10);

        assertThatThrownBy(() -> saleService.createSale(request(item(soap, 0))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("greater than 0");
    }

    @Test
    void createSale_withNoItems_isRejected() {
        assertThatThrownBy(() -> saleService.createSale(new SaleRequest()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void oldSale_keepsOriginalPrice_afterProductIsEditedAndDeleted() {
        Product cable = saveProduct("Test Cable", "199.00", 10);
        Sale sale = saleService.createSale(request(item(cable, 1)));

        // Change the price, then delete the product
        Product changed = new Product("Test Cable", "Electronics", new BigDecimal("250.00"), 9);
        productService.updateProduct(cable.getId(), changed);
        productService.deleteProduct(cable.getId());

        Sale saved = saleService.getSale(sale.getId());
        assertThat(saved.getItems().get(0).getPrice()).isEqualByComparingTo("199.00");
        assertThat(saved.getTotalAmount()).isEqualByComparingTo("199.00");
        assertThat(saved.getItems().get(0).getProduct().getName()).isEqualTo("Test Cable");
    }

    // ----- small helpers -----

    private Product saveProduct(String name, String price, int quantity) {
        return productRepository.save(new Product(name, "Test", new BigDecimal(price), quantity));
    }

    private int stockOf(Product product) {
        return productRepository.findById(product.getId()).orElseThrow().getQuantity();
    }

    private SaleRequest.Item item(Product product, int quantity) {
        SaleRequest.Item item = new SaleRequest.Item();
        item.setProductId(product.getId());
        item.setQuantity(quantity);
        return item;
    }

    private SaleRequest request(SaleRequest.Item... items) {
        SaleRequest request = new SaleRequest();
        request.setItems(List.of(items));
        return request;
    }
}
