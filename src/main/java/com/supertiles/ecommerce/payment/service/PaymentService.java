package com.supertiles.ecommerce.payment.service;

import com.razorpay.Utils;
import com.supertiles.ecommerce.common.exception.BadRequestException;
import com.supertiles.ecommerce.order.entity.Order;
import com.supertiles.ecommerce.order.entity.OrderStatus;
import com.supertiles.ecommerce.order.repository.OrderRepository;
import com.supertiles.ecommerce.payment.dto.PaymentVerificationRequest;
import com.supertiles.ecommerce.payment.entity.PaymentDetails;
import com.supertiles.ecommerce.payment.repository.PaymentRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public PaymentDetails verifyPayment(PaymentVerificationRequest request) {

        Order order = orderRepository.findByRazorpayOrderId(request.getRazorpayOrderId());
        if (order == null) {
            throw new BadRequestException("Order not found with given Razorpay Order ID");
        }

        PaymentDetails paymentDetails = PaymentDetails.builder()
                .orderId(order.getId())
                .razorpayOrderId(request.getRazorpayOrderId())
                .razorpayPaymentId(request.getRazorpayPaymentId())
                .razorpaySignature(request.getRazorpaySignature())
                .amount(order.getTotalAmount())
                .build();

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (isValid) {
                paymentDetails.setStatus("SUCCESS");
                order.setStatus(OrderStatus.PAID);
            } else {
                paymentDetails.setStatus("FAILED");
                order.setStatus(OrderStatus.FAILED);
            }

            orderRepository.save(order);
            return paymentRepository.save(paymentDetails);

        } catch (Exception e) {
            paymentDetails.setStatus("FAILED");
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            paymentRepository.save(paymentDetails);
            throw new BadRequestException("Payment verification failed: " + e.getMessage());
        }
    }
}
