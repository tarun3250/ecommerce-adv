package com.supertiles.ecommerce.payment.repository;

import com.supertiles.ecommerce.payment.entity.PaymentDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentDetails, Long> {
    PaymentDetails findByRazorpayOrderId(String razorpayOrderId);
}
