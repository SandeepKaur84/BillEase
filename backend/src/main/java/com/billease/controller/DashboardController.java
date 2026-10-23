package com.billease.controller;

import com.billease.service.ProductService;
import com.billease.service.SaleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** Summary numbers for the dashboard page. */
@RestController
public class DashboardController {

    private final ProductService productService;
    private final SaleService saleService;

    public DashboardController(ProductService productService, SaleService saleService) {
        this.productService = productService;
        this.saleService = saleService;
    }

    // GET /api/dashboard
    @GetMapping("/api/dashboard")
    public Map<String, Object> getDashboard() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalProducts", productService.countProducts());
        data.put("lowStockCount", productService.countLowStockProducts());
        data.put("lowStockThreshold", productService.getLowStockThreshold());
        data.put("totalSales", saleService.countSales());
        data.put("totalRevenue", saleService.getTotalRevenue());
        data.put("lowStockProducts", productService.getLowStockProducts());
        data.put("recentSales", saleService.getRecentSales());
        return data;
    }
}
