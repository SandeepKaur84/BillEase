package com.billease.service;

import com.billease.entity.Product;
import com.billease.exception.BadRequestException;
import com.billease.exception.ResourceNotFoundException;
import com.billease.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Business logic for products and stock.
 * Controllers call this class; this class calls the repository.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;

    @Value("${app.low-stock-threshold}")
    private int lowStockThreshold;

    // Constructor injection: Spring passes the repository in automatically
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /** All active products, or only those matching the search text (name or ID). */
    public List<Product> getProducts(String search) {
        if (search == null || search.isBlank()) {
            return productRepository.findByActiveTrueOrderByIdAsc();
        }
        String text = search.trim();
        List<Product> result = new ArrayList<>(
                productRepository.findByActiveTrueAndNameContainingIgnoreCaseOrderByIdAsc(text));

        // If the search text is a number, also match the product ID
        if (text.matches("\\d+")) {
            productRepository.findByIdAndActiveTrue(Long.parseLong(text)).ifPresent(p -> {
                boolean alreadyInList = result.stream().anyMatch(r -> r.getId().equals(p.getId()));
                if (!alreadyInList) {
                    result.add(0, p);
                }
            });
        }
        return result;
    }

    public Product getProduct(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    public Product createProduct(Product product) {
        product.setId(null); // always insert a new row
        product.setActive(true);
        product.setName(product.getName().trim());
        product.setCategory(product.getCategory().trim());
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product data) {
        Product product = getProduct(id);
        product.setName(data.getName().trim());
        product.setCategory(data.getCategory().trim());
        product.setPrice(data.getPrice());
        product.setQuantity(data.getQuantity());
        return productRepository.save(product);
    }

    /** Adds new stock to an existing product (restocking). */
    public Product addStock(Long id, int amount) {
        if (amount <= 0) {
            throw new BadRequestException("Stock to add must be greater than 0");
        }
        Product product = getProduct(id);
        product.setQuantity(product.getQuantity() + amount);
        return productRepository.save(product);
    }

    /**
     * Soft delete: we only mark the product inactive.
     * Old sale_items still point to this row, so sales history stays correct.
     */
    public void deleteProduct(Long id) {
        Product product = getProduct(id);
        product.setActive(false);
        productRepository.save(product);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findByActiveTrueAndQuantityLessThanEqualOrderByQuantityAsc(lowStockThreshold);
    }

    public long countProducts() {
        return productRepository.countByActiveTrue();
    }

    public long countLowStockProducts() {
        return productRepository.countByActiveTrueAndQuantityLessThanEqual(lowStockThreshold);
    }

    public int getLowStockThreshold() {
        return lowStockThreshold;
    }
}
