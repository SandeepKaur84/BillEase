package com.billease.service;

import com.billease.dto.SaleRequest;
import com.billease.entity.Product;
import com.billease.entity.Sale;
import com.billease.entity.SaleItem;
import com.billease.exception.BadRequestException;
import com.billease.exception.ResourceNotFoundException;
import com.billease.repository.ProductRepository;
import com.billease.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Billing logic: creates a sale, calculates totals and reduces stock.
 */
@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    public SaleService(SaleRepository saleRepository, ProductRepository productRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
    }

    /**
     * @Transactional: everything in this method is ONE database transaction.
     * If any item fails (e.g. not enough stock), an exception is thrown and
     * MySQL rolls back: no sale is saved and no stock is reduced.
     */
    @Transactional
    public Sale createSale(SaleRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Add at least one product to the bill");
        }

        Sale sale = new Sale();
        sale.setSaleDate(LocalDateTime.now());
        BigDecimal total = BigDecimal.ZERO;

        for (SaleRequest.Item itemRequest : request.getItems()) {
            SaleItem item = createSaleItem(itemRequest);
            sale.addItem(item);
            total = total.add(item.getSubtotal());
        }

        sale.setTotalAmount(total);
        // Saves the sale and (because of cascade) all its items.
        // Changed product quantities are saved automatically when the transaction commits.
        return saleRepository.save(sale);
    }

    /** Checks one bill line, reduces stock and returns the SaleItem. */
    private SaleItem createSaleItem(SaleRequest.Item itemRequest) {
        Integer quantity = itemRequest.getQuantity();
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }
        if (itemRequest.getProductId() == null) {
            throw new BadRequestException("Product id is required");
        }

        // Locks the product row so no other sale can change its stock at the same time
        Product product = productRepository.findActiveByIdForUpdate(itemRequest.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found with id " + itemRequest.getProductId()));

        if (product.getQuantity() < quantity) {
            throw new BadRequestException("Not enough stock for " + product.getName()
                    + ". Available: " + product.getQuantity() + ", requested: " + quantity);
        }

        product.setQuantity(product.getQuantity() - quantity);

        SaleItem item = new SaleItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setPrice(product.getPrice()); // price at the time of sale
        item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        return item;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAllByOrderBySaleDateDesc();
    }

    public List<Sale> getRecentSales() {
        return saleRepository.findTop5ByOrderBySaleDateDesc();
    }

    public Sale getSale(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id " + id));
    }

    public long countSales() {
        return saleRepository.count();
    }

    public BigDecimal getTotalRevenue() {
        return saleRepository.getTotalRevenue();
    }
}
