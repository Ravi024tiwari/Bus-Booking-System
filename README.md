<div align="center">

# 🚌 SeatPlus (MoveGo) - Smart Bus Booking & Fleet Management Platform

[![CI/CD Pipeline](https://github.com/Ravi024tiwari/Bus-Booking-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ravi024tiwari/Bus-Booking-System/actions/workflows/deploy.yml)
[![Docker Image](https://img.shields.io/badge/Docker%20Hub-ravitiwari005%2Fbusbookingservice-blue?logo=docker)](https://hub.docker.com/r/ravitiwari005/busbookingservice)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node-v20+-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ%20%26%20Locking-DC382D?logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A high-performance, real-time bus ticket booking, operator fleet tracking, and administrative orchestration platform powered by Next.js 16, Custom Socket.io, BullMQ, Redis, and MongoDB.**

[🌐 Live Demo (Render)](https://busbookingservice-latest.onrender.com) • [📖 Architecture](#-architecture--system-design) • [🚀 Quickstart](#-getting-started) • [🐳 Docker Setup](#-docker--container-deployment) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 Key Highlights

- **⚡ Real-Time Seat Locking & Sync**: Socket.io backed with Redis atomic lock mechanisms prevents double-booking race conditions during high-demand booking surges.
- **🔄 Asynchronous Queue Processing**: BullMQ job queues handle automated seat-release timeouts, booking status reconciliations, and background operations.
- **🛡️ Multi-Role Architecture (RBAC)**: Dedicated, isolated portals and permission layers for **Customers**, **Bus Operators**, and **Super Admins**.
- **💳 End-to-End Payments**: Seamless Razorpay checkout with webhook simulation & signature verification.
- **📍 Real-Time Live Bus Tracking**: GPS / Coordinate broadcasting from operator dashboards directly to user booking screens.
- **🚀 Production-Ready DevOps**: Multi-stage Dockerized builds, Docker Compose orchestration, and an automated GitHub Actions CI/CD pipeline deploying directly to Render.

---

## 🏗️ Architecture & System Design

```mermaid
flowchart TD
    Client["🌐 Client (Web / Mobile Browser)"]
    
    subgraph AppServer["🚀 Express & Next.js Custom Server"]
        NextCore["Next.js 16 (App Router + Server Components)"]
        SocketServer["Socket.io Engine (Real-Time Events)"]
        BullWorker["BullMQ Worker (Queue Processing)"]
    end
    
    subgraph DataStore["💾 Persistence & Cache Layer"]
        Mongo[("🍃 MongoDB (Mongoose Models)")]
        Redis[("⚡ Redis (BullMQ Queues & Temporary Seat Locks)")]
    end

    subgraph Integrations["🔌 External Services"]
        Razorpay["💳 Razorpay Payment Gateway"]
        Cloudinary["☁️ Cloudinary Asset Storage"]
    end

    Client <-->|"HTTP / SSR / REST API"| NextCore
    Client <-->|"WebSocket Events (Live Tracking / Seat Sync)"| SocketServer
    NextCore <--> Mongo
    NextCore <--> Redis
    SocketServer <--> Redis
    BullWorker <--> Redis
    BullWorker <--> Mongo
    NextCore --> Razorpay
    NextCore --> Cloudinary
```

---

## 📦 Role-Based Feature Modules

### 👤 Customer Portal
- 🔍 **Interactive Trip Search**: Dynamic filtering by departure, arrival, bus types (AC / Sleeper / Seater), dates, and operators.
- 💺 **Live Interactive Seat Layout**: Real-time seat selection with live occupancy updates and temporary hold timers.
- 💳 **Checkout & Instant Ticketing**: Razorpay payments, dynamic fare breakdown, promo/rewards balance usage.
- 📋 **Trip Management**: Real-time GPS bus tracking, booking history, PDF/invoice viewing, and 1-click cancellations.
- ❤️ **Wishlist & Saved Routes**: Bookmark frequent routes for quick re-booking.

### 🚍 Operator Portal
- 🚌 **Fleet Management**: Add, update, and manage bus fleets, seat matrix configurations, and amenities.
- 📅 **Trip Scheduling**: Create daily/recurring route schedules, assign drivers, pricing rules, and boarding/dropping points.
- 📡 **Live GPS Tracker Broadcasting**: Broadcast live bus coordinates to active passengers.
- 📊 **Manifest & Passenger Roster**: Instant passenger check-in rosters and seat occupancy analytics.

### 🛡️ Admin Dashboard
- 📈 **Executive Analytics**: Gross ticket sales, active fleets, passenger demographics, and route profitability charts.
- ⚖️ **Platform Approvals**: Manage operator onboarding, bus verifications, and route approvals.
- 💳 **Payment Logs & Reconciliation**: Full transaction audit trail with webhook status inspection.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide Icons](https://lucide.dev/), [Shadcn UI](https://ui.shadcn.com/) |
| **Backend & Realtime** | [Express 5](https://expressjs.com/), [Socket.io](https://socket.io/), [Node.js 20+](https://nodejs.org/), [TypeScript](https://www.typescriptlang.org/) |
| **Database & Caching** | [MongoDB 7.0+](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/), [Redis 7.0+](https://redis.io/) via [ioredis](https://github.com/redis/ioredis) |
| **Queues & Jobs** | [BullMQ](https://docs.bullmq.io/) (Asynchronous seat release timers & worker queues) |
| **Authentication** | [Better-Auth](https://better-auth.com/) & JSON Web Tokens (JWT) with HTTP-Only Cookie Sessions |
| **Payments & Media** | [Razorpay SDK](https://razorpay.com/docs/), [Cloudinary SDK](https://cloudinary.com/) |
| **DevOps & Containers** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/), [GitHub Actions](https://github.com/features/actions), [Render](https://render.com/) |

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the root directory (refer to [`.env.example`](file:///.env.example)):

```ini
# Application Port & Environment
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Databases & Cache
MONGODB_URI="mongodb://127.0.0.1:27017/seatpulse"
REDIS_URL="redis://127.0.0.1:6379"

# Security & Authentication
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-min"

# Razorpay Payments
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_id"

# Cloudinary Media Storage (Optional)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x`+
- **MongoDB**: Local daemon running on port `27017` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Redis**: Local daemon running on port `6379` or a free [Upstash Redis](https://upstash.com/) instance

### Local Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Ravi024tiwari/Bus-Booking-System.git
   cd Bus-Booking-System
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the Custom Server (Express + Socket.io + Next.js):**
   ```bash
   npm run dev:custom
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker & Container Deployment

### 1. Run Everything with Docker Compose (Recommended)

Run the entire application along with isolated MongoDB and Redis containers:

```bash
# Build and start all services in detached mode
docker compose up --build -d

# View live application logs
docker compose logs -f app

# Stop all services
docker compose down
```
Access the application at `http://localhost:3000`.

---

### 2. Manual Docker Build

```bash
# Build production image
docker build -t ravitiwari005/busbookingservice:latest .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/seatplus" \
  -e REDIS_URL="redis://default:token@..." \
  -e JWT_SECRET="your_jwt_secret" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  ravitiwari005/busbookingservice:latest
```

---

## 🔄 CI/CD & Automated Deployment Pipeline

This repository includes a fully configured **GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Git as GitHub Repository
    participant Actions as GitHub Actions Runner
    participant Hub as Docker Hub Registry
    participant Render as Render Cloud

    Dev->>Git: git push origin main
    Git->>Actions: Trigger CI/CD Workflow
    Actions->>Actions: Checkout code & compile Next.js
    Actions->>Hub: Build & Push Docker Image (latest)
    Actions->>Render: Trigger Deployment Webhook
    Render->>Hub: Pull new Docker Image
    Render->>Render: Zero-Downtime Rolling Redeploy
    Render-->>Dev: 🎉 Live at busbookingservice-latest.onrender.com
```

### GitHub Repository Secrets Required:
| Secret Name | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username (`ravitiwari005`) |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token |
| `RENDER_DEPLOY_HOOK_URL` | Web Service Deploy Hook URL from Render settings |

---

## 📁 Repository Structure

```
├── app/                        # Next.js 16 App Router pages & layouts
│   ├── actions/                # Server Actions
│   ├── admin/                  # Super Admin Dashboard & Management views
│   ├── api/                    # RESTful endpoints (Auth, Bookings, Trips, etc.)
│   ├── customer/               # Customer Booking, Seat Matrix, Wishlist & Tracking
│   ├── operator/               # Bus Operator Fleet & Trip management views
│   ├── login/ & register/      # Authentication pages
│   └── globals.css             # TailwindCSS v4 design tokens
├── components/                 # Reusable UI component library (Shadcn + custom)
├── lib/                        # Core utilities, DB client, Auth & Cloudinary
├── models/                     # Mongoose Schemas (User, Bus, Trip, Booking, etc.)
├── store/                      # Redux Toolkit state slices
├── server.ts                   # Custom Express + Socket.io + BullMQ HTTP Server
├── Dockerfile                  # Optimized multi-stage Docker build
├── docker-compose.yml          # Local container orchestration
└── .github/workflows/          # GitHub Actions CI/CD automation pipelines
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your Changes**:
   ```bash
   git commit -m "feat: add amazing new feature"
   ```
4. **Push to the Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** describing your changes and testing notes.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Ravi024tiwari">Ravi Tiwari</a> & Open Source Contributors</sub>
</div>
