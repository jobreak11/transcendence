# Project Architecture & Directory Structure

## 1. Design Philosophy: Strict Container Isolation
This repository is structured around **strict service isolation** (`src/dockers/`). Every containerized service operates as an independent unit with its own build context, configuration, and runtime environment—ensuring zero cross-contamination between the frontend, backend, database, caching layer, and monitoring tools.

---

## 2. Top-Level Directory Overview

```text
.
├── backup/               # Automated/manual PostgreSQL database dumps
├── documentation/        # Project specifications, module docs, and architecture notes
├── request_script/       # API testing and automation scripts
└── src/
    ├── dockers/          # Isolated Docker service definitions and volumes
    │   ├── nginx/        # Reverse proxy & TLS termination (Single Entrypoint)
    │   ├── nextjs/       # Frontend application (Next.js 16 / React 19 / Three.js)
    │   ├── nestjs/       # Backend API & WebSocket server (NestJS / Fastify / Drizzle ORM)
    │   ├── postgresql/   # Primary relational database
    │   ├── redis/        # In-memory cache, session store, and real-time state
    │   ├── adminer/      # Database management UI
    │   └── dozzle/       # Real-time Docker container log viewer
    ├── secrets/          # Environment secrets and TLS certificates (git-ignored)
    └── tools/            # Build, synchronization, and lifecycle utility scripts
```

---

## 3. The `data/` vs. `saves/` Architecture (`nestjs` & `nextjs`)

Inside `src/dockers/nestjs/` and `src/dockers/nextjs/`, the workspace is divided into two distinct directories: **`data/`** and **`saves/`**. This design solves a common Docker development trade-off between **host IDE support**, **container OS compatibility**, and **Git repository cleanliness**.

```text
src/dockers/<service>/
├── Dockerfile
├── data/                 # [Git-Ignored] Live bind-mounted container workspace
│   ├── node_modules/     # Container-compiled dependencies (pnpm)
│   ├── dist/ | .next/    # Build artifacts
│   └── src/              # Active source code during runtime
└── saves/                # [Git-Tracked] Clean source code & configuration snapshot
    └── src/              # Version-controlled source code
```

### Why We Use This Pattern

1. **Full Host IDE IntelliSense & Type Resolution (`data/`)**
   - Strictly bind-mounting only `src/` into a container leaves `node_modules/` trapped inside the container's virtual filesystem. Because our stack relies heavily on strict TypeScript types (`drizzle-orm`, `@nestjs/*`, `@react-three/fiber`, `openapi-typescript`), VS Code on the host machine cannot resolve types or provide IntelliSense without local access to `node_modules/`.
   - By bind-mounting the entire working directory (`data/`) to the container, `pnpm` installs dependencies directly into `data/node_modules/`. This exposes the exact container dependencies to the host's VS Code language server while ensuring native binaries (such as `argon2`) are compiled for the container's Linux architecture rather than the host OS.

2. **Clean Version Control Without Bloat (`saves/`)**
   - Because `data/` acts as the live container volume, it contains heavy generated files (`node_modules/`, `dist/`, `.next/`) and runtime artifacts that must never be committed to Git.
   - `saves/` serves as the clean, Git-tracked source of truth containing only the application source code (`src/`, `public/`, and package manifests).
   - Helper scripts in `src/tools/` synchronize changes between `saves/` (for Git commits and initial container seeding) and `data/` (for live development and hot-reloading).

---

## 4. Internal Backend Architecture (`nestjs/saves/src/`)
The NestJS backend follows a modular, layered architecture separating transport layers from core business logic and infrastructure:

- **`api/`**: Transport & controller layer, split into:
  - `internal/`: Protected endpoints for the Next.js frontend (Auth, Chat, Friends, Game, Lobby, Tournament, Users).
  - `public/`: External API endpoints guarded by API keys (`users`, `users-statistics`).
  - `websocket/`: Real-time Socket.IO gateways (`main-gateway`, `game-gateway`, `matchmaking-gateway`) with custom guards, pipes, and exception filters.
- **`modules/`**: Domain business logic. Each domain module encapsulates its own `database/` (Drizzle queries), `redis/` (real-time state), `caching/`, and `dto/` definitions.
- **`infrastructure/`**: Database schema definitions (`drizzle/schema/`), seeding helpers, and Redis namespace/connection managers.