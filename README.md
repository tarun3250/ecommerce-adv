# 🛒 SuperTiles E-Commerce Platform

A production-grade **E-commerce Backend System** built using **Spring Boot**, showcasing real-world backend engineering concepts such as **JWT authentication, Redis caching, idempotent payment handling, and Dockerized deployment**.

Originally developed as a full-stack application using **Thymeleaf**, this project has been upgraded into a **headless, scalable REST API architecture**.

---

## 🚀 Key Highlights

* 🔐 JWT-based Authentication & Role-Based Access Control (RBAC)
* ⚡ Redis Caching for high-performance product retrieval
* 💳 Razorpay Payment Gateway Integration
* 🛡️ Idempotency Handling (Prevents duplicate transactions)
* 🧱 Modular Monolith Architecture (Industry-style design)
* 🐳 Fully Dockerized (MySQL + Redis + Backend)
* 📦 RESTful APIs with validation & structured error handling

---

## 🧠 Architecture Overview

The application follows a **Modular Monolith Architecture**, dividing the system into domain-specific modules:

```id="arch2"
common     → shared configs, exceptions, idempotency  
security   → JWT + Spring Security  
user       → authentication & roles  
product    → product catalog + caching  
order      → order management  
payment    → Razorpay integration  
```

---

## 🔄 End-to-End Flow

```id="flow2"
Register/Login → JWT Token  
→ Fetch Products (Redis Cached)  
→ Create Order (Idempotency Key)  
→ Razorpay Payment  
→ Payment Verification → Order marked PAID  
```

---

## 🛠️ Tech Stack

### Backend

* Java 17, Spring Boot 3
* Spring Security + JWT
* Hibernate / JPA

### Database & Caching

* MySQL
* Redis

### DevOps

* Docker & Docker Compose

### Legacy Frontend (Initial Version)

* Thymeleaf
* Tailwind CSS

---

## 🧪 API Endpoints

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | /api/auth/register   | Register user                 |
| POST   | /api/auth/login      | Login & get JWT               |
| GET    | /api/products        | Get products (cached)         |
| POST   | /api/products        | Create product (ADMIN/SELLER) |
| POST   | /api/orders          | Create order (Idempotent)     |
| POST   | /api/payments/verify | Verify payment                |

---

## 🛡️ Idempotency Example

```id="idem2"
POST /api/orders
Header: Idempotency-Key: unique-key-123
```

Duplicate request → **409 Conflict**

---

## ⚡ Redis Caching

* Uses `@Cacheable` for product retrieval
* Cache invalidated on product updates
* Reduces database load and improves performance

---

## 🐳 Run with Docker

```bash id="run2"
docker-compose up --build
```

Access:

* API → http://localhost:8080
* Swagger → http://localhost:8080/swagger-ui.html

---

## 📬 Testing

* Use Postman collection included in repo
* Test complete flow:

  * Auth → Products → Orders → Payment

---

## 📂 Project Evolution

### 🔹 Version 1 (Initial)

* Full-stack app with Thymeleaf
* Basic CRUD and authentication

### 🔹 Version 2 (Current - Production Style)

* Headless REST API
* JWT authentication
* Redis caching
* Payment integration
* Dockerized infrastructure

---

## 🧠 Key Concepts Demonstrated

* Stateless Authentication (JWT)
* Role-Based Access Control
* ACID Transactions (@Transactional)
* Distributed Caching (Redis)
* Idempotent API Design
* Secure Payment Verification
* Containerized Deployment

---

## 🔮 Future Enhancements

* React frontend integration
* Microservices architecture
* CI/CD pipeline (GitHub Actions)
* Rate limiting

---

💡 *Built with strong focus on backend engineering and real-world system design.*
