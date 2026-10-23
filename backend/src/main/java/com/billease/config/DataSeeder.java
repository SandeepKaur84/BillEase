package com.billease.config;

import com.billease.entity.Product;
import com.billease.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Runs once when the application starts.
 * If the products table is empty, it inserts some sample products
 * so you can try billing right away.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.saveAll(List.of(
                new Product("Notebook A4", "Stationery", new BigDecimal("60.00"), 120),
                new Product("Ball Pen (Blue)", "Stationery", new BigDecimal("10.00"), 300),
                new Product("Basmati Rice 1kg", "Grocery", new BigDecimal("145.00"), 40),
                new Product("Sunflower Oil 1L", "Grocery", new BigDecimal("175.50"), 8),
                new Product("Toothpaste 150g", "Personal Care", new BigDecimal("95.00"), 25),
                new Product("Hand Wash 250ml", "Personal Care", new BigDecimal("85.00"), 5),
                new Product("USB Cable Type-C", "Electronics", new BigDecimal("199.00"), 15),
                new Product("Wireless Mouse", "Electronics", new BigDecimal("549.00"), 3)
        ));
        System.out.println(">>> Sample products inserted");
    }
}
