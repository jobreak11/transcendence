*This project has been created as part of the 42 curriculum by gyeepach, srussame, paradari, psenalia, and jjaroens.*
# Transcend 888

## Description
Transcend 888 is an online web poker game application designed for players to connect and play remotely anywhere. Similar to gaming online platforms, players can create an account, play poker with friends or strangers via casual lobby rooms, ranked, or via limited time tournaments, while tracking your progress to show off your friends.

**Key Features**
- **Account Profile** that tracks your progress and can edit your profile
- **Ranking System** for those who want to get competitive in poker
- **Achievements & Trophies** to display your progress and showoff to other players
- **Tournament Events** for a chance of acquiring exclusive achievements and trophies
- **Free of Charge** no top-up, no microtransactions, all for free and for fun

## Technical Overview
### Technical Stack
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

### Database Schema
<img src="Transcendence Poker Database.svg" alt="Schema Diagram">
