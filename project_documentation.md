# SuperTiles E-Commerce Backend: Comprehensive Project Documentation

This document contains a complete overview of the SuperTiles E-Commerce Backend project. It was designed to represent a production-grade, highly scalable "Modular Monolith" architecture demonstrating enterprise backend engineering skills. 

You can use this document as a knowledge base to understand every component, architecture decision, and workflow implemented.

---

## 1. Project Overview & Architecture
The application is a stateless RESTful API built for a modern E-commerce platform. It does not use any frontend templating engines (like Thymeleaf or JSP). Instead, it acts as a headless backend that any client (React JS frontend, Android App, iOS app) can consume.

**Architecture Style: Modular Monolith**
Rather than building microservices (which adds unnecessary infrastructure overhead for a small project), or a messy unstructured monolith, the codebase is separated into logical **domain modules**.
- `common`: Cross-cutting concerns (Global Error Handling, Redis Config, Base DTOs, Idempotency).
- `security`: JWT utilities and Spring Security core configurations.
- `user`: User entities, roles, authentication service, and controllers.
- `product`: Product listing, caching, and management.
- `order`: Order transaction grouping.
- `payment`: Razorpay integration and signature verification.

---

## 2. Technology Stack & Dependencies
* **Core Framework:** Java 17 + Spring Boot 3.4.x
* **Database Base:** MySQL 8.0 (Relational Mapping via Spring Data JPA / Hibernate)
* **Caching & Key-Value:** Redis (Spring Data Redis)
* **Security:** Spring Security + JWT (JSON Web Tokens using `jjwt` library) + BCrypt (Password Hashing)
* **Payment Gateway:** Razorpay Java SDK
* **Validation:** Spring Boot Starter Validation (`jakarta.validation.*`)
* **DevOps:** Docker Engine + Docker Compose

---

## 3. Core Modules & Workflows Detailed

### A. Authentication & Security Module (`user` & `security`)
* **Entity**: A single unified `User` entity featuring an `enum Role { USER, SELLER, ADMIN }`.
* **Flow**: 
  1. A user calls `POST /api/auth/register` or `POST /api/auth/login`.
  2. The `AuthService` verifies credentials. If valid, it passes the `User` object into the `JwtUtil`.
  3. `JwtUtil` issues a cryptographic token containing the user's email signed by a Secret Key via HMAC-SHA256 (`HS256`).
* **Interceptor (Filter)**: 
  Every secure API request runs through the `JwtAuthenticationFilter`. This filter extracts the `Bearer` token from the HTTP headers, checks its signature and expiration date, and if valid, populates the `SecurityContextHolder`.

### B. Product Module & Caching  (`product`)
* **Entity**: `Product` holds catalog details (Name, Brand, Price, Stock).
* **Caching (Redis)**: 
  Because an e-commerce platform reads products 90% of the time and writes them 10% of the time, reading from the disk (MySQL) is expensive.
  - `@Cacheable("products")` annotation on the `getAllProducts` service method instructs Spring to fetch the list from Redis Memory. If Redis misses, it queries MySQL and caches the output automatically.
  - `@CacheEvict(value = "products", allEntries = true)` is used on methods that Create, Update, or Delete products. This prevents "stale data" by wiping the cache when the catalog changes.

### C. The Idempotency Layer (`common.interceptor`)
* **What is it?** It prevents the infamous "Double Charge" bug if a user's network stutters and they click "Submit Payment" or "Create Order" twice in rapid succession.
* **How it works (`IdempotencyInterceptor`)**:
  When a client sends a `POST` request, they MUST include a unique HTTP Header `Idempotency-Key` (e.g., a random UUID generated on the frontend).
  The Interceptor checks Redis: `redisTemplate.opsForValue().setIfAbsent(redisKey, ...)`
  If the key already exists, the server immediately returns `409 Conflict` blocking the duplicate transaction from occurring. Keys expire after 24 hours.

### D. Order & Payment Flow (`order` & `payment`)
This logic ensures ACID-compliant transactions and protects against forged payment receipts.
1. **Order Creation (`POST /api/orders`)**: 
   The server verifies stock availability and calculates the raw total monetary amount. It then makes a server-to-server HTTP request to the **Razorpay API** via the Java SDK to create an official "Razorpay Order ID".
2. **Transaction Security**: 
   The `OrderService.createOrder` method is annotated with `@Transactional`. If Razorpay is down, or stock verification fails, the database automatically "Rolls back" any partial inserts preventing corrupted half-orders.
3. **Payment Verification (`POST /api/payments/verify`)**: 
   Once the user successfully pays on the client-side Razorpay Widget, the frontend forwards the receipt (`razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`) to this backend endpoint.
   The `PaymentService` mathematically hashes the order payload alongside the private backend `RAZORPAY_KEY_SECRET` to verify mathematically that the receipt was not forged by a malicious user. If it passes, the database marks the Order as `PAID`.

### E. Global Exception Handling (`common.exception`)
Rather than Spring throwing messy 500 HTML whitelabel error pages, a `@RestControllerAdvice` intercepts throws like `ResourceNotFoundException` or `MethodArgumentNotValidException` (thrown when input DTO validation constraints fail).
It formats the errors into a standardized `ApiResponse` containing timestamps and clear `"success": false` JSON payloads.

---

## 4. DevOps & Infrastructure

### Docker Compose Configuration (`docker-compose.yml`)
The engine defining how the micro-infrastructure talks to each other in a private network without utilizing localhost.
- **MySQL Container**: Boots an isolated database. Port 3307 matches the internal 3306.
- **Redis Container**: Boot an isolated MemCache storage.
- **Spring Boot App Container**: 
  Follows a **Multi-Stage Dockerfile**. It uses a heavy Maven Image (`maven:3.9-eclipse-temurin-17`) to compile the `.jar` locally utilizing dependency caching, and then discards the compiler entirely, pulling only the raw `.jar` artifact into a lightning-fast lightweight JRE Alpine image (`eclipse-temurin:17-jre`) to shrink final container size drastically.

### Application Properties (`application-dev.yml`)
Uses Spring Profiles. Database routes use Docker's DNS resolution (`jdbc:mysql://mysql:3306/ecommerce`) avoiding hard-coded IPs.

---

## 5. Summary of Main Endpoint Paths
- `POST /api/auth/register` (Public) - Create User
- `POST /api/auth/login` (Public) - Obtain JWT
- `GET /api/products` (Public-ish) - Cached Product Listing (Paginated)
- `POST /api/products` (Requires `SELLER` or `ADMIN` JWT) - Create Product
- `POST /api/orders` (Requires `USER` JWT, Idempotency-Key) - Initialize Order
- `POST /api/payments/verify` (Requires `USER` JWT, Idempotency-Key) - Mark Order Paid
