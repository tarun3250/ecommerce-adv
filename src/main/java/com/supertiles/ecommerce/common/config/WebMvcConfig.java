package com.supertiles.ecommerce.common.config;

import com.supertiles.ecommerce.common.interceptor.IdempotencyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final IdempotencyInterceptor idempotencyInterceptor;

    public WebMvcConfig(IdempotencyInterceptor idempotencyInterceptor) {
        this.idempotencyInterceptor = idempotencyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Apply idempotency interceptor to specific paths where duplication is dangerous
        registry.addInterceptor(idempotencyInterceptor)
                .addPathPatterns("/api/orders/**", "/api/payments/**");
    }
}
