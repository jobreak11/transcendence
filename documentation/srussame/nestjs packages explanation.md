### NestJS (`/app/nestjs`)

This section documents and justifies every production and development dependency installed in the NestJS backend service. To satisfy architectural evaluation requirements, **major core packages** include an in-depth justification of their technical role and why they were chosen over alternatives, while **supporting and utility packages** are grouped by domain with concise explanations.

---

#### 1. Core Architectural Pillars (In-Depth Justification)

##### **NestJS Core (`@nestjs/core`, `@nestjs/common`, `reflect-metadata`, `rxjs`)**

* **What it does:** Provides the foundational application runtime, dependency injection (DI) container, modular architecture, decorators, and reactive programming primitives (`rxjs`) for the backend server.

* **Why we need it & Justification:** Instead of building an unopinionated, loosely structured server with raw Express/Fastify, NestJS enforces strict separation of concerns (Controllers, Services, Modules, Guards, Interceptors). This keeps the codebase maintainable and testable across a multi-person team. `reflect-metadata` enables TypeScript decorator metadata reflection required by the DI container, and `rxjs` powers NestJS interceptors, lifecycle streams, and reactive event handling.

##### **Fastify HTTP Layer (`fastify`, `@nestjs/platform-fastify`, `@fastify/cookie`, `@fastify/multipart`, `@fastify/static`)**

* **What it does:** Replaces the default Express HTTP adapter with Fastify, providing high-throughput HTTP request routing, cookie parsing, multipart file uploads, and static asset serving.

* **Why we need it & Justification:** Fastify offers significantly lower overhead and up to 2–3x higher request throughput than Express due to its schema-based serialization and optimized routing tree. Using `@fastify/cookie` (for secure HTTP-only JWT/session cookies), `@fastify/multipart` (for streaming user avatar/file uploads without buffering entire files in memory), and `@fastify/static` ensures native compatibility with Fastify's lifecycle hooks.

* *Note for Evaluators on `@nestjs/platform-express` and `multer`:* `@nestjs/platform-express` and `multer` are **only kept in `dependencies` to satisfy peer and type dependencies** of third-party NestJS ecosystem packages (`@nestjs/passport`, `@nestjs/swagger`, and NestJS internal file upload typings). Fastify (`@nestjs/platform-fastify` and `@fastify/multipart`) exclusively handles all runtime HTTP traffic and multipart uploads.

##### **Database Layer: Drizzle ORM & PostgreSQL (`drizzle-orm`, `drizzle-kit`, `pg`)**

* **What it does:** `pg` is the non-blocking PostgreSQL client driver for Node.js. `drizzle-orm` is a headless, TypeScript-first SQL ORM, and `drizzle-kit` is its CLI companion for generating and running SQL migrations.

* **Why we need it & Justification:** Unlike heavy ORMs such as TypeORM or Prisma (which relies on a separate Rust query engine binary and can introduce cold-start overhead or complex subquery bottlenecks), Drizzle ORM has zero external dependencies and compiles directly to 1:1 SQL queries. It gives us strict compile-time type safety, predictable SQL performance for complex relational queries, and lightweight schema migrations via `drizzle-kit`.

##### **Caching & Pub/Sub Layer: Redis (`ioredis`, `redis-mock`)**

* **What it does:** `ioredis` is a full-featured, production-grade Redis client for Node.js supporting clustering, pipelining, Lua scripting, and Pub/Sub. `redis-mock` provides an in-memory mock implementation for isolated testing.

* **Why we need it & Justification:** PostgreSQL alone should not handle ephemeral, high-frequency state. We use `ioredis` for low-latency operations such as session/refresh-token blacklisting, rate-limiting state, real-time presence tracking, and WebSocket Pub/Sub synchronization. `redis-mock` allows our unit and integration test suites to run rapidly in CI/CD without spinning up an external Redis container.

##### **Real-Time Communication: WebSockets (`socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`)**

* **What it does:** Enables bi-directional, event-driven, low-latency WebSocket communication between connected clients and the NestJS backend through Gateway classes.

* **Why we need it & Justification:** Standard HTTP request-response cycles are too slow and resource-heavy for live state synchronization, instant notifications, live chat, or real-time interactive features. `socket.io` provides automatic reconnection, room/namespace multiplexing, and fallback transport mechanisms, while `@nestjs/websockets` integrates WebSocket Gateways cleanly into NestJS Guards and Dependency Injection.

##### **Authentication & Security Suite (`passport`, `@nestjs/passport`, `@nestjs/jwt`, `argon2`, `passport-jwt`, `passport-local`, `passport-google-oauth20`, `passport-oauth2`)**

* **What it does:** Provides modular authentication middleware (`passport`), stateless token generation/verification (`@nestjs/jwt`), OAuth2 external login strategies (`passport-google-oauth20` for Google and `passport-oauth2` specifically for **42 Intra OAuth2**), username/password authentication (`passport-local`), and password hashing (`argon2`).

* **Why we need it & Justification:**

  * **`argon2` over `bcrypt`:** Winner of the Password Hashing Competition, Argon2 (specifically Argon2id) resists both GPU-based cracking (via memory-hard parameters) and side-channel attacks, whereas `bcrypt` is limited by a 72-byte input cap and weaker memory hardness.

  * **Passport Strategies (`passport-oauth2` for 42 OAuth & `passport-google-oauth20`):** Decouples authentication verification logic into pluggable NestJS Guards (`JwtAuthGuard`, `LocalAuthGuard`, `GoogleAuthGuard`, `FortyTwoAuthGuard`). Because 42 Intra uses a standard OAuth2 authorization code flow without an official maintained NestJS package, `passport-oauth2` provides a clean, standardized foundation to implement our custom 42 Intra OAuth2 strategy alongside Google OAuth2 and local authentication.

##### **Validation & Data Transformation (`zod`, `class-validator`, `class-transformer`)**

* **What it does:** Enforces runtime schema validation and type transformation on incoming HTTP payloads, query parameters, WebSocket messages, and environment variables.

* **Why we need it & Justification:** TypeScript types disappear at runtime. `class-validator` and `class-transformer` integrate natively with NestJS `ValidationPipe` and `@nestjs/swagger` to automatically validate DTO classes and strip malicious/unlisted properties (`whitelist: true`). `zod` provides composable, TypeScript-first schema validation ideal for strict environment configuration parsing and complex functional data pipelines.

---

#### 2. Supporting Production Dependencies (`dependencies`)

| Package | Version | What It Does & Why We Need It | 
 | ----- | ----- | ----- | 
| `@nestjs/config` | `12.1.1` | Manages environment variables and configuration namespaces via DI; integrates with `dotenv` and `zod` to fail fast on startup if required secrets are missing. | 
| `dotenv` | `18.0.10` | Loads environment variables from `.env` files into `process.env` for local and containerized development. | 
| `@nestjs/swagger` | `12.1.2` | Automatically generates OpenAPI (Swagger) interactive documentation from NestJS controllers and DTO decorators, keeping API specs in sync with code. | 
| `@nestjs/throttler` | `6.8.0` | Implements rate-limiting guards on HTTP endpoints and WebSocket gateways to protect against brute-force login attempts and DDoS abuse. | 
| `@nestjs/observe` | `0.3.27` | Provides observability, metrics, and health/performance monitoring hooks for NestJS services to track latency and system health. | 
| `uuid` | `14.0.3` | Generates RFC-compliant universally unique identifiers (UUIDs) for request tracing, file naming, session IDs, and unique entity keys. | 
| `@nestjs/platform-express` | `12.6.0` | Retained strictly to satisfy peer/type dependencies of third-party NestJS libraries (`@nestjs/swagger`, `@nestjs/passport`, `@nestjs/testing`); not used at runtime. | 
| `multer` | `2.5.0` | Retained strictly to satisfy third-party NestJS file-upload type definitions (`@types/multer`); runtime uploads are handled by `@fastify/multipart`. | 

---

#### 3. Development, Testing & Tooling (`devDependencies`)

##### **Modern Testing & Execution Stack (`vitest`, `@vitest/coverage-v8`, `vite`, `@nestjs/testing`, `supertest`, `tsx`)**

* **`vitest` (`4.1.12`) & `vite` (`8.3.8`):** Chosen over Jest as our test runner because it natively supports TypeScript/ESM via Vite's transformation pipeline, resulting in dramatically faster test execution and watch-mode feedback.

* **`@vitest/coverage-v8` (`4.1.12`):** Generates fast, accurate code coverage reports using Node's native V8 engine profiler during test runs.

* **`@nestjs/testing` (`12.6.0`):** Provides `Test.createTestingModule()` to spin up isolated NestJS dependency injection containers for unit and integration testing with mocked providers.

* **`supertest` (`7.3.2`):** Fires simulated HTTP requests against the running NestJS server instance during end-to-end (E2E) API testing to assert status codes, headers, and response payloads.

* **`tsx` (`4.23.15`):** Ultra-fast TypeScript execution engine (powered by esbuild) used to run standalone scripts, database seeders, and CLI utilities without manual compilation steps.

##### **High-Speed Linting, Formatting & Compiler (`typescript`, `oxlint`, `oxlint-tsgolint`, `prettier`)**

* **`typescript` (`6.0.2`):** Provides static type-checking and compilation to catch type errors at build time.

* **`oxlint` (`1.95.0`) & `oxlint-tsgolint` (`7.0.2008`):** Rust-based linter (from the Oxc project) paired with type-aware linting rules. Chosen over traditional ESLint because it runs 50–100x faster, catching bugs, unused variables, and unsafe TypeScript patterns almost instantaneously in CI and pre-commit hooks.

* **`prettier` (`3.10.1`):** Enforces consistent code formatting across all team members, eliminating style debates in pull requests.

##### **Build CLI & Debugging Utilities**

* **`@nestjs/cli` (`12.0.15`) & `@nestjs/schematics` (`12.0.16`):** Official NestJS command-line tooling used for project scaffolding, building production bundles, and maintaining standard module architecture.

* **`@nestjs/mau` (`0.2.9`):** NestJS deployment and cloud provisioning CLI utility.

* **`source-map-support` (`0.5.21`):** Maps compiled JavaScript stack traces back to the original TypeScript source lines so runtime errors are easy to debug.

##### **TypeScript Type Definitions (`@types/*`)**

TypeScript declaration packages have zero runtime footprint and exist strictly to provide compile-time type safety and IDE autocomplete for JavaScript libraries:

* `@types/node` (`24.19.2`): Node.js runtime APIs (`fs`, `path`, `process`, `Buffer`, etc.).

* `@types/pg` (`8.23.1`): Type definitions for the PostgreSQL `pg` client.

* `@types/passport` (`1.0.17`), `@types/passport-jwt` (`4.0.1`), `@types/passport-local` (`1.0.38`), `@types/passport-google-oauth20` (`2.0.17`), `@types/passport-oauth2` (`1.8.0`): Type definitions for Passport strategies (including our 42 Intra OAuth2 strategy) and user request payloads.

* `@types/express` (`5.0.6`), `@types/multer` (`2.3.0`): Request/Response and file upload type definitions required by third-party NestJS decorators.

* `@types/supertest` (`7.2.1`), `@types/redis-mock` (`0.17.3`): Type definitions for E2E HTTP assertions and mocked Redis instances in tests.

* `@types/ms` (`2.1.0`): Type definitions for human-readable time strings (e.g., `'15m'`, `'7d'`) used in JWT expiration configurations.

---
