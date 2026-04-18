package com.supertiles.ecommerce.product.service;

import com.supertiles.ecommerce.common.exception.ResourceNotFoundException;
import com.supertiles.ecommerce.product.dto.ProductRequest;
import com.supertiles.ecommerce.product.entity.Product;
import com.supertiles.ecommerce.product.repository.ProductRepository;
import com.supertiles.ecommerce.user.entity.User;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Cacheable(value = "products")
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product createProduct(ProductRequest request) {
        User seller = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Product product = Product.builder()
                .name(request.getName())
                .brand(request.getBrand())
                .size(request.getSize())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .sellerId(seller.getId())
                .build();

        return productRepository.save(product);
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        product.setName(request.getName());
        product.setBrand(request.getBrand());
        product.setSize(request.getSize());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        
        return productRepository.save(product);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
