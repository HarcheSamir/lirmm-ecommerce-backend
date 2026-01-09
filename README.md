# Design, Implementation, and AI-Driven Optimization of a Microservices Architecture using DevOps Principles.
---

## 🚀 Operational Intelligence & Observability
**"This is not just a web app; it's a self-healing distributed system."**

Before diving into the code, here is the system running under load. The platform utilizes **Istio Service Mesh** for traffic control and **Kiali/Prometheus** for real-time observability.

### Live Traffic Topology (Service Mesh)
Below is the live mesh visualization showing 12+ microservices communicating asynchronously via Kafka and synchronously via HTTP.

<div align="center">
  <img src="assets/kiali_traffic.png" width="800">
  <br>
  <em>Figure 1: Real-time traffic flow visualization in Kiali.</em>
</div>

<br>

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Service Graph</strong></td>
      <td align="center"><strong>Mesh Density</strong></td>
    </tr>
    <tr>
      <td align="center"><img src="assets/kiali_service_graph.png" width="600"></td>
      <td align="center"><img src="assets/kiali_mesh.png" width="600"></td>
    </tr>
  </table>
</div>

### Real-Time Monitoring & Infrastructure
The system runs on **Kubernetes (Kind)** with **Envoy Sidecars** injected into every pod.

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Grafana Metrics Dashboard</strong><br><img src="assets/grafana.png" width="600"></td>
      <td align="center"><strong>Service Health (Kiali)</strong><br><img src="assets/kiali_services.png" width="600"></td>
    </tr>
  </table>
  <br>
  <strong>Kubernetes Pod Status (CLI)</strong>
  <br>
  <img src="assets/kubectl_get_pods.png" width="600">
</div>

---

## ⚙️ DevOps & Automation (CI/CD)
The infrastructure is strictly **Infrastructure as Code (IaC)**. I implemented a robust **Jenkins** dual-pipeline strategy: one for bootstrapping the cluster/mesh and another for application deployment.

<div align="center">
  <img src="assets/Dual-Pipeline_CICD_Strategy_for_Infrastructure_and_Application.png" width="700">
  <p><em>Dual-Pipeline Architecture</em></p>
</div>

<div align="center">
  <div>
    <strong>Jenkins Dashboard</strong><br>
    <img src="assets/localhost.8080.png" width="800">
  </div>

  <br>

  <div>
    <strong>Pipeline Execution</strong><br>
    <img src="assets/.job.Infrastructure-Setup.multi-pipeline-graph2.png" width="800">
  </div>

  <br>

  <div>
    <strong>Infrastructure Setup Job</strong><br>
    <img src="assets/.job.Infrastructure-Setup.multi-pipeline-graph.png" width="800">
  </div>

  <br>

  <div>
    <strong>App Pipeline Diagram</strong><br>
    <img src="assets/A_Diagrammatic_Representation_of_the_Application_Jenkinsfile_Pipeline.png" width="400">
  </div>
</div>


---

## 💻 Application Showcase
A fully functional, full-stack E-Commerce application built with **Node.js, React, and PostgreSQL**.


### Administrative Control
<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Analytics Dashboard</strong><br><img src="assets/admin_dashboard.png" width="500"></td>
      <td align="center"><strong>RBAC Management</strong><br><img src="assets/admin_rbac.png" width="500"></td>
    </tr>
  </table>
</div>


### Customer Facing
<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Storefront</strong><br><img src="assets/store_front.png" width="500"></td>
      <td align="center"><strong>Product Details</strong><br><img src="assets/product.png" width="500"></td>
    </tr>
    <tr>
      <td align="center"><strong>Order Checkout</strong><br><img src="assets/order.png" width="500"></td>
      <td align="center"><strong>Order History</strong><br><img src="assets/commandes.png" width="500"></td>
    </tr>
  </table>
</div>


---

## 🧠 The AI Innovation: Q-Learning Load Balancer
Most systems crash under high load. This system learns.

I developed an **AI Controller** (Python) that interfaces with the Service Mesh. It uses **Reinforcement Learning (Q-Learning)** to watch system metrics (Latency, Error Rates) and dynamically patches Istio VirtualServices to route traffic efficiently.

<div align="center">
  <img src="assets/AI_Controller_Feedback_and_Control_Loop.png" width="400">
  <p><em>The AI Control Loop</em></p>
</div>

### Performance Results (Baseline vs. AI)
We ran stress tests using **k6** (up to 200 concurrent users).

#### 1. Moderate Load (40 VUs)
The AI stabilizes latency spikes that occur in the Round-Robin baseline.
<div align="center">
<img src="assets/FILENAME_FOR_EXP1.png" width="800">
</div>

#### 2. High Complexity Load (100 VUs) - **CRITICAL RESULT**
**The Baseline System (Teal) Crashed:** Flatlined at 20 mins.
**The AI System (Orange) Survived:** It sacrificed some latency to maintain availability, processing 27% more requests.
<div align="center">

<img src="assets/FILENAME_FOR_EXP2.png" width="800">
</div>

#### 3. Read-Intensive Load (200 VUs)
After a 2-minute "exploration/learning" phase, the AI converged on an optimal policy, achieving **45% lower P99 latency** than the baseline.
<div align="center">
<img src="assets/FILENAME_FOR_EXP3.png" width="800">
</div>

---

## 🏗 Architecture & System Design

### High-Level Architecture
The system follows a Microservices pattern with **Polyglot Persistence** and **Event-Driven Architecture (Kafka)**.

<div align="center">
  <img src="assets/architecture.png" width="800">
</div>

### Data & Communication Strategy
Services own their data. We use **Eventual Consistency** to keep data in sync (e.g., denormalizing User data into the Order service).

<div align="center">
  <img src="assets/Polyglot_Persistence_Strategy_Across_Services.png" width="400">
  <img src="assets/Eventual_Consistency_via_Kafka_for_User_Data_Denormalization.png" width="400">
</div>

### AI & Traffic Engineering
<div align="center">
  <img src="assets/Operational_Flow_of_the_AI_Controller_Learning_Cycle.png" width="400">
  <img src="assets/Istio_Traffic_Routing_for_the_product-service_(Baseline_Scenario).png" width="400">
  <br><br>
  <img src="assets/Istio's_Layered_Traffic_Management_for_Internal_Services.png" width="600">
</div>

---

## 📂 Detailed Design Specifications (Schemas & Sequences)

<details>
<summary><strong>Click to expand Database Schemas</strong></summary>
<br>
<div align="center">
  <table>
    <tr>
      <td><strong>Auth Service</strong></td>
      <td><strong>Product Service</strong></td>
    </tr>
    <tr>
      <td><img src="assets/Database_Schema_for_the_Authentication_Service.png" width="400"></td>
      <td><img src="assets/Database_Schema_for_the_Product_Service..png" width="400"></td>
    </tr>
    <tr>
      <td colspan="2" align="center"><strong>Order Service (Denormalized)</strong></td>
    </tr>
    <tr>
      <td colspan="2" align="center"><img src="assets/_Database_Schema_for_the_Order_Service.png" width="600"></td>
    </tr>
  </table>
</div>
</details>

<details>
<summary><strong>Click to expand Sequence Diagrams (Business Logic)</strong></summary>
<br>
<div align="center">
  <h3>User Flows</h3>
  <img src="assets/Sequence_Diagram_for_User_Invitation_and_Activation_Flow.png" width="700">
  <br><br>
  <img src="assets/Sequence_Diagram_for_Guest_Cart_to_User_Cart_Association.png" width="700">
  
  <h3>Order Processing & Security</h3>
  <p><em>Payload Enrichment to prevent price tampering:</em></p>
  <img src="assets/Sequence_Diagram_of_the_Order_Enrichment_Flow.png" width="700">
  <br><br>
  <img src="assets/Sequence_Diagram_of_a_Successful_Credit_Card_Order_Workflow.png" width="700">

  <h3>Complex Event Handling (Saga Pattern)</h3>
  <p><em>Compensation transaction on failure:</em></p>
  <img src="assets/Sequence_Diagram_of_a_Failed_Payment_and_Asynchronous_Stock_Reversal.png" width="700">
  <br><br>
  <img src="assets/Sequence_Diagram_for_a_Return_Request_and_Multi-Service_Notification.png" width="700">
  
  <h3>Search (Elasticsearch)</h3>
  <img src="assets/Sequence_Diagram_of_a_Client-Facing_Product_Search_Request.png" width="700">
</div>
</details>

---

## 🛠 Tech Stack Summary

| Category | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **AI Controller** | Python, Q-Learning (NumPy/Pandas) |
| **Databases** | PostgreSQL, Redis, Elasticsearch |
| **Messaging** | Apache Kafka |
| **Containerization** | Docker, Kubernetes (Kind) |
| **Service Mesh** | Istio, Envoy |
| **Observability** | Prometheus, Grafana, Kiali |
| **Testing** | k6 (Load Testing), Jest |

---

## 📜 License
Copyright © 2025 Harche Samir.
