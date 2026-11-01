# FinSentinel AI — Enterprise Autonomous FinOps & Ledger ERP

[![Java 21](https://img.shields.io/badge/Java-21%20Virtual%20Threads-blue)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.0.0--M5-green)](https://spring.io/projects/spring-ai)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7%20Redisson%20Distributed%20Lock-dc382d)](https://redisson.org/)
[![React 19](https://img.shields.io/badge/React-19%20Strict%20TS-61dafb)](https://react.dev/)

FinSentinel AI is an Enterprise Autonomous FinOps, Smart Procurement, and AI-Audited Double-Entry Ledger ERP Platform.

---

## 1. System Architecture

```text
finsentinel-ai/
├── docker-compose.yml           # PostgreSQL (pgvector:pg16), Redis 7, Backend, Frontend, Nginx
├── nginx/
│   └── nginx.conf               # Reverse proxy with HTTP/2, Gzip & WebSocket upgrade
├── backend/
│   ├── Dockerfile               # Multi-stage Eclipse Temurin 21 JRE with ZGC & Virtual Threads
│   ├── pom.xml                  # Spring Boot 3.3.5, Spring AI, Redisson, Flyway, PDFBox
│   └── src/main/
│       ├── java/com/finsentinel/
│       │   ├── config/          # Security, Redis, WebSocket, Virtual Threads, OpenAPI, AI
│       │   ├── common/          # ProblemDetail (RFC 7807), @AuditedAction AOP, @Idempotent AOP
│       │   ├── auth/            # JWT Access + Refresh rotation in Redis, RBAC
│       │   ├── ledger/          # BigDecimal HALF_UP, Isolation.SERIALIZABLE, DoubleEntryEngine
│       │   ├── procurement/     # PDFBox Parser, AnomalyTriageService, GST verification
│       │   ├── ai/              # Spring AI RAG, pgvector store, MCP Tool Beans, Copilot
│       │   └── telemetry/       # STOMP WebSocket broadcaster, CFO Dashboard metrics
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               └── V1__init_schema_and_pgvector.sql
└── frontend/
    ├── Dockerfile               # Multi-stage Node 22 build -> Nginx Alpine runner
    ├── package.json             # React 19, TanStack Query v5, Zustand, Recharts, Lucide
    ├── tsconfig.json            # Strict TypeScript (no any types)
    └── src/
        ├── api/                 # Axios with JWT refresh interceptor & Idempotency-Key
        ├── store/               # Zustand authStore & telemetryStore (STOMP client)
        ├── types/               # Strict domain interfaces
        ├── components/          # Layout, Sidebar, Header, LiveAnomalyTicker
        └── pages/
            ├── CfoDashboard.tsx         # Real-time KPIs, Cashflow AreaChart, Live STOMP Ticker
            ├── LedgerExplorer.tsx       # Double-entry viewer, Trial Balance, Invariant Modal
            ├── SmartProcurement.tsx     # PDF drag-and-drop, AI fraud triage, Auditor Override
            └── FinSentinelCopilot.tsx   # AI Agent chat, live MCP execution badges, dynamic charts
```

---

## 2. Core Modules & Invariants

### Module 1: Stateless Security, RBAC & Audit Trail
- **Roles:** `ROLE_CFO_ADMIN`, `ROLE_FINANCE_AUDITOR`, `ROLE_PROCUREMENT_MANAGER`, `ROLE_VENDOR`.
- **JWT Rotation & Blacklisting:** Access tokens (15 min) + Refresh Token Rotation stored in Redis. Tokens can be instantly revoked and blacklisted.
- **AOP Audit Logging:** `@AuditedAction` aspect logs user ID, role, target entity, JSON diff, client IP, and timestamps into immutable `audit_logs` table.

### Module 2: High-Concurrency Double-Entry Financial Ledger
- **Strict Financial Math:** `java.math.BigDecimal` with `RoundingMode.HALF_UP` (scale 4 internally, 2 for display).
- **Concurrency Isolation:** `@Transactional(isolation = Isolation.SERIALIZABLE)`.
- **Distributed Idempotency:** Custom `@Idempotent` annotation backed by **Redisson Distributed Locks** and `idempotency_keys` table to prevent double-payouts.
- **Ledger Invariant:** Every posting enforces `SUM(DEBIT) == SUM(CREDIT)`. Violations throw `UnbalancedLedgerException` (HTTP 422 ProblemDetail).

### Module 3: AI Smart Procurement & Fraud Triage Engine
- **PDF Extraction:** Apache PDFBox 3.x text extraction with financial regex extractors.
- **Forensic Checks:**
  - Price inflation: Intercepts unit prices with >15% variance from 90-day historical average (`POL-001`).
  - Duplicate detection: Prevents duplicate invoice IDs per vendor (`POL-003`).
  - GST invariance: Mathematical verification of 18% GST (CGST 9% + SGST 9% or IGST 18%).
- **Telemetry Broadcasting:** Flags with risk score >= 30 broadcast immediately to `/topic/anomaly-alerts` via WebSocket (STOMP).
- **Auto-Disbursement:** Auto-approved invoices automatically trigger `DoubleEntryEngine` (Debit Expense 5010, Credit Accounts Payable 2010).

### Module 4: "Ask FinSentinel" Agentic FinOps Copilot
- **pgvector RAG:** Vector search across corporate procurement and governance policies (`procurement_policies`).
- **Safe MCP Tool Calling:** Exposes read-only, role-gated Java tools:
  - `getLedgerBalanceSummary(accountType, dateRange)`
  - `getTopVendorsBySpend(limit)`
  - `getFlaggedAnomalies(minRiskScore)`
  - `verifyGstCompliance(vendorGstin)`
- **Dynamic Inline Charts:** Returns natural language synthesis + structured JSON chart data rendered dynamically in Recharts.

---

## 3. Running with Docker Compose

To boot the entire stack (PostgreSQL + pgvector, Redis, Backend, Frontend, Nginx):

```bash
docker compose up --build -d
```

- **Frontend Application:** [http://localhost](http://localhost) (or port 80)
- **OpenAPI Swagger UI:** [http://localhost/swagger-ui.html](http://localhost/swagger-ui.html)
- **Actuator Health:** [http://localhost/actuator/health](http://localhost/actuator/health)
- **WebSocket STOMP Broker:** `ws://localhost/ws-raw` or `http://localhost/ws` (SockJS)

---

## 4. Default Seeded Credentials

| Role | Username | Password | Email |
| :--- | :--- | :--- | :--- |
| **CFO Admin** | `cfo_admin` | `Admin@123` | `cfo@finsentinel.ai` |
| **Lead Auditor** | `finance_auditor` | `Admin@123` | `auditor@finsentinel.ai` |
| **Procurement Head** | `procurement_mgr` | `Admin@123` | `procurement@finsentinel.ai` |
| **Vendor Rep** | `vendor_cloudcorp` | `Admin@123` | `vendor@cloudscale.io` |
