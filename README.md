# Encurtador de URL 

## Overview

A full-stack URL shortener application built with **Express 5**, **PostgreSQL**, **Redis**, and **React 19**. Users submit a long URL through a web interface, receive a short link, and are redirected to the original URL when visiting the short link. Redis caching reduces database load on frequently accessed links.

---

## Architecture

```
┌──────────────┐       POST /sendurl        ┌──────────────────┐
│   React SPA  │ ─────────────────────────►  │   Express API    │
│  (Vite:5173) │ ◄─────────────────────────  │   (Bun:3001)     │
└──────────────┘   { resultfinal: shortURL } └────────┬─────────┘
                                                      │
                              ┌────────────────────────┼────────────────────┐
                              │                        │                    │
                              ▼                        ▼                    │
                     ┌────────────────┐      ┌─────────────────┐           │
                     │   PostgreSQL   │      │     Redis       │           │
                     │   (port 5432)  │      │   (port 6355)   │           │
                     │                │      │   Cache layer   │           │
                     │  links table   │      │   TTL: 1 hour   │           │
                     └────────────────┘      └─────────────────┘           │
                                                                           │
                   GET /senduser/:shortcode                                │
              ┌──────────────────────────────────────────────────────────────┘
              │  1. Check Redis cache
              │  2. Fallback to PostgreSQL
              │  3. Populate cache on miss
              │  4. 302 redirect to long_url
```

---

## Tech Stack

| Layer      | Technology            | Version  |
|------------|-----------------------|----------|
| Runtime    | Bun                   | 1.x      |
| Backend    | Express               | 5.2.1    |
| Database   | PostgreSQL (Alpine)   | 16       |
| Cache      | Redis (Alpine)        | 7        |
| Frontend   | React + Vite          | 19 / 8   |
| Language   | TypeScript            | 5.9      |
| ID Gen     | Sqids                 | 0.3.0    |
| Container  | Docker Compose        | -        |

---

## API Endpoints

### `GET /ping`

Health check endpoint.

**Response:** `{ "menssage": "pong" }`

---

### `POST /sendurl`

Creates a shortened URL from a long URL.

**Request body:**
```json
{ "url": "https://example.com/very/long/path" }
```

**Success response (200):**
```json
{ "resultfinal": "http://localhost:3001/senduser/aBcDeF" }
```

**Error responses:**
| Code | Cause                          |
|------|--------------------------------|
| 404  | Invalid URL format             |
| 503  | Database insert/update failure |

**Flow:**
1. Validate URL format using `new URL()`
2. Insert `long_url` into `links` table, get auto-generated `id`
3. Encode `id` into a 6+ character shortcode using Sqids (alphanumeric alphabet)
4. Update the `links` row with the generated `shortcode`
5. Return the full short URL

---

### `GET /senduser/:shortcode`

Redirects the user to the original long URL.

**Success response:** `302 Redirect` to the original URL

**Error responses:**
| Code | Cause                        |
|------|------------------------------|
| 400  | Shortcode not found          |
| 500  | Database/Redis lookup error  |

**Flow:**
1. Check Redis for cached value at key `shortcode`
2. If cache hit, redirect immediately
3. If cache miss, query PostgreSQL by `shortcode`
4. Store result in Redis with 1-hour TTL (`EX: 3600`)
5. Redirect to the original URL

---

## Database Schema

**Table: `public.links`**

| Column       | Type          | Description                     |
|--------------|---------------|---------------------------------|
| `id`         | `BIGSERIAL`   | Primary key, auto-increment     |
| `shortcode`  | `TEXT`         | Generated short identifier      |
| `long_url`   | `TEXT`         | Original URL submitted by user  |
| `created_at` | `TIMESTAMPTZ` | Insertion timestamp (default NOW) |

Initialization script: [`src/db/init.sql`](src/db/init.sql)

---

## Caching Strategy

Redis acts as a read-through cache for the redirect endpoint:

- **Key format:** `shortcode` (at the server level), `url:{shortcode}` (inside `sendUser` controller)
- **TTL:** 3600 seconds (1 hour)
- **Write policy:** Cache is populated on the first database lookup (cache-aside pattern)
- **Benefit:** Frequently accessed short links are served entirely from memory, bypassing PostgreSQL

---

## Short Code Generation

Uses the **Sqids** library to generate URL-safe, deterministic short codes:

- **Alphabet:** `a-zA-Z0-9` (62 characters)
- **Minimum length:** 6 characters
- **Input:** The database row `id` (integer)
- **Output:** A unique alphanumeric string (e.g., `aBcDeF`)

Sqids is collision-free for unique integer inputs and produces reversible encodings.

---

## Project Structure

```
encurtador-de-url/
├── src/
│   ├── server.ts              # Express app, routes, middleware
│   ├── postgres.ts            # PostgreSQL connection pool
│   ├── redisconect.ts         # Redis client initialization
│   ├── controller/
│   │   ├── urlcreated.ts      # URL validation + DB insert
│   │   ├── urlshortener.ts    # Sqids encoding + DB update
│   │   └── senduser.ts        # Redirect lookup (cache + DB)
│   └── db/
│       └── init.sql           # Table creation script
├── public/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx            # Main UI component
│   │   ├── App.css            # Dark-theme styling
│   │   └── main.tsx           # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml         # Multi-service orchestration
├── dockerfile                 # Backend container (Bun runtime)
├── package.json
├── tsconfig.json
└── .env                       # Environment variables
```

---

## Docker Setup

Three services orchestrated via Docker Compose:

| Service    | Image              | Port Mapping   | Notes                              |
|------------|--------------------|-----------------|------------------------------------|
| `app`      | Custom (Bun:1)     | 3001:3001       | Hot-reload with `bun --watch`      |
| `postgres` | postgres:16-alpine | 5432 (internal) | Data persisted via named volume    |
| `redis`    | redis:7-alpine     | 6355:6355       | Custom port via `--port 6355`      |

**Startup order:** `postgres` and `redis` start before `app` (`depends_on`).

The PostgreSQL container auto-runs [`init.sql`](src/db/init.sql) on first startup via the `/docker-entrypoint-initdb.d/` mount.

### Running

```bash
docker compose up --build
```

---

## Environment Variables

| Variable           | Default     | Description               |
|--------------------|-------------|---------------------------|
| `POSTGRES_USER`    | `postgres`  | Database user              |
| `POSTGRES_PASSWORD`| `teste`     | Database password          |
| `POSTGRES_DB`      | `encurtador`| Database name              |
| `POSTGRES_PORT`    | `5432`      | PostgreSQL port            |
| `POSTGRES_HOST`    | `localhost` | PostgreSQL host            |
| `REDIS_HOST`       | `redis`     | Redis host (service name)  |
| `REDIS_PORT`       | `6355`      | Redis port                 |

---

## Frontend

Single-page React application with a dark theme and animated star background.

**Features:**
- URL input with client-side validation (`new URL()`)
- Async submission to the backend API
- Displays the generated short URL with a copy-to-clipboard button
- Loading and error state management
- Portuguese-language UI

**Dev server:** `http://localhost:5173` (Vite)

---

## Known Issues

1. **Unwaited async call** in [`urlshortener.ts:27`](src/controller/urlshortener.ts:27): `inserttable(shortcode, id)` is not awaited, so the shortcode may not be persisted before the response is sent.

2. **Cache key mismatch**: The server-level redirect ([`server.ts:40`](src/server.ts:40)) reads from Redis using key `shortcode`, but [`senduser.ts:6`](src/controller/senduser.ts:6) writes to Redis using key `url:{shortcode}`. This means the server-level cache check will always miss, falling through to the controller which maintains its own cache.

3. **Console port mismatch**: [`server.ts:61`](src/server.ts:61) logs port 3000 but the server listens on port 3001.

4. **Missing null check**: [`senduser.ts:16`](src/controller/senduser.ts:16) accesses `result.rows[0].long_url` without checking if any rows were returned, which would throw a runtime error for unknown shortcodes.
