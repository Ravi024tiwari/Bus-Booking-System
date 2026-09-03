<div align="center">

# 🚌 SeatPlus (TripGo) - Smart Bus Booking & Fleet Management Platform

[![CI/CD Pipeline](https://github.com/Ravi024tiwari/Bus-Booking-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ravi024tiwari/Bus-Booking-System/actions/workflows/deploy.yml)
[![Docker Image](https://img.shields.io/badge/Docker%20Hub-ravitiwari005%2Fbusbookingservice-blue?logo=docker)](https://hub.docker.com/r/ravitiwari005/busbookingservice)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node-v20+-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ%20%26%20Locking-DC382D?logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A high-performance, enterprise-ready bus ticket booking, operator fleet tracking, and administrative orchestration platform powered by Next.js 16, Custom Socket.io, BullMQ, Redis, and MongoDB.**

[🌐 Live Demo (Render)](https://busbookingservice-latest.onrender.com) • [📖 Architecture](#-architecture--system-design) • [🚦 Workflows](#-end-to-end-platform-workflows) • [🚀 Quickstart](#-getting-started) • [🐳 Docker Setup](#-docker--container-deployment) • [💡 Ideas & Contributing](#-ideas--contributing)

</div>

---

## 🌟 Key Highlights & Innovations

- **⚡ Real-Time Seat Locking & Color-Coded Matrix**: Socket.io backed with Redis atomic lock mechanisms prevents double-booking race conditions during high-demand surges. Occupied/held seats dynamically reflect with real-time visual statuses.
- **🛣️ Auto-Calculated Stop Distances & Route Metrics**: Adding intermediate sub-stops automatically aggregates total distance (KM) on the fly, calculating precise segment distances and journey durations for passenger boarding/dropping points.
- **🚦 Production-Grade Guided Trip State Machine**: Operators manage trips through an enforced, forward-only lifecycle (`SCHEDULED` ➔ `BOARDING` ➔ `DEPARTED` ➔ `IN_TRANSIT` ➔ `ARRIVED`), with strict time-window validations and confirmation modals.
- **⏱️ Automated Stale Trip Reconciler & Auto-Cancellation**: Unstarted or abandoned runs past their departure window are automatically reconciled and marked `CANCELLED` to keep searches clean.
- **🔄 Asynchronous Queue Processing**: BullMQ queues handle automated seat-release timeouts, booking status reconciliations, and background notification tasks.
- **📱 Mobile BFCache Hardening**: Zero-leak authentication lifecycle with Back-Forward Cache (BFCache) invalidation and hard document redirection on logout.
- **📍 Real-Time Live Bus Tracking**: GPS / Coordinate broadcasting from operator dashboards directly to user booking screens over WebSockets.
- **💳 End-to-End Payments**: Seamless Razorpay checkout with webhook simulation, signature verification, and automated ticket generation.

---

## 🏗️ Architecture & System Design

```mermaid
flowchart TD
    Client["🌐 Client (Desktop / Mobile Browser)"]
    
    subgraph AppServer["🚀 Express & Next.js Custom Server"]
        NextCore["Next.js 16 (App Router + Server Actions)"]
        SocketServer["Socket.io Engine (Real-Time Events)"]
        BullWorker["BullMQ Worker (Queue Processing)"]
        Reconciler["Trip Reconciliation & Auto-Sweeper"]
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
    Reconciler <--> Mongo
    NextCore --> Razorpay
    NextCore --> Cloudinary
```

---

## 🚦 End-to-End Platform Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    actor Operator as Bus Operator
    actor Passenger as Customer

    Note over Admin: 1. Route & Infrastructure Setup
    Admin->>Admin: Creates Route template (Stops, Auto-calculated Distances, Fares)
    
    Note over Operator: 2. Fleet & Trip Scheduling
    Operator->>Operator: Adds Bus & Schedules Trip on Route
    
    Note over Passenger: 3. Search & Booking
    Passenger->>Passenger: Searches Source ➔ Destination with filters
    Passenger->>Passenger: Selects Boarding & Dropping Points (Live Segment Distance)
    Passenger->>Passenger: Locks Seat (Redis Atomic Hold & Socket.io broadcast)
    Passenger->>Passenger: Completes Razorpay Payment
    
    Note over Operator: 4. Guided Journey Operations
    Operator->>Operator: Advances Status (SCHEDULED ➔ BOARDING ➔ DEPARTED ➔ IN_TRANSIT ➔ ARRIVED)
    Operator-->>Passenger: Real-time Socket.io status update reflected on Passenger UI
    
    Note over Passenger: 5. Review & Rating
    Passenger->>Passenger: Rates completed journey (1 to 5 stars)
```

---

## 📦 Role-Based Feature Modules

### 👤 Customer Portal
- 🔍 **Interactive Trip Search**: Dynamic filtering by departure, arrival, bus types (AC / Sleeper / Seater), dates, and operators.
- 💺 **Interactive Seat Matrix**: Visual seat selection with live occupancy color-coding, segment bounds, and countdown hold timers.
- 🛣️ **Dynamic Segment Details**: Displays exact KM distance and estimated duration between chosen boarding and dropping stops.
- 💳 **Instant Checkout & Ticketing**: Razorpay payments, dynamic fare breakdown, promo/rewards balance usage.
- 📋 **Trip Dashboard & Live Tracking**: Real-time status badges, GPS bus tracking, booking history, and 1-click cancellations.
- ⭐ **Verified Journey Ratings**: Verified passengers can submit ratings and reviews upon journey completion.

### 🚍 Operator Portal
- 🚌 **Fleet Management**: Add, update, and manage bus fleets, seat matrix configurations, and amenities.
- 📅 **Trip Scheduling**: Create daily/recurring route schedules, assign buses, custom pricing, and promotional discount campaigns.
- 🎯 **Guided State-Machine Controls**: Context-aware action buttons (`Start Boarding`, `Mark Departed`, `Mark In-Transit`, `Mark as Arrived`) with confirmation modals.
- 📡 **Live GPS Tracker Broadcasting**: Broadcast live bus coordinates to active passengers.
- 📊 **Manifest & Occupancy Analytics**: Real-time passenger check-in rosters and seat fill-rates.

### 🛡️ Admin Dashboard
- 📈 **Executive Analytics**: Gross ticket sales, active fleets, passenger demographics, and route profitability charts.
- 🛣️ **Route Builder & Inspection**: Visual stop sequence builder with auto-calculated distance in KM and full tabular inspection modal.
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
| **Authentication** | [Better-Auth](https://better-auth.com/) & JSON Web Tokens (JWT) with HTTP-Only Cookie Sessions & BFCache hardening |
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

## 🧪 Quick Test & Demo Scenarios

Want to quickly test the entire workflow? Follow this test script:

1. **Register as an Operator**:
   - Go to `/register` and select **Bus Operator**.
   - Create a Bus in the Operator Fleet view (`/operator/buses`).
   - Create a Route in `/admin/routes` with intermediate stops (verify total distance auto-calculation).
   - Schedule a Trip on that Route in `/operator/trips`.
2. **Book as a Passenger**:
   - Open an incognito window, register as **Passenger** (`/register`).
   - Search for the trip, select boarding/dropping stops, and pick a seat.
   - Observe the seat color changing and temporary hold countdown.
   - Complete checkout via Razorpay Test mode.
3. **Advance Trip Lifecycle**:
   - In the Operator window, advance status from `SCHEDULED` ➔ `BOARDING` ➔ `DEPARTED`.
   - In the Passenger window, observe the live badge updating without refreshing!

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

## 💡 Ideas & Roadmap

We are continuously evolving SeatPlus (MoveGo). Here are some upcoming ideas and exploration areas:

- [ ] **AI Trip Demand Prediction**: Machine learning model forecasting peak travel periods to recommend dynamic surge pricing to operators.
- [ ] **WhatsApp & SMS Ticket Delivery**: Automated ticket PDFs and booking confirmations via Twilio / WhatsApp Business API.
- [ ] **Native Mobile App (React Native / Expo)**: Cross-platform iOS and Android companion app with background GPS tracking for drivers.
- [ ] **Multi-Currency & International Gateway**: Stripe and PayPal integration for cross-border transit bookings.
- [ ] **Live Driver App PWA**: Offline-capable Progressive Web App for ticket scanning with QR codes at boarding gates.

Got an idea or feedback? Open a [GitHub Discussion](https://github.com/Ravi024tiwari/Bus-Booking-System/discussions) or submit a feature proposal!

---

## 🤝 Contributing

Contributions make the open-source community an incredible place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

1. **Fork** the Project.
2. **Create your Feature Branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**:
   ```bash
   git commit -m "feat: add some AmazingFeature"
   ```
4. **Push to the Branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request** with a detailed explanation of your improvements and testing notes.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Ravi024tiwari">Ravi Tiwari</a> & Open Source Contributors</sub>
</div>
