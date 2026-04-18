package com.supertiles.ecommerce.payment.controller;

import com.supertiles.ecommerce.common.dto.ApiResponse;
import com.supertiles.ecommerce.payment.dto.PaymentVerificationRequest;
import com.supertiles.ecommerce.payment.entity.PaymentDetails;
import com.supertiles.ecommerce.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentDetails>> verifyPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        PaymentDetails paymentDetails = paymentService.verifyPayment(request);
        if ("SUCCESS".equals(paymentDetails.getStatus())) {
            return ResponseEntity.ok(ApiResponse.success(paymentDetails, "Payment verified successfully."));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Payment verification failed."));
        }
    }
}
