
# Design, Implementation, and AI­Driven Optimization of an E­Commerce Platform using Microservices Architecture and DevOps Principles

---

## 🏗 System Architecture

The system is designed as a distributed cloud-native application comprising 12 independent microservices. It leverages a **Polyglot Persistence** strategy and an **Event-Driven Architecture (EDA)** via Apache Kafka.

![System Architecture](assets/architecture.png)

### Key Architectural Patterns
*   **BFF (Backend for Frontend):** The API Gateway enriches payloads (e.g., fetching product details for orders) to simplify client logic.
*   **Event-Driven Communication:** Services communicate asynchronously via Kafka to ensure loose coupling and eventual consistency.
*   **Polyglot Persistence:** Each service selects the optimal database (PostgreSQL for relations, Redis for caching, Elasticsearch for search).
*   **Sidecar Pattern:** Istio Envoy proxies manage traffic, security, and observability transparently.

![Polyglot Persistence](assets/Polyglot_Persistence_Strategy_Across_Services.png)

---

## 🧠 AI-Driven Load Balancing

The core innovation of this project is the **AI Controller**, a Python-based component that acts as an intelligent control plane for the Service Mesh.

### How it Works (Q-Learning)
The agent uses **Reinforcement Learning** to learn optimal routing policies. It follows a continuous feedback loop:
1.  **Observe:** Scrapes metrics (Latency, RPS, Error Rates) from **Prometheus**.
2.  **Decide:** Uses a Q-Table (Epsilon-Greedy strategy) to select the best traffic split action.
3.  **Act:** Patches **Istio VirtualServices** to adjust traffic weights dynamically.
4.  **Learn:** Calculates reward based on system performance and updates the Q-Table.

![AI Loop](assets/AI_Controller_Feedback_and_Control_Loop.png)

### Operational Flow
![AI Learning Cycle](assets/Operational_Flow_of_the_AI_Controller_Learning_Cycle.png)

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **AI/ML** | Python, NumPy, Pandas, Scikit-learn |
| **Databases** | PostgreSQL (Prisma ORM), Redis, Elasticsearch |
| **Messaging** | Apache Kafka, Zookeeper |
| **Infrastructure** | Docker, Kubernetes (Kind) |
| **Service Mesh** | Istio (Envoy Proxy, Istiod) |
| **DevOps** | Jenkins, Git |
| **Observability** | Prometheus, Grafana, Kiali |

---

## 🧩 Microservices Breakdown

### 1. Core Business Services
*   **Auth Service:** Manages JWT authentication and RBAC (Roles/Permissions).
    *   *Schema:* ![Auth Schema](assets/Database_Schema_for_the_Authentication_Service.png)
    *   *Flow:* ![User Invitation](assets/Sequence_Diagram_for_User_Invitation_and_Activation_Flow.png)
*   **Product Service:** Manages catalog, inventory, and dynamic pricing.
    *   *Schema:* ![Product Schema](assets/Database_Schema_for_the_Product_Service..png)
*   **Order Service:** Handles order lifecycle and denormalizes data for performance.
    *   *Schema:* ![Order Schema](assets/_Database_Schema_for_the_Order_Service.png)
    *   *Security:* Uses a payload enrichment pattern to prevent price manipulation.
    *   *Diagram:* ![Order Enrichment](assets/Sequence_Diagram_of_the_Order_Enrichment_Flow.png)

### 2. Support & Utility Services
*   **Cart Service (Redis):** High-speed shopping cart management.
    *   *Flow:* ![Guest Cart](assets/Sequence_Diagram_for_Guest_Cart_to_User_Cart_Association.png)
*   **Search Service (Elasticsearch):** Full-text search engine synchronized via Kafka.
    *   *Flow:* ![Search Flow](assets/Sequence_Diagram_of_a_Client-Facing_Product_Search_Request.png)
*   **Payment Service:** Simulates payment processing and compensating transactions.
    *   *Flow:* ![Failed Payment](assets/Sequence_Diagram_of_a_Failed_Payment_and_Asynchronous_Stock_Reversal.png)
*   **Notification Service:** Sends transactional emails triggered by Kafka events.
    *   *Flow:* ![Return Request](assets/Sequence_Diagram_for_a_Return_Request_and_Multi-Service_Notification.png)

---

## 🚀 DevOps & Infrastructure

### CI/CD Pipeline
The project utilizes a dual-pipeline strategy in **Jenkins**: one for Infrastructure (Idempotent Setup) and one for Application Deployment.

![CI/CD Strategy](assets/Dual-Pipeline_CICD_Strategy_for_Infrastructure_and_Application.png)
![Jenkins Pipeline](assets/A_Diagrammatic_Representation_of_the_Application_Jenkinsfile_Pipeline.png)

### Service Mesh & Observability
We use **Istio** for traffic management and **Kiali** for visualizing the mesh topology.

*   **Istio Traffic Control:**
    ![Istio Layer](assets/Istio's_Layered_Traffic_Management_for_Internal_Services.png)
*   **Kiali Traffic Graph:**
    ![Kiali Graph](assets/kiali_traffic.png)
*   **Grafana Dashboard:**
    ![Grafana](assets/grafana.png)

---

## 📊 Experimental Results

We compared the **Baseline (Static Round-Robin)** against the **AI-Controlled (Q-Learning)** approach under various load scenarios using **k6**.

### Experiment 1: Moderate Load (40 VUs)
The AI agent successfully smoothed out latency spikes that destabilized the baseline.
![Exp 1](assets/FILENAME_FOR_EXP1.png)

### Experiment 2: High Load (100 VUs)
**Result:** The Baseline system suffered a catastrophic failure (flatline). The AI system degraded gracefully, maintaining throughput and availability.
![Exp 2](assets/FILENAME_FOR_EXP2.png)

### Experiment 3: Read-Intensive Load (200 VUs)
After a brief "learning phase" (exploration), the AI agent converged on an optimal policy, achieving **45% lower P99 latency** than the baseline.
![Exp 3](assets/FILENAME_FOR_EXP3.png)

---

## 💻 Application Showcase

**Storefront:**
![Storefront](assets/store_front.png)

**Product Details:**
![Product](assets/product.png)

**Order Management:**
![Orders](assets/order.png)

**Admin Dashboard (Stats Service):**
![Admin Dashboard](assets/admin_dashboard.png)

**RBAC Management:**
![RBAC](assets/admin_rbac.png)

---

## ⚙️ Installation & Setup

### Prerequisites
*   Docker & Docker Compose
*   Kind (Kubernetes in Docker)
*   Kubectl & Istioctl

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/lirmm-ecommerce.git
    cd lirmm-ecommerce
    ```

2.  **Bootstrap the Cluster:**
    Run the setup script to create the Kind cluster and install Istio.
    ```bash
    ./kind-deployment/setup-kind.sh
    ```
    ![Kubectl Pods](assets/kubectl_get_pods.png)

3.  **Deploy Infrastructure:**
    ```bash
    kubectl apply -f kind-deployment/infra-manifests.yaml
    ```

4.  **Deploy Microservices:**
    ```bash
    kubectl apply -f kind-deployment/app-manifests.yaml
    ```

5.  **Start the AI Controller:**
    ```bash
    cd ai-controller
    python3 control_loop.py
    ```

6.  **Access the App:**
    The application is exposed via NodePort. Visit `http://localhost:3000`.

---

## 🔮 Future Work
*   **Deep Q-Networks (DQN):** To handle continuous state spaces and more complex metrics.
*   **Predictive Scaling:** Integrating LSTM models to forecast traffic spikes before they happen.
*   **Cloud Migration:** Moving from Kind to a managed cluster (EKS/GKE) with persistent storage volumes.

---

## 📜 License
This project is part of an engineering thesis.
Copyright © 2025 Harche Samir.
