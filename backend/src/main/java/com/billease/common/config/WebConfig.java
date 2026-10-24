package com.billease.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Connects the backend with the separate "frontend" folder.
 *
 * 1. CORS: lets the frontend call the API even when it is opened from a
 *    different address, e.g. VS Code Live Server (http://127.0.0.1:5500).
 * 2. Static files: also serves the frontend folder at http://localhost:8080,
 *    so you can run everything with one command.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // no-cache: the browser re-checks files on every load,
        // so changes to HTML/CSS/JS show up after a normal refresh
        registry.addResourceHandler("/**")
                .addResourceLocations(findFrontendFolder())
                .setCacheControl(CacheControl.noCache());
    }

    // http://localhost:8080/ -> the dashboard page.
    // A redirect (not a forward) so the browser's address is inside pages/
    // and the page's relative links (../assets/..., products.html) work.
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("redirect:/pages/dashboard.html");
    }

    /**
     * The app can be started from the "backend" folder (mvn spring-boot:run)
     * or from the project root (VS Code Run button), so check both places.
     */
    private String findFrontendFolder() {
        Path folder = Path.of("../frontend");
        if (!Files.isDirectory(folder)) {
            folder = Path.of("frontend");
        }
        return folder.toAbsolutePath().normalize().toUri().toString();
    }
}
