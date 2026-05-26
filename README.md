<div align="center">

# Writely — Backend API

**An enterprise-grade REST API for a full-featured novel writing and world-building platform.**

Built with TypeScript · Express · MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Database Design](#database-design)
- [Security Model](#security-model)
- [Analytics Engine](#analytics-engine)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

Writely's backend powers a novelist's complete workflow — from writing and world-building to publishing and reader analytics. It is designed from the ground up as a **universal backend**, serving an identical API contract to the Writely web app (Next.js) and the forthcoming Android client.

The API is not a CRUD wrapper. It implements:

- A **time-series analytics engine** using the snapshot strategy for accurate word-count tracking without database flooding
- A **relational world-building engine** that links Characters and Notes to their parent Novels with strict ownership verification at every layer
- A **Backend-for-Frontend (BFF) orchestration layer** that compiles complex dashboard metrics into single, optimized payloads
- A **media pipeline** that streams uploads directly to Cloudinary, bypassing server memory entirely

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20.x | Server runtime |
| **Framework** | Express 4.x | HTTP server and routing |
| **Language** | TypeScript 5.x | Type safety across all layers |
| **Database** | MongoDB 7.x + Mongoose | Primary data store with advanced aggregation |
| **Authentication** | Google OAuth 2.0 + JWT | Passwordless auth via Google Identity |
| **Validation** | Zod | Runtime schema validation on all request bodies |
| **Media Storage** | Cloudinary + Multer | Direct-to-cloud image upload streaming |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize | Defence-in-depth HTTP hardening |
| **Logging** | Morgan | HTTP request logging |
| **Compression** | compression | Brotli/Gzip response compression |

---

## Architecture

This project strictly follows **Domain-Driven Design (DDD)**. Each feature domain is fully encapsulated — Model, Service, Controller, and Route live together. No domain reaches into another domain's internals; cross-domain communication happens only through service interfaces.

```
src/
├── api/
│   ├── analytics/          # Time-series word tracking, streaks, and writing goals
│   │   ├── writingStatModel.ts
│   │   ├── analyticsService.ts
│   │   ├── analyticsController.ts
│   │   └── analyticsRoute.ts
│   ├── auth/               # Google OAuth verification and JWT issuance
│   │   ├── authService.ts
│   │   ├── authController.ts
│   │   └── authRoute.ts
│   ├── character/          # Relational world-building — character sheets and relationship graphs
│   │   ├── characterModel.ts
│   │   ├── characterService.ts
│   │   ├── characterController.ts
│   │   └── characterRoute.ts
│   ├── document/           # Novel and Chapter text management (TipTap JSON content)
│   │   ├── documentModel.ts
│   │   ├── documentService.ts
│   │   ├── documentController.ts
│   │   └── documentRoute.ts
│   ├── export/             # Manuscript compilation engine — outputs .md archives
│   │   ├── exportService.ts
│   │   ├── exportController.ts
│   │   └── exportRoute.ts
│   ├── like/               # Reader engagement and public document metrics
│   │   ├── likeModel.ts
│   │   ├── likeService.ts
│   │   ├── likeController.ts
│   │   └── likeRoute.ts
│   ├── note/               # Relational world-building — lore, timelines, and research
│   │   ├── noteModel.ts
│   │   ├── noteService.ts
│   │   ├── noteController.ts
│   │   └── noteRoute.ts
│   ├── upload/             # Cloudinary media streaming pipeline
│   │   ├── uploadService.ts
│   │   └── uploadRoute.ts
│   └── user/               # Profiles, settings, and BFF orchestration
│       ├── userModel.ts
│       ├── userService.ts
│       ├── userController.ts
│       └── userRoute.ts
├── config/
│   └── cloudinary.ts       # Cloudinary SDK initialisation
├── middleware/
│   ├── authMiddleware.ts   # JWT verification and request augmentation
│   ├── errorHandler.ts     # Centralised error handling with custom error classes
│   └── uploadMiddleware.ts # Multer + Cloudinary storage engine configuration
├── utils/
│   ├── errors.ts           # NotFoundError, UnauthorizedError, ValidationError
│   └── helpers.ts          # Date utilities, word count, slug generation
└── server.ts               # App bootstrap, middleware chain, and graceful shutdown
```

### Design Principles

- **Single Responsibility** — Services contain business logic. Controllers handle HTTP only. Models define schema only.
- **Ownership Verification at Every Layer** — Every mutation in every service verifies that the requesting user owns the target resource before touching the database. This eliminates IDOR vulnerabilities by design.
- **Fail Fast** — All required environment variables are validated at startup. The server will not start with an incomplete configuration.
- **Error Propagation via `next(error)`** — No controller handles its own server errors. All exceptions propagate to the centralised `errorHandler` middleware.

---

## Key Features

### Time-Series Analytics Engine

Standard word-count tracking breaks the moment an author pastes text from another document or deletes a chapter. Writely uses a **snapshot strategy** instead.

Every autosave records the absolute word count of the chapter at that millisecond. The backend calculates the daily delta at read time by subtracting the day's first snapshot from its last. A **5-minute cooldown guard** prevents database flooding from rapid autosave events, reducing storage volume by approximately 98% compared to a naive approach.

The streak engine walks chronologically through distinct active days, tracking both the current active streak and the user's all-time longest streak for motivational context.

### World-Building Engine

Authors build their novels' universes through two relational models tied to a parent Novel document.

**Characters** support a relationship graph via a `relationships` sub-array, allowing bidirectional links between characters (e.g., sibling, rival, mentor). Character queries are scoped to the parent Novel, enabling the frontend editor sidebar to load all relevant characters instantly when a chapter is opened.

**Notes** are typed (`lore`, `plot`, `worldbuilding`, `research`, `timeline`, `misc`) and support optional type-filtering via query parameter, so the sidebar can surface only the most contextually relevant notes while writing.

### IDOR Protection

All world-building endpoints verify resource ownership by traversing the document ownership chain:

```
Request → Verify JWT (authMiddleware)
        → Verify resource exists
        → Verify parent Novel owner === req.user.userId
        → Execute mutation
```

A user with a valid JWT cannot read, modify, or delete another author's characters or notes.

### BFF Orchestration Layer

The dashboard and profile pages each require data from multiple collections. Rather than making five sequential API calls from the client, dedicated orchestration endpoints on the user domain compile everything into a single response using MongoDB aggregation pipelines. This is the Backend-for-Frontend pattern — the server does the joining, not the client.

### Media Pipeline

Upload endpoints stream files directly from the incoming request to Cloudinary via `multer-storage-cloudinary`. The file bytes never land on the server's disk or memory. Cloudinary transformations (resize, crop, format conversion to WebP) are applied at upload time, not at read time. Old images are deleted from Cloudinary when a user replaces them, preventing silent storage accumulation.

### Export Engine

Authors can export their entire manuscript as a structured Markdown archive. The export service fetches the Novel and all of its Chapters in order, compiles them into a single `.md` document with frontmatter metadata, and streams the file as a download response. No temporary files are written to disk.

### Production-Ready Server

The server registers `SIGTERM` and `SIGINT` handlers that close the MongoDB connection and drain in-flight HTTP requests before the process exits. This prevents data corruption during container restarts and rolling deployments.

---

## Getting Started

### Prerequisites

- Node.js `>= 20.x`
- pnpm `>= 9.x`
- A MongoDB Atlas cluster (or local MongoDB `>= 7.x`)
- A Cloudinary account
- A Google Cloud project with the OAuth 2.0 API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/writely-backend.git
cd writely-backend

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory. **Never commit this file.**

```bash
# ── Server ────────────────────────────────────────────────
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ── Database ──────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/writely

# ── Authentication ────────────────────────────────────────
JWT_SECRET=your_minimum_32_character_random_secret
JWT_EXPIRES_IN=15m
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# ── Media Storage ─────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Security note:** `JWT_SECRET` must be a cryptographically random string of at least 32 characters. Generate one with `openssl rand -base64 32`.

### Running the Server

```bash
# Development (ts-node-dev with hot reload)
pnpm dev

# Production build
pnpm build

# Run compiled production build
pnpm start
```

---

## API Reference

> A full Postman collection is in progress. The table below documents the current stable endpoints.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/google` | Public | Exchange Google ID token for a Writely JWT |
| `GET` | `/api/auth/me` | 🔒 JWT | Get the currently authenticated user |

### Documents — `/api/documents`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents` | 🔒 JWT | Create a new Novel or Chapter |
| `GET` | `/api/documents/novels` | 🔒 JWT | Get all novels owned by the authenticated user |
| `GET` | `/api/documents/:id` | 🔒 JWT | Get a single document by ID |
| `GET` | `/api/documents/read/:slug` | Public | Get a published document by its public slug |
| `PUT` | `/api/documents/:id` | 🔒 JWT | Update document content or metadata |
| `DELETE` | `/api/documents/:id` | 🔒 JWT | Soft-delete a document (sets `deletedAt`) |
| `PATCH` | `/api/documents/:id/restore` | 🔒 JWT | Restore a soft-deleted document |

### World-Building — `/api/characters` · `/api/notes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/characters/novel/:novelId` | 🔒 JWT | Create a character for a novel |
| `GET` | `/api/characters/novel/:novelId` | 🔒 JWT | Get all characters for a novel |
| `PUT` | `/api/characters/:characterId` | 🔒 JWT | Update a character |
| `DELETE` | `/api/characters/:characterId` | 🔒 JWT | Delete a character |
| `POST` | `/api/notes/novel/:novelId` | 🔒 JWT | Create a note for a novel |
| `GET` | `/api/notes/novel/:novelId` | 🔒 JWT | Get notes (`?type=lore\|plot\|timeline…`) |
| `PUT` | `/api/notes/:noteId` | 🔒 JWT | Update a note |
| `DELETE` | `/api/notes/:noteId` | 🔒 JWT | Delete a note |

### Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analytics/snapshot` | 🔒 JWT | Record a word-count snapshot for a chapter |
| `GET` | `/api/analytics/dashboard` | 🔒 JWT | Get daily word counts and current streak |
| `GET` | `/api/analytics/streak` | 🔒 JWT | Get current and longest writing streak |

### Media — `/api/upload`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PATCH` | `/api/upload/novels/:novelId/cover` | 🔒 JWT | Upload or replace a novel cover image |
| `PATCH` | `/api/upload/characters/:characterId/avatar` | 🔒 JWT | Upload or replace a character avatar |

### Export — `/api/export`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/export/novels/:novelId/markdown` | 🔒 JWT | Download full manuscript as a `.md` file |

---

## Database Design

The schema follows the **referenced architecture** pattern throughout. Large or unbounded datasets (chapters, comments, analytics snapshots) are always stored in separate collections and linked by ObjectId, preventing MongoDB's 16MB document size limit from ever becoming a constraint.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `Document.type` enum (`novel`, `chapter`) | Single collection for the document tree; `parentId` self-reference handles nesting. `type` discriminator keeps queries unambiguous. |
| `Document.status` enum (`draft`, `published`, `archived`) | Replaces a boolean `isPublic`. Allows archived documents without deletion, and clean filtering on the dashboard. |
| `Document.slug` (unique) | Public share URLs use slugs, not MongoDB `_id`s, preventing internal ID enumeration. |
| `Document.deletedAt` (nullable Date) | Soft delete. Removed documents are recoverable. Hard deletion is a separate admin operation. |
| `WritingStat.wordCountSnapshot` | Absolute snapshot, not a delta. Deltas are computed at read time by the aggregation pipeline, making historical data recalculation possible if the algorithm changes. |
| `Comment` as a separate collection | Decoupled from Document to support pagination, threading (`parentCommentId`), and inline positioning (`position.from`, `position.to`) without bloating the document record. |

---

## Security Model

| Layer | Implementation |
|---|---|
| **Transport** | `helmet()` sets all recommended secure HTTP headers |
| **CORS** | Strict origin whitelist via `FRONTEND_URL` environment variable |
| **Rate Limiting** | Global limiter (100 req / 15 min); stricter auth limiter (10 req / 15 min) on `/api/auth` |
| **Input Sanitisation** | `express-mongo-sanitize` strips `$` operators from all request bodies and query strings |
| **Request Validation** | Zod schemas on all `POST` and `PUT` bodies before any service call |
| **Authentication** | Short-lived JWTs (`15m`). Google OAuth handles credential security; Writely never stores passwords. |
| **Authorisation** | Every service mutation verifies resource ownership via `owner === req.user.userId` before executing |
| **Error Responses** | Stack traces are included in responses only when `NODE_ENV=development`. Production responses expose only the error message. |

---

## Analytics Engine

### Snapshot Strategy

```
Autosave event fires
        │
        ▼
Has a snapshot been recorded in the last 5 minutes for this chapter?
        │
   YES ─┤─ NO
        │        │
     Skip        ▼
             Write WritingStat { wordCountSnapshot: N, createdAt: now }
```

### Daily Word Count Calculation

```
For each chapter active today:
  delta = lastSnapshot(today) - firstSnapshot(today)
  delta = max(0, delta)              ← floor at 0; deletions don't subtract

totalWordsToday = sum(delta for all chapters)
```

### Streak Algorithm

```
Fetch all distinct calendar days where totalWordsToday > 0, sorted DESC

If most recent day !== today AND !== yesterday → currentStreak = 0

Otherwise: walk backwards through days
  if gap between consecutive days === 1 → increment streak
  if gap > 1 → break

Track longestStreak alongside currentStreak
```

---

## Deployment

The application is container-ready. Environment variables are injected at runtime and never baked into the image.

**Recommended stack:**

- **Compute:** Railway, Render, or any Docker-compatible host
- **Database:** MongoDB Atlas (M10 or above for production)
- **Media:** Cloudinary (free tier sufficient for early scale)

**Production checklist:**

- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is a random 32+ character string, not a dictionary word
- [ ] `FRONTEND_URL` is set to the exact production domain (no trailing slash)
- [ ] MongoDB Atlas IP allowlist includes your deployment host's egress IP
- [ ] Cloudinary API key is scoped to upload-only permissions where possible

---

## Roadmap

- [ ] Refresh token rotation (required before Android launch)
- [ ] WebSocket layer for real-time collaborative editing
- [ ] Writing Goal model with daily/weekly/novel-total targets
- [ ] Writing Session model for per-session duration and productivity analytics
- [ ] Daily analytics rollup cron for dashboard query performance at scale
- [ ] `ChapterVersion` collection for content history and rollback
- [ ] `ShareToken` model for revocable public share links
- [ ] Firebase Cloud Messaging integration for push notifications
- [ ] Full Postman collection with example responses

---

<div align="center">

Built by **Haris** · Writely © 2025

</div>