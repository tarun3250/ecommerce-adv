package com.supertiles.ecommerce.order.controller;

import com.supertiles.ecommerce.common.dto.ApiResponse;
import com.supertiles.ecommerce.order.dto.OrderRequest;
import com.supertiles.ecommerce.order.entity.Order;
import com.supertiles.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.ok(ApiResponse.success(order, "Order created successfully. Proceed to payment with Razorpay Order ID."));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getMyOrders() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getMyOrders()));
    }
}
