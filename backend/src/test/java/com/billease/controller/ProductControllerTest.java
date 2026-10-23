package com.billease.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests the product REST API the same way the browser calls it:
 * send an HTTP request, check the status code and the JSON.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createProduct_withValidData_returns201() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Green Tea", "category": "Grocery", "price": 120, "quantity": 30}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Green Tea"));
    }

    @Test
    void createProduct_withNegativeValues_returns400() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "", "category": "Grocery", "price": -5, "quantity": -1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Price cannot be negative")))
                .andExpect(jsonPath("$.message", containsString("Quantity cannot be negative")))
                .andExpect(jsonPath("$.message", containsString("Product name is required")));
    }

    @Test
    void searchProducts_byName_findsMatch() throws Exception {
        createProduct("Searchable Mug");

        mockMvc.perform(get("/api/products").param("search", "searchable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Searchable Mug")));
    }

    @Test
    void deleteProduct_hidesItFromTheList() throws Exception {
        long id = createProduct("Product To Delete");

        mockMvc.perform(delete("/api/products/" + id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void addStock_increasesQuantity_andRejectsZero() throws Exception {
        long id = createProduct("Restock Item"); // starts with quantity 5

        mockMvc.perform(put("/api/products/" + id + "/stock").param("add", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(15));
        mockMvc.perform(put("/api/products/" + id + "/stock").param("add", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getUnknownProduct_returns404() throws Exception {
        mockMvc.perform(get("/api/products/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    /** Creates a product through the API and returns its new id. */
    private long createProduct(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"category\": \"Test\", \"price\": 50, \"quantity\": 5}"))
                .andExpect(status().isCreated())
                .andReturn();
        String json = result.getResponse().getContentAsString();
        return Long.parseLong(json.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }
}
