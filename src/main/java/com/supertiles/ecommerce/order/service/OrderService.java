package com.supertiles.ecommerce.order.service;

import com.razorpay.RazorpayClient;
import com.supertiles.ecommerce.common.exception.BadRequestException;
import com.supertiles.ecommerce.order.dto.OrderItemRequest;
import com.supertiles.ecommerce.order.dto.OrderRequest;
import com.supertiles.ecommerce.order.entity.Order;
import com.supertiles.ecommerce.order.entity.OrderItem;
import com.supertiles.ecommerce.order.entity.OrderStatus;
import com.supertiles.ecommerce.order.repository.OrderRepository;
import com.supertiles.ecommerce.product.entity.Product;
import com.supertiles.ecommerce.product.repository.ProductRepository;
import com.supertiles.ecommerce.user.entity.User;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Order order = Order.builder()
                .userId(user.getId())
                .status(OrderStatus.PENDING)
                .build();

        double totalAmount = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new BadRequestException("Product not found: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }

            // Deduct stock
            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);

            double itemTotal = product.getPrice() * itemReq.getQuantity();
            totalAmount += itemTotal;

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .productName(product.getName())
                    .price(product.getPrice())
                    .quantity(itemReq.getQuantity())
                    .build();

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        // Create Razorpay Order
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int) (totalAmount * 100)); // Amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            com.razorpay.Order razorpayOrder = razorpay.orders.create(orderRequest);
            order.setRazorpayOrderId(razorpayOrder.get("id"));

        } catch (Exception e) {
            throw new RuntimeException("Error while creating Razorpay order: " + e.getMessage());
        }

        return orderRepository.save(order);
    }

    public List<Order> getMyOrders() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return orderRepository.findByUserId(user.getId());
    }
}
