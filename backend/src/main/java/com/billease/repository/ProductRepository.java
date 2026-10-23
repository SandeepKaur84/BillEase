package com.billease.repository;

import com.billease.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA creates the SQL for these methods from their names.
 * JpaRepository already gives us save(), findById(), findAll(), deleteById() ...
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByActiveTrueOrderByIdAsc();

    List<Product> findByActiveTrueAndNameContainingIgnoreCaseOrderByIdAsc(String name);

    Optional<Product> findByIdAndActiveTrue(Long id);

    List<Product> findByActiveTrueAndQuantityLessThanEqualOrderByQuantityAsc(int threshold);

    long countByActiveTrue();

    long countByActiveTrueAndQuantityLessThanEqual(int threshold);

    /**
     * Used while billing. PESSIMISTIC_WRITE adds "FOR UPDATE" to the SQL, which locks
     * the product row until the sale's transaction ends. If two cashiers sell the
     * last item at the same moment, the second one waits and then sees the new stock,
     * so stock can never be oversold.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.active = true")
    Optional<Product> findActiveByIdForUpdate(@Param("id") Long id);
}
