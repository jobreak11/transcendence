# Technical Stack & Architectural Justification

## 1. Core Philosophy: The Unified TypeScript Advantage

The primary driver behind our architectural choices is **language unification**. By selecting **Next.js** for the frontend and **NestJS** for the backend, our entire application layer is written in **TypeScript**.

### Why This Stack?
* **Single-Language Mastery:** Our team only needs to learn and master one major programming language. This eliminates the cognitive overhead of context-switching between different syntax paradigms, standard libraries, and ecosystems across the stack.
* **End-to-End Type Safety:** Shared interfaces, Data Transfer Objects (DTOs), and validation schemas can be reused across both client and server, catching integration bugs at compile time rather than runtime.
* **Full-Stack Mobility:** Every team member can understand, debug, and contribute to both frontend UI components and backend business logic, removing development bottlenecks during sprints.
* **Lightweight & Reproducible Infrastructure:** Every service runs inside **Alpine Linux (`alpine3.24`)** containers, ensuring minimal image footprints, reduced attack surfaces, fast build times, and strict environment parity across all developer machines.

---

## 2. Technical Specifications Overview

| Layer / Role | Technology | Image / Version | Base Environment | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Reverse Proxy & Web Server** | Nginx | `nginx:1.31.9-alpine` | Alpine Linux | TLS termination, single entry point, request routing, and static asset serving. |
| **Frontend Framework** | Next.js (TypeScript) | Custom Build | `node:alpine3.24` | Server-side rendering (SSR), client-side routing, and reactive UI state management. |
| **Backend Framework** | NestJS (TypeScript) | Custom Build | `node:alpine3.24` | Modular REST API, WebSocket/real-time gateways, authentication, and core business logic. |
| **Primary Database** | PostgreSQL | `postgres:19.0-alpine3.24` | Alpine Linux 3.24 | ACID-compliant relational storage for users, persistent application state, and relational records. |
| **In-Memory Data Store** | Redis | `redis:8.10.3-alpine` | Alpine Linux | Low-latency caching, session/token management, pub/sub messaging, and ephemeral state. |
| **Database Management UI** | Adminer | `6.3.0-standalone` | Standalone | Lightweight web interface for inspecting PostgreSQL schemas, running queries, and live debugging. |
| **Redis Management UI** | Redis Commander | `0.9.0` | `node:alpine3.24` | Web GUI for inspecting Redis keys, TTLs, and real-time in-memory data structures. |
| **Container Log Viewer** | Dozzle | `amir20/dozzle:pr-5708-alpine` | Alpine Linux | Real-time web-based log aggregation and monitoring across all running Docker containers. |

---

## 3. Component Breakdown & Justification

### Application & Runtime Layer (`node:alpine3.24`)
* **Base Image (`node:alpine3.24`):** Standardized across Next.js, NestJS, and Redis Commander to maximize Docker layer caching, minimize disk usage, and ensure identical Node.js runtime behavior across services.
* **NestJS (Backend):** Chosen for its opinionated, modular architecture (Controllers, Providers, Modules) heavily inspired by Angular/Spring. It enforces clean separation of concerns, native TypeScript decorators, dependency injection, and built-in support for Guards, Interceptors, and WebSockets—critical for passing strict architectural evaluations.
* **Next.js (Frontend):** Provides an industry-standard React framework with built-in routing, TypeScript support out of the box, and optimized bundling, allowing the team to focus on application features rather than complex bundler configurations.

### Data & Persistence Layer
* **PostgreSQL (`postgres:19.0-alpine3.24`):** Selected over NoSQL alternatives for its strict relational integrity, foreign-key constraints, and transactional guarantees (ACID), preventing corrupted state under concurrent user actions.
* **Redis (`redis:8.10.3-alpine`):** Offloads high-frequency, short-lived operations from PostgreSQL. Ideal for fast lookups, rate limiting, active session tracking, and real-time state synchronization.

### Networking & Gateway Layer
* **Nginx (`nginx:1.31.9-alpine`):** Acts as the mandatory single point of entry (reverse proxy). It isolates internal container ports from the host network, handles HTTPS/TLS encryption, and routes traffic cleanly between the Next.js frontend and NestJS backend API/WebSockets.

### Observability & Developer Experience (DevOps Tooling)
To accelerate debugging and provide full transparency during project evaluation, we included three lightweight management tools:
* **Adminer (`6.3.0-standalone`):** Allows instant verification of database migrations, table constraints, and live row updates during defense without needing CLI access.
* **Redis Commander (`0.9.0`):** Built on top of our shared `node:alpine3.24` base, giving visual proof of cached keys, session expiration, and real-time state changes.
* **Dozzle (`amir20/dozzle:pr-5708-alpine`):** Streams live `stdout`/`stderr` container logs in a unified browser dashboard without requiring complex ELK/Loki stacks, making it effortless to demonstrate container health and error handling during evaluation.