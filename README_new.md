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

## Modules
| Category | Module | Type | Pts |
| :--- | :--- | :--- | :--- |
| Web | Use a framework for both the frontend and backend | Major | 2 |
| Web | Implement real-time features using WebSockets | Major | 2 |
| Web | Allow users to interact with other users | Major | 2 |
| Gaming | Implement a complete web-based game where users can play against each other | Major | 2 |
| Gaming | Enable two players on separate computers to play the same game in real-time | Major | 2 |
| Gaming | Game customization options | Minor | 1 |
| User Management | Standard user management and authentication | Major | 2 |
| User Management | Implement remote authentication with OAuth 2.0 | Minor | 1 |
| User Management | Game statistics and match history | Minor | 1 |
| User Management | User activity analytics and insights dashboard | Minor | 1 |
| **Total** | | | **16** |

### Justification and implementation

## Team Information
| Member | Role | Responsibilities |
| :--- | :--- | :--- |
| paradari | Product Owner & Developer | Poker gameplay and mechanics |
| srussame | Technical Lead & Developer | Backend database, infrastructure, and microservice |
| gyeepach | Product Manager & Developer | Follow-up progress & Chat system |
| psenalia | Idealist & Developer | Webpage UI & layout design, Logo & trophy design |
| jjaroens | Developer | Frontend to backend API handling & Language localization |

### Individual Contributions
**🧑‍🍳 <u>Product Owner Paradari</u>**
- Purpose and design poker game
- Implement poker mechanics such as pot, big blind, play format (difficulty), and scoring
- Implement redis structure that tracks data from the play room
- Design UI layout within the play room
- Implement card assets
- Initialized landing page
- Implement tournament system
- Implement match history system

**🧑‍🔧 <u>Technical Lead Srussame</u>**
- Implement docker & containers for the project
- Implement services such as nginx, postgresql, adminer, dozzle
- Organize data structure, schema, and storage
- Create backend API request for frontend

**🧑‍⚖️ <u>Product Manager Gyeepach</u>**
- Organized meetings and secretary duties on Discord
- Track progress and notes through GitHub issues
- Implement chat system in lobby room & play room
- Project code revision and fixing pre-submission

**🧑‍🎨 <u>Developer Psenalia</u>**
- Design webpage, including landing page, profile page, and lobby room
- Initialize early systems, such as friends, trophies, room list, profile settings, custom rooms, tournament system
- Create base CSS file for further uses
- Art design via Adobe Illustrator
- Compose README file

**👨‍💻 <u>Developer Jjaroens</u>**
- Implement request function API from backend to frontend webpage
- Implement friend request system
- Localization for Thai & Chinese

## Resources
### Documentations Used
- [Next.js](https://nextjs.org/docs)
- [Nest.js](https://docs.nestjs.com/)
- [React](https://react.dev)
- [Node.js](https://nodejs.org/docs/latest/api/)
- [Tailwind CSS](https://tailwindcss.com/docs)