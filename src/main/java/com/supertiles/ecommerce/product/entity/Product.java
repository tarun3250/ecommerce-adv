package com.supertiles.ecommerce.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private String size;

    @Column(columnDefinition = "TEXT")
    private String description;

    private double price;
    private int stock;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] picture;

    // We can map it back to User (Seller) if we want,
    // but for simplicity, we can store sellerId or leave it decoupled.
    private Long sellerId;
}
