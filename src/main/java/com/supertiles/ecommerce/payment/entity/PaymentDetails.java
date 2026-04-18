package com.supertiles.ecommerce.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_details")
public class PaymentDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    private String razorpayPaymentId;
    private String razorpayOrderId;
    private String razorpaySignature;

    @Column(nullable = false)
    private String status;

    private double amount;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
