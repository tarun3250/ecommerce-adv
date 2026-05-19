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

## 🚀 CI/CD Pipeline (Jenkins & Kubernetes)

A fully automated CI/CD pipeline is implemented using **Jenkins**. It automates the process of building the Java application, containerizing it with Docker, pushing it to Docker Hub, and deploying it to a local Kubernetes (Minikube) cluster.

### 📋 Prerequisites
Ensure the following tools are installed on the Jenkins server (or locally, if running together):
- Jenkins
- Docker
- Java 17 & Maven
- Minikube
- `kubectl`

### 🔌 Required Jenkins Plugins
- **Docker Pipeline** & **Docker plugin**: For building and pushing images.
- **Credentials Binding Plugin**: To securely handle Docker Hub credentials.
- **Workspace Cleanup Plugin**: For `cleanWs()` support.

### 🔑 Jenkins Credential Setup
1. Open Jenkins Dashboard → **Manage Jenkins** → **Credentials**.
2. Click **System** → **Global credentials (unrestricted)** → **Add Credentials**.
3. Set **Kind** to **Username with password**.
4. Set **Username** to your Docker Hub username.
5. Set **Password** to your Docker Hub password (or access token).
6. Set **ID** strictly to `docker-hub-credentials`.
7. Click **Create**.

### ⚙️ Pipeline Explanation
The `Jenkinsfile` defines a declarative pipeline with the following stages:
1. **Checkout**: Pulls the latest source code from the branch.
2. **Build & Test**: Builds the Spring Boot `.jar` via `./mvnw clean package -DskipTests`.
3. **Docker Build**: Builds the image and tags it with both `:latest` and `:${BUILD_NUMBER}`.
4. **Docker Login & Push**: Authenticates using the stored Jenkins credentials and pushes the newly built images to Docker Hub.
5. **Update Kubernetes Deployment**: Uses `kubectl set image` to instantly update the running Minikube cluster with the latest version.
6. **Verify Deployment**: Tracks the deployment status using `kubectl rollout status` and prints active pods and services.

### 🏃‍♂️ How to Run the Jenkins Pipeline
1. In Jenkins, create a **New Item** → **Pipeline** → **OK**.
2. Under the **Pipeline** section, choose **Pipeline script from SCM**.
3. Set **SCM** to **Git** and provide your repository URL.
4. Ensure the **Script Path** is set to `Jenkinsfile`.
5. Save and click **Build Now**.

### 🌐 Minikube Connection Setup (for Jenkins User)
Since Jenkins executes commands as the `jenkins` user, you must ensure it can communicate with Minikube:
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Copy minikube config to jenkins user
sudo mkdir -p /var/lib/jenkins/.kube /var/lib/jenkins/.minikube
sudo cp -r ~/.kube/config /var/lib/jenkins/.kube/
sudo cp -r ~/.minikube/* /var/lib/jenkins/.minikube/
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube /var/lib/jenkins/.minikube
```

### 🔍 Verification Commands
Once the pipeline succeeds, verify your updated deployment locally:
```bash
# Check rollout status
kubectl rollout status deployment/ecommerce-backend

# View pods using the new image tag
kubectl get pods

# View the deployment details
kubectl describe deployment ecommerce-backend
```

---

## 🔮 Future Enhancements

* React frontend integration
* Microservices architecture
* Rate limiting

---

💡 *Built with strong focus on backend engineering and real-world system design.*
