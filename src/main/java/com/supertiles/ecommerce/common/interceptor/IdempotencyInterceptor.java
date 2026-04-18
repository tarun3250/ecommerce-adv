package com.supertiles.ecommerce.common.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;

@Component
public class IdempotencyInterceptor implements HandlerInterceptor {

    private final RedisTemplate<String, Object> redisTemplate;

    public IdempotencyInterceptor(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("POST".equalsIgnoreCase(request.getMethod()) || "PUT".equalsIgnoreCase(request.getMethod())) {
            String idempotencyKey = request.getHeader("Idempotency-Key");
            if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
                String redisKey = "idempotency:" + idempotencyKey;
                Boolean isNewKey = redisTemplate.opsForValue().setIfAbsent(redisKey, "processing", 24, TimeUnit.HOURS);
                
                if (Boolean.FALSE.equals(isNewKey)) {
                    response.setStatus(HttpStatus.CONFLICT.value());
                    response.getWriter().write("{\"error\": \"Duplicate request detected for idempotency key\"}");
                    response.setContentType("application/json");
                    return false;
                }
            }
        }
        return true;
    }
}
