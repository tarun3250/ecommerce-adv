package com.supertiles.ecommerce.order.repository;

import com.supertiles.ecommerce.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    Order findByRazorpayOrderId(String razorpayOrderId);
}
