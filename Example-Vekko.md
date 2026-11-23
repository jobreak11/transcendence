*This project has been created as part of the 42 curriculum by ipetrov, vvoronts, mmaksimo, jichompo, juhtoo-h.*

# Vekko — A Marketplace for Expertise

## Description

**Vekko** is a web marketplace that connects **clients** who have questions with **insiders** who have answers. A client posts an order describing what they need; the platform semantically matches it to the best-suited insider, who replies with a priced insight the client can unlock from an in-app wallet. Its goal is to make on-demand expertise easy to find and fairly priced by automating the match between a question and the right expert.

Key features:

- **Client dashboard** — create orders, browse matches, and unlock insights.
- **Insider dashboard** — set a one-time expertise *legend* and manage incoming matches.
- **Admin panel** — role-based user management: view, edit, and delete user profiles.
- **AI matching** — embeds each order and insider legend, ranking insiders by semantic similarity score.
- **Wallet** — in-app balance with top-up, withdraw, and paid insight unlocks.
- **Public API** — secured developer API with API keys, rate limiting, and OpenAPI docs.

## Instructions

### Prerequisites

- Docker Engine with the Compose v2 plugin (`docker compose`)
- GNU Make

### Run

1. Clone the repository:

```bash
git clone https://github.com/ivnxptrv/ft_transcendence.git && cd ft_transcendence
```

2. Create the `secrets/` directory from the committed template. The dev defaults work out of the box; edit the files inside for production:

```bash
cp -r secrets.example secrets
```

3. Build and start all services (`make` defaults to `make up`, i.e. `docker compose up -d --wait`):

```bash
make
```

Once the containers report healthy, open `https://localhost:4443` in your browser and accept the self-signed certificate warning.
- Vekko: `https://localhost:4443/`
- Public API docs (Swagger): `https://localhost:4443/docs`
- Grafana: `https://localhost:4443/grafana`
- Kibana: `https://localhost:4443/kibana`
- Prometheus: `https://localhost:4443/prometheus`

> **Admin console:** a bootstrap admin is seeded on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Sign in with those at the normal login — you're routed to `/admin`.

## Technical Overview

Four FastAPI microservices behind a single Next.js gateway. nginx terminates TLS and proxies to the gateway, the only entrypoint: it serves the SSR frontend and forwards server-side calls to the internal services, which are never exposed to the browser.

```
nginx (:4443, TLS) → web (gateway) → identity · interaction · semantic · ledger
```

- **web** — Next.js gateway: SSR frontend + BFF; sole entrypoint, forwards server-side requests to the internal services.
- **identity** — auth authority: RS256 JWT issue/verify (JWKS), refresh rotation/revocation, Google OAuth, TOTP 2FA, API keys, and the public API gateway
- **interaction** — marketplace core: orders, matches, insights.
- **semantic** — embeds legends & orders, scores by cosine similarity, posts the top match back to interaction.
- **ledger** — balances, transactions, purchases;

### Technical Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router, React 19, Server Actions) + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Backend | FastAPI (Python 3.11) — one app per service |
| Database | PostgreSQL 16 (one database per service) |
| ORM / migrations | SQLAlchemy 2 (async, asyncpg) + Alembic |
| AI / matching | sentence-transformers (`BAAI/bge-m3`) + PyTorch (CPU) |
| Auth | RS256 JWT (access + refresh), bcrypt, pyotp (TOTP), Google OAuth 2.0 |

**Justification**

- **Next.js + FastAPI** — App Router gives SSR and a server-action data layer, so the browser never touches internal services; FastAPI gives async, typed services with first-class OpenAPI.
- **PostgreSQL + SQLAlchemy/Alembic** — relational data fits the domain (users, orders, matches, insights, transactions); per-service databases keep services decoupled; Alembic gives reproducible schemas.
- **`bge-m3` + cosine similarity** — open-source dense embeddings give language-agnostic semantic matching without an external API.

### Database Schema

PostgreSQL 16, one database per service. Cross-service references use the user's `sub` (UUID).

**identity**

| Table | Key columns |
| :--- | :--- |
| `users` | `id` (PK), `sub` (UUID, unique), `first_name`, `last_name`, `email` (unique), `password` (bcrypt, nullable), `role` (client/insider, nullable), `google_id` (unique, nullable), `twofa_secret`, `recovery_codes_hashed` (JSON), `twofa_enrolled_at` |
| `tokens` | `id` (PK), `user_id`→users (cascade), `jti` (unique), `expires_at`, `revoked_at`, `rotated_at` |
| `api_keys` | `id` (UUID, PK), `owner_sub`, `name`, `key_hash` (SHA-256, unique), `prefix`, `created_at`, `last_used_at`, `revoked_at` |

**interaction**

| Table | Key columns |
| :--- | :--- |
| `orders` | `id` (PK), `client_id` (index), `title`, `text`, `status` (default `pending`), `inquiry_id`, `created_at` |
| `matches` | `id` (PK), `order_id`→orders (cascade), `insider_id`, `score`, `score_id`, `is_synced` |
| `insights` | `id` (PK), `order_id`→orders (cascade), `match_id`→matches (cascade), `insider_id`, `legend`, `text`, `price`, `transaction_id`, `is_paid` |
| `idempotency_keys` | `key` (PK), `method`, `path`, `status_code`, `response_body`, `created_at` |

**semantic**

| Table | Key columns |
| :--- | :--- |
| `souls` | `id` (PK), `insider_id` (unique), `text`, `soul` (embedding), `credibility_score` |
| `inquiries` | `id` (PK), `client_id` (index), `order_id`, `text`, `query` (embedding), `active` |
| `scores` | `id` (PK), `soul_id`→souls, `inquiry_id`→inquiries, `score_value` |

**ledger**

| Table | Key columns |
| :--- | :--- |
| `transactions` | `transaction_id` (PK), `user_id` (index), `amount`, `created_at` |
| `purchases` | `purchase_id` (PK), `client_id`, `insider_id`, `insight_id`, `amount`, `transaction_id`→transactions |


## Contribution

### Team Information

| Member | Role | Responsibilities |
| :--- | :--- | :--- |
| ipetrov | Product Owner + Architect | Owns product vision and DevOps; designed the microservices architecture and infrastructure. |
| vvoronts | Project Manager + Tech Lead + Developer | Team coordination, task assignment, deadlines; identity service and web; business-logic design decisions. |
| mmaksimo | Developer | Web, interaction and ledger services. |
| jichompo | Developer | Semantic service. |
| juhtoo-h | Developer | Ledger service. |

### Project Management

- **Communication:** Discord — updates and coordination.
- **Task management:** Notion — backlog, task board, meeting logs, project dashboard.
- **Version control:** GitHub — per-member branches → central *dev* branch -> final *main* branch.
- **Work split** Mainly by service + DevOps

## Features List

**Authentication & accounts** (vvoronts)
- Email/password signup & login, bcrypt-hashed; RS256 JWT access + refresh with rotation/revocation.
- 2FA (TOTP): QR enrolment, verification, disable, single-use recovery codes.
- Google OAuth 2.0 with post-OAuth role onboarding.

**Marketplace** (mmaksimo, vvoronts)
- Orders: create / list / detail, validated forms, status tracking.
- Legend: set-once insider expertise profile.
- Insights: insiders submit priced answers; clients unlock to reveal.

**Admin & permissions** (vvoronts)
- Role-based access (client / insider / admin) enforced server-side on the signed JWT claim.
- Admin panel: view, edit (email / name), and delete any user.

**Semantic matching** (jichompo)
- Embeds legends and orders; cosine-similarity ranking; posts top match to interaction.

**Wallet / ledger** (juhtoo-h, mmaksimo)
- Balance, transaction history, paid unlocks, top-up / withdraw.

**Public API & developer tools** (vvoronts)
- X-API-Key auth, rate limiting, OpenAPI/Swagger docs; create/revoke keys in settings.

**Accessibility & internationalization** (mmaksimo)
- i18n with in-UI language switcher and 3+ translations.
- Cross-browser compatibility verified across Chrome, Firefox, and Edge.

**Infrastructure** (ipetrov)
- Four microservices, per-service PostgreSQl

## Modules

**Total: 22 points** (14 required)

| Category | Pts | Type | Owner | Module |
| :--- | :--- | :--- | :--- | :--- |
| Web | 2 | Major | mmaksimo / vvoronts | Use a fullstack framework (Next.js) |
| Web | 1 | Minor | all team | Use a backend framework (FastAPI) |
| Web | 1 | Minor | ipetrov | Use an ORM for the database (SQLAlchemy) |
| Web | 2 | Major | vvoronts | A public API to interact with the database (OpenAPI, identity) |
| Web | 1 | Minor | mmaksimo / vvoronts | Server-Side Rendering (SSR) |
| Web | 1 | Minor | vvoronts | Advanced search with filters, sorting, pagination |
| User Management | 1 | Minor | vvoronts | Remote authentication with OAuth 2.0 (Google) |
| User Management | 1 | Minor | vvoronts | Complete 2FA system |
| User Management | 2 | Major | vvoronts | Advanced permissions system (roles) |
| Accessibility | 1 | Minor | mmaksimo | Support for multiple languages (i18n) |
| Accessibility | 1 | Minor | mmaksimo | Support for additional browsers (Chrome, Firefox, Edge) |
| Devops | 2 | Major | ipetrov | Log management using ELK (Elasticsearch) |
| Devops | 2 | Major | ipetrov | Monitoring with Prometheus + Grafana |
| Devops | 2 | Major | ipetrov | Backend as microservices |
| Modules of choice | 2 | Major | jichompo | Searching engine as core of semantic service |
| **Total** | **22** | | | |

### Justification and implementation

**Web**

- **Use a framework for both the frontend and backend** (Major) — Next.js 16 is used as a true full-stack framework: React 19 Server Components render the UI, while Server Actions (`web/src/actions/*`) and Route Handlers (`web/src/app/api/*`) implement the server/BFF layer that talks to the internal services. A single framework covers both halves, satisfying the major on its own.
- **Use a backend framework** (Minor) — independently of Next.js's server layer, the four domain services are built on FastAPI (Python 3.11): async, Pydantic-validated, OpenAPI-native. FastAPI is a distinct backend framework, so this does not overlap the full-stack major above.
- **Use an ORM for the database** (Minor) — SQLAlchemy 2 in async mode (asyncpg) models every table across identity/interaction/semantic/ledger; schemas are versioned with Alembic and migrated automatically on startup.
- **A public API to interact with the database** (Major) — a developer API in the identity service: `X-API-Key` auth (SHA-256-hashed keys), fixed-window rate limiting (60 requests / 60 s, surfaced via `X-RateLimit-*` headers), and OpenAPI/Swagger documentation. It proxies to interaction and ledger over httpx. Endpoints: `GET /public/orders`, `GET /public/matches`, `GET /public/balance`, `GET /public/account`, `DELETE /public/account`.
- **Server-Side Rendering (SSR)** (Minor) — pages are async Server Components (`dynamic = "force-dynamic"`) that fetch on the server via Server Actions and stream complete HTML; there is no client-side fetch waterfall, and the browser never sees the internal service APIs.
- **Advanced search** (Minor) — the orders and matches lists each support filtering, sorting, pagination, and case-insensitive text search. Params flow page (`searchParams`) → server action → interaction API → SQLAlchemy, where filter/sort/search compose into a single `WHERE` shared by both the page query and the `X-Total-Count` total so the pager stays accurate. Text search uses parameterized Postgres `ILIKE`; filter/sort/search are independent toolbar toggles.

**User Management**

- **Implement remote authentication with OAuth 2.0** (Minor) — Google OAuth 2.0 Authorization-Code flow via the web BFF (`/api/auth/google/*`) and identity's `POST /oauth/google`: the returned `id_token` is verified, the user is upserted/linked by `google_id`, and first-time Google users complete role onboarding before reaching the app.
- **Implement a complete 2FA system** (Minor) — TOTP (pyotp) with QR enrolment, verification, and disable; ten single-use recovery codes are generated, stored SHA-256-hashed, and consumed on use. Login is gated server-side — when 2FA is enabled, token issuance requires a valid OTP or recovery code (`TotpRequired`).
- **Advanced permissions system** (Major) — three roles (client / insider / admin) carried as a signed RS256 JWT claim and enforced server-side: the `require_admin` dependency re-resolves the role from the database (so a revoked admin loses access immediately) and gates every admin user-CRUD endpoint, while `get_owned_user` scopes per-resource access so a user can only touch their own data. The admin console lists, edits (name), role-changes, and deletes any user.

**Accessibility and Internationalization**

- **Support for multiple languages** (Minor) — next-intl with four complete locales (English, French, Russian, Thai), a locale-prefixed router, and an in-UI language switcher; all user-facing strings come from typed message dictionaries (`web/src/i18n/messages/*`).
- **Support for additional browsers** (Minor) — verified on Chrome plus Firefox and Edge; Playwright end-to-end projects are configured for all three (`web/playwright.config.ts`).

**Devops**

- **Infrastructure for log management using ELK** (Major) — Filebeat (Docker autodiscovery) ships container logs to Logstash, which parses and forwards them to Elasticsearch for indexing and search in Kibana. An ILM policy enforces log retention (rollover then delete at 30 days), and Kibana is reachable only behind nginx basic auth.
- **Monitoring system with Prometheus and Grafana** (Major) — Prometheus discovers targets via Docker labels and scrapes infrastructure and database metrics through node-exporter and postgres_exporter (plus Grafana's own metrics). Grafana ships a provisioned Prometheus datasource and dashboards, with an alerting rule (Postgres down) wired to a Discord contact point; access is protected by an admin password and nginx basic auth.
- **Backend as microservices** (Major) — four loosely-coupled FastAPI services (identity, interaction, semantic, ledger), each with its own PostgreSQL database and a single responsibility, communicating over REST via httpx (e.g. ledger → interaction to mark an insight paid, semantic → interaction to post the top match).

**Modules of choice**

- **Custom semantic matching engine — the search core of the semantic service** (Major) — *Why:* Vekko's core value is connecting a question to the right expert, a semantic problem that keyword search cannot solve. *How / stack:* the semantic service loads the open-source `BAAI/bge-m3` SentenceTransformer (PyTorch, CPU) and embeds every insider legend (a "soul") and every order (an "inquiry") into dense vectors stored in PostgreSQL. On a new inquiry, a background task scores it against all souls by cosine similarity (`util.cos_sim`), persists the results to `scores`, and posts the top match back to interaction over httpx; a symmetric path scores a newly created soul against open inquiries. *Value / why Major:* it is a self-contained ranking engine — embedding model, vector storage, a two-way scoring lifecycle across `souls`/`inquiries`/`scores`, async background scoring, and inter-service notification — that runs entirely in-house with no external AI API, which makes it substantial enough to stand as a Major.

### Individual Contributions

**👤 ipetrov — Product Owner + Architect**

*PO*
- Defined the Vekko concept and key features.
- Designed the business model and produced product UML diagrams.

*Architect*
- Defined the microservices architecture.
- Defined technical stack
- Defined custom semantic engine stack

*DevOps*
- Set up Nix/devenv for the development infrastructure.
- Built Docker containers and HTTPS-only nginx proxy for production.
- Configured the ELK for centralized logs.
- Configured Prometheus + Grafana with `postgres_exporter` and alerting.
- Automated Alembic migrations on startup.
- Managed environment variables and secrets across services.

*Challenge*
- Coordinating many services in one reproducible environment — solved with a Nix/devenv dev setup and health-gated `depends_on` in Docker Compose, so services always start in a valid order.

**👤 vvoronts — Project Manager + Tech Lead + Developer**

*identity*
- Implemented RS256 JWT issue/verify with refresh rotation/revocation.
- Built progressive-OTP login.
- Built TOTP 2FA enrol/verify/disable.
- Integrated Google OAuth with post-auth role onboarding.
- Built API-key management.
- Added the admin role and per-role guards on the public API.
- Built the public API gateway (X-API-Key auth, rate limiting, OpenAPI/Swagger).

*web*
- Integrated auth on the backend side.
- Built the centralized typed error-handling architecture.
- Built the admin panel and admin-table UI.
- Built the user settings tab, expert tools, password form.
- Contributed in UI.

*Management*
- Coordinated the team in Discord and during meetings.
- Assigned tasks and tracked deadlines in Notion.

*Tech Lead*
- Made business-logic design decisions.
- Made and oversaw technical decisions: what features to implement and how.

*Challenge*
- Auth design and team coordination — addressed by centralizing auth in the identity service (RS256/JWKS, progressive-OTP) behind a typed error-handling layer, and tracking work in Notion.

**👤 mmaksimo — Developer**

*interaction*
- Built the orders, matches, and insights endpoints.
- Added the insight-read and ledger-update endpoint.
- Implemented the order-completion status flow across interaction & semantic.

*ledger*
- Implemented `GET /transactions` and `/purchases` with pagination.
- Fixed `transaction_id` persistence and insufficient-funds handling.
- Implemented withdrawal sign handling in the wallet.

*web*
- Built the core app UI.
- Wired server actions to backend schemas and removed mock data.
- Built the wallet modal, bonus-claim, and order-validation UI.
- Implemented i18n (4 languages: en/fr/ru/th) with a language switcher.
- Added cross-browser compatibility.

*Challenge*
- Holding the full business picture while wiring the UI to four services — addressed by replacing mock data with typed server actions mapped to each backend schema.

**👤 jichompo — Developer**

*semantic*
- Integrated sentence-transformer (`bge-m3`) embeddings for souls and inquiries.
- Implemented two-way cosine-similarity score calculation.
- Built the souls / inquiries / scores tables and schema.
- Added a background task to score on inquiry receipt.
- Connected semantic match posting to interaction.

*ledger*
- Implemented withdrawal and topup in wallet.

*Challenge*
- Building the custom search engine — handled by computing `bge-m3` embeddings in an async background task so scoring never blocks the request path.

**👤 juhtoo-h — Developer**

*ledger*
- Built the ledger service (balances, transactions, purchases).
- Implemented the `create_purchase` flow.
- Added the `GET /health` endpoint.
- Aligned the schema with the Hoppscotch API contract.

*Docs*
- Authored the Privacy Policy and Terms of Service pages.
- Contributed to the README.

*Challenge*
- Deriving correct running balances — solved by summing the signed transaction log rather than storing a mutable balance, so the running balance can't drift.

## Resources

### Documentation used

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)
- [Alembic](https://alembic.sqlalchemy.org/)
- [sentence-transformers](https://www.sbert.net/)
- [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- [RFC 6749 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 6238 — TOTP](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 7519 — JWT](https://datatracker.ietf.org/doc/html/rfc7519)
- [devenv](https://devenv.sh/)
- [Nix flakes](https://nixos.wiki/wiki/Flakes)
- [Elastic Stack (ELK)](https://www.elastic.co/guide/index.html)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)

### Use of AI

- **Code assistance** — scaffolding the Next.js web UI components and server-action data flows, refactoring, and filling in boilerplate.
- **Debugging** — reproducing issues, reading stack traces, and narrowing down root causes, notably transient cross-service startup races between the FastAPI services.
- **Security review** — reviewing the auth and data-handling code in the identity service (JWT, OAuth, 2FA, API keys) for common weaknesses and suggesting hardening.
- **Design & architecture** — discussing service boundaries across identity/interaction/semantic/ledger and trade-offs between approaches.
- **Documentation** — drafting and structuring this README and the developer notes.
