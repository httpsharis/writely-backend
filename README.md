# Writely Backend API

> An enterprise-grade, feature-based Express & TypeScript REST API powering the Writely novel studio and world-building engine.

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb)
![Clerk Auth](https://img.shields.io/badge/Auth-Clerk%20SDK-6C47FF?style=flat-square&logo=clerk)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=flat-square&logo=cloudinary)

🔗 **Repositories & Live Links**:
- ⚙️ **Backend REST API**: [https://github.com/httpsharis/writely-backend](https://github.com/httpsharis/writely-backend)
- 🌐 **Frontend Web App**: [https://github.com/httpsharis/writely](https://github.com/httpsharis/writely)
- 🚀 **Live Demo**: [https://writely-rho.vercel.app](https://writely-rho.vercel.app)

---

## Overview

**Writely Backend** is a feature-encapsulated REST API engineered for novel drafting, world-building, document management, and time-series writing analytics. Built with Node.js, Express, TypeScript, and MongoDB, it implements strict domain boundaries, automated Just-In-Time (JIT) Clerk user synchronization, robust security controls, and high-performance MongoDB aggregations.

The backend serves both the Next.js frontend web workspace and future mobile/client integrations via a unified API contract.

---

## Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Server** | Node.js 20.x / Express 4.x | Fast, event-driven HTTP application server |
| **Language** | TypeScript 5.x | Strict type definitions across controllers, services, and schemas |
| **Database & ODM** | MongoDB 7.x + Mongoose 9 | Primary document store with pooled connections & aggregation pipelines |
| **Authentication** | Clerk (`@clerk/express`) | Bearer token validation & JIT user synchronization into MongoDB |
| **Validation** | Zod | Schema validation middleware for incoming request payloads |
| **Media Pipeline** | Cloudinary + Multer | Memory-less direct image streaming for covers & avatars |
| **Security Hardening** | Helmet, CORS, Mongo-Sanitize, Express-Rate-Limit | Defense-in-depth security, XSS protection, and DDoS prevention |
| **Process Dev Tooling**| `tsx watch`, `cross-env` | Fast TypeScript execution runtime with instant hot reloading |

---

## Architecture & Directory Layout

The application follows **Domain-Driven Design (DDD)** principals. Each feature domain encapsulates its routes, controllers, services, and Mongoose schemas inside its own folder under `src/api/`.

```text
writely-backend/
├── src/
│   ├── api/                    # Domain Feature Modules
│   │   ├── analytics/          # Word count snapshots, streak calculations, writing stats
│   │   ├── auth/               # User session verification & Clerk profile routing
│   │   ├── character/          # Character database, relationships & role classifications
│   │   ├── document/           # Novel & chapter hierarchy, Tiptap JSON content, publishing
│   │   ├── export/             # Manuscript compilation & Markdown archive exporter
│   │   ├── like/               # Engagement metrics for public reader manuscripts
│   │   ├── note/               # Relational lore notes, timelines, plot research
│   │   ├── profile/            # User profile aggregation feeds & stats
│   │   ├── search/             # Global search index across novels & world lore
│   │   ├── upload/             # Direct Cloudinary image streaming controller
│   │   └── user/               # User document management & BFF orchestration
│   ├── config/                 # Mongoose connection pooling & Cloudinary SDK setup
│   ├── middleware/             # Security, auth guarding, validation & error handling
│   │   ├── authMiddleware.ts   # Clerk JWT validation & JIT MongoDB user creation
│   │   ├── errorHandler.ts     # Global centralized error handler
│   │   ├── rateLimitMiddleware.ts # API rate-limiting rules
│   │   ├── uploadMiddleware.ts # Multer Cloudinary storage engine
│   │   └── validateMiddleware.ts # Zod schema validation middleware
│   ├── utils/                  # Domain errors, date helpers, slug generation
│   ├── app.ts                  # Express application setup, middleware chain & routes
│   └── server.ts               # Fail-fast env checks, DB boot & graceful shutdown
├── Dockerfile                  # Container build instructions
├── docker-compose.yml          # Container orchestration
└── package.json
```

---

## Key Features & Security Architecture

### 1. Clerk Authentication & JIT User Synchronization
- All protected endpoints pass through `authMiddleware.ts`.
- Extracts the verified Clerk User ID from the request header (`Bearer <token>`).
- Performs a **Just-In-Time (JIT) sync**: If a corresponding MongoDB user record does not exist, it queries Clerk's API, provisions a new `User` document in MongoDB, and attaches the local `_id` to `req.user`.

### 2. Time-Series Analytics Engine
- Uses a **snapshot strategy** to track word count progress without database inflation.
- Records absolute word counts with a **5-minute cooldown guard** during active writing sessions.
- Aggregation pipelines compute daily word deltas and calculate consecutive writing streaks on demand.

### 3. IDOR & Ownership Protection
- Resource ownership is verified across the entity hierarchy before any mutation.
- Requests targeting characters, notes, or chapters verify that `parentNovel.owner === req.user.userId`.

### 4. Memory-Less Cloud Storage Pipeline
- Image uploads (novel covers and character avatars) are streamed directly from the request stream to Cloudinary via `multer-storage-cloudinary`.
- Eliminates temporary disk I/O and prevents memory spikes on server nodes.

### 5. Graceful Shutdown & Fail-Fast Startup
- Environment variables (`CLERK_SECRET_KEY`, `MONGODB_URI`) are validated at startup before accepting traffic.
- Process handlers for `SIGINT` and `SIGTERM` gracefully drain active HTTP connections and safely close MongoDB connections.

---

## API Endpoints Reference

### Authentication & Users — `/api/users` · `/api/auth`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | 🔒 Clerk | Get current authenticated user profile |
| `GET` | `/api/users/profile` | 🔒 Clerk | Get user dashboard metrics & aggregated feeds |
| `PATCH` | `/api/users/profile` | 🔒 Clerk | Update user profile & preferences |

### Documents & Manuscripts — `/api/documents`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents/novels` | 🔒 Clerk | Fetch all novels owned by the user |
| `POST` | `/api/documents` | 🔒 Clerk | Create a new novel or chapter |
| `GET` | `/api/documents/:id` | 🔒 Clerk | Fetch a single document by ID |
| `PUT` | `/api/documents/:id` | 🔒 Clerk | Update document title, content, or status |
| `DELETE` | `/api/documents/:id` | 🔒 Clerk | Soft-delete document (`deletedAt`) |
| `GET` | `/api/documents/public/:slug`| Public | Fetch published document for reader mode |

### World-Building — `/api/characters` · `/api/notes`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/characters/novel/:novelId` | 🔒 Clerk | List all characters for a specific novel |
| `POST` | `/api/characters/novel/:novelId` | 🔒 Clerk | Create a character with role & traits |
| `PUT` | `/api/characters/:id` | 🔒 Clerk | Update character sheet details |
| `DELETE` | `/api/characters/:id` | 🔒 Clerk | Delete character entry |
| `GET` | `/api/notes/novel/:novelId` | 🔒 Clerk | List lore notes (filterable by type) |
| `POST` | `/api/notes/novel/:novelId` | 🔒 Clerk | Create plot, world, or timeline note |

### Analytics & Utilities — `/api/analytics` · `/api/export` · `/api/upload`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analytics/snapshot` | 🔒 Clerk | Record writing snapshot for word tracking |
| `GET` | `/api/analytics/dashboard` | 🔒 Clerk | Get daily stats, total words & active streak |
| `GET` | `/api/export/novels/:id/markdown` | 🔒 Clerk | Export complete novel as Markdown file |
| `PATCH` | `/api/upload/novels/:id/cover` | 🔒 Clerk | Upload novel cover image to Cloudinary |
| `PATCH` | `/api/upload/characters/:id/avatar` | 🔒 Clerk | Upload character avatar image |

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.17+` or `v20+`
- **pnpm**: `v8+` or `v9+`
- **MongoDB**: Atlas Cluster or local MongoDB database instance (`v6+` / `v7+`)
- **Clerk Account**: Secret key from [Clerk Dashboard](https://dashboard.clerk.com/)
- **Cloudinary Account**: Cloud name, API key & API secret for image storage

### 1. Installation

```bash
# Clone the Backend Repository
git clone https://github.com/httpsharis/writely-backend.git
cd writely-backend
pnpm install

# Clone the Frontend Repository
git clone https://github.com/httpsharis/writely.git
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/writely

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:4000`.

### 4. Build and Run Production

```bash
pnpm build
pnpm start
```

---

## Active Refactoring & Open to Collaboration 🤝

The Writely Backend architecture is actively undergoing continuous refactoring to enhance performance, modularity, and API design. **Contributions, pull requests, and suggestions are welcomed!**

### High-Priority Areas for Contribution

- **Automated Testing Suite**: Adding unit and integration test coverage with Vitest / Supertest.
- **OpenAPI / Swagger Documentation**: Implementing auto-generated OpenAPI spec generation for API routes.
- **Real-Time Collaboration**: Developing a WebSocket (Socket.io or `ws`) server extension for multi-user co-authoring.
- **Redis Caching Tier**: Caching user dashboard stats and public reader endpoints to reduce MongoDB read load.
- **Export Formats**: Adding support for compiling manuscripts to `.epub` and `.pdf` formats.

### Contribution Guidelines

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/backend-improvement
   ```
2. Adhere to strict TypeScript interfaces and domain separation.
3. Ensure formatting and linting pass clean:
   ```bash
   pnpm lint
   pnpm build
   ```
4. Submit a **Pull Request** explaining your implementation details and testing steps.

---

## License

This backend repository is under active development and open for community collaboration.