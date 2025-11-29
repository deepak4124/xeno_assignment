# Xeno Assignment - Scalable Data Ingestion & Analytics Platform

## 1. Problem Statement
The objective was to build a robust, scalable system capable of ingesting high-volume data (Customers, Orders, Products) from an E-commerce platform (Shopify). The system needed to:
- Handle incoming **Webhooks** efficiently without timing out.
- Support **Historical Data Sync** for existing store data.
- Manage **Rate Limiting** from the external API.
- Provide a **Real-time Dashboard** to visualize key metrics (Revenue, Top Customers) and monitor system health (Live Logs).
- Ensure **Data Consistency** and handle failures gracefully.

## 2. Solution
To address these challenges, I implemented an **Event-Driven Architecture** using **NATS JetStream**. This decouples the data ingestion layer from the data processing layer, allowing the system to handle bursts of traffic without overwhelming the database or the external API.

### Key Features
- **Asynchronous Processing**: Webhooks are acknowledged immediately (200 OK) and published to a message queue (NATS). Workers process these messages in the background.
- **Resilience**: NATS JetStream ensures message persistence. If a worker fails, the message is redelivered.
- **Rate Limit Handling**: The worker respects Shopify's API rate limits (429 Too Many Requests) by backing off and retrying.
- **Idempotency**: Database operations use `upsert` to prevent duplicate records.
- **Live Monitoring**: A "Live Event Terminal" on the frontend streams system logs (INFO, WARN, ERROR) directly from the database, providing visibility into the ingestion process.

## 3. Architecture

```mermaid
graph TD
    %% External Actors
    Shopify[Shopify Platform]
    User[Dashboard User]

    %% Backend Services
    subgraph "Backend Infrastructure"
        API[Express API Gateway]
        NATS[NATS JetStream
(Message Queue)]
        Worker[Background Worker Service]
    end

    %% Data Storage
    subgraph "Persistence"
        DB[(PostgreSQL
Prisma ORM)]
    end

    %% Frontend
    subgraph "Frontend"
        Dashboard[Next.js Dashboard]
    end

    %% Flows
    Shopify -- "Webhooks (Orders/Customers)" --> API
    User -- "Trigger Sync" --> API
    
    API -- "Publish Event
(webhook.* / ingest.*)" --> NATS
    
    NATS -- "Consume Event" --> Worker
    
    Worker -- "Fetch Data (if Sync)" --> Shopify
    Worker -- "Upsert Data" --> DB
    Worker -- "Log Events" --> DB
    
    Dashboard -- "Poll Stats & Logs" --> API
    API -- "Query Analytics" --> DB
```

## 4. Tech Stack

### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Message Queue**: NATS (JetStream)
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI (Radix Primitives)
- **Charts**: Recharts
- **Data Fetching**: SWR

## 5. Setup & Installation

### Prerequisites
- Node.js (v18+)
- Docker (for NATS and PostgreSQL)
- PostgreSQL (Local or Cloud)

### Environment Variables
Create a `.env` file in `apps/backend`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/xeno_db"
NATS_URL="nats://localhost:4222"
PORT=4000
SHOPIFY_API_KEY="your_key"
SHOPIFY_API_SECRET="your_secret"
SHOPIFY_ACCESS_TOKEN="your_token"
SHOP_DOMAIN="your-shop.myshopify.com"
```

### Running the Project

1. **Start Infrastructure (NATS & Postgres)**
   Ensure your database and NATS server are running.

2. **Backend Setup**
   ```bash
   cd apps/backend
   npm install
   npx prisma generate
   npx prisma db push  # Apply schema
   npm run dev         # Runs on Port 4000
   ```

3. **Frontend Setup**
   ```bash
   cd apps/frontend
   npm install
   npm run dev         # Runs on Port 3000
   ```

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks` | Receives Shopify webhooks (verifies HMAC). |
| `POST` | `/api/sync` | Triggers a historical data sync job. |
| `GET` | `/api/stats` | Returns aggregated dashboard metrics. |
| `GET` | `/api/sync-status` | Returns recent system logs for the terminal. |
| `GET` | `/api/top-customers` | Returns top 5 customers by spending. |

## 7. Testing
The project includes comprehensive unit and integration tests.
```bash
cd apps/backend
npm test
```
*Tests cover: Webhook validation, NATS message processing, Database ingestion logic, and API endpoints.*