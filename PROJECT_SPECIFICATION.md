# PROJECT SPECIFICATION: Full ERP System Rebuild

> **Purpose of this document:** This is a complete technical and functional specification of an existing ERP system originally called **"Grow" (CoreLogix ERP)**. It is written so that another developer or LLM can rebuild the entire system from scratch with a **new brand, new stack, and improved architecture**. Every feature, page, component, data model, color, and behavior is documented here.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [New Brand Identity](#2-new-brand-identity)
3. [Recommended New Stack](#3-recommended-new-stack)
4. [Complete Feature Map](#4-complete-feature-map)
5. [All Pages & Routes (82 pages)](#5-all-pages--routes)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Database Schema (102 models, 2430 lines)](#7-database-schema)
8. [Server Actions (76 files)](#8-server-actions)
9. [API Endpoints](#9-api-endpoints)
10. [Components Library (191 files)](#10-components-library)
11. [State Management](#11-state-management)
12. [Design System & Tokens](#12-design-system--tokens)
13. [Business Logic & Calculations](#13-business-logic--calculations)
14. [Integrations](#14-integrations)
15. [Role-Based Access Control](#15-role-based-access-control)
16. [File Structure Reference](#16-file-structure-reference)
17. [Build & Deployment Notes](#17-build--deployment-notes)

---

## 1. PROJECT OVERVIEW

### What This System Is
A **full-stack Enterprise Resource Planning (ERP) system** for distribution companies (originally animal feed, but applicable to any distributor). It handles the entire business lifecycle:

- **Sales** (orders, invoicing, POS, customer management, promotions, loyalty)
- **Purchasing** (supplier management, purchase orders, agreements, returns)
- **Inventory** (multi-branch stock, variants, transfers, imports, breakage)
- **Finance** (cash boxes, checks, bank reconciliation, expenses, commissions, taxes, budgets)
- **Logistics** (delivery routes, fleet management, zone management, real-time tracking)
- **HR** (employees, contracts, tasks, supervision, goals)
- **Analytics** (dashboards, reports, KPIs, charts)
- **E-commerce API** (external integrations via REST API with API key auth)
- **AFIP Integration** (Argentine electronic invoicing - can be swapped for any tax authority)

### Original System Stats
| Metric | Count |
|--------|-------|
| Total TypeScript files | 481 |
| Page/Route files | 82 |
| React components | 191 |
| Server action files | 76 |
| Prisma database models | 102 |
| Prisma schema lines | 2,430 |
| Custom hooks | 15+ |
| Zustand stores | 5 |
| Utility/library files | 43 |
| Service files | 6 |
| API routes | 13 |
| Total dependencies | 100+ |

### Original Stack (for reference, NOT to replicate)
- Next.js 15.5.7 (App Router, React 19)
- TypeScript 5.8.3 (strict)
- TailwindCSS 4.1.10
- shadcn/ui + Radix UI
- Prisma 6.10.1 + PostgreSQL (Supabase)
- Zustand 5.0.5 + TanStack React Query 5.80
- React Hook Form + Zod
- Framer Motion, Recharts, Lucide React
- NextAuth 4.24 + custom JWT
- Cloudinary for images
- AFIP SDK for Argentine invoicing

---

## 2. NEW BRAND IDENTITY

### Brand Name: **Nexora**
> "Nexora" = Next + Ora (Latin for "edge/frontier"). Clean, modern, tech-forward.

### Tagline
> "Operations, simplified."

### Color Palette

**Primary Colors:**
```
Deep Indigo (Primary):     #1E1B4B  (replaces #0A2E52 navy)
Electric Violet (Accent):  #7C3AED  (replaces #00C4B3 teal)
Violet Hover:              #6D28D9
```

**Neutral Colors:**
```
Background:                #FAFAFA
Surface/Card:              #FFFFFF
Border:                    #E2E8F0
Muted Background:          #F1F5F9
Text Primary:              #0F172A
Text Secondary:            #64748B
Text Muted:                #94A3B8
```

**Semantic Colors:**
```
Success:                   #10B981 (emerald)
Warning:                   #F59E0B (amber)
Error:                     #EF4444 (red)
Info:                      #3B82F6 (blue)
```

**Dark Mode:**
```
Background:                #0F172A
Surface/Card:              #1E293B
Border:                    #334155
Text Primary:              #F8FAFC
Text Secondary:            #CBD5E1
Accent:                    #A78BFA (lighter violet)
```

### Typography
```
Primary Font:     Inter (Google Fonts) - clean, modern, excellent readability
Monospace Font:   JetBrains Mono - for code, receipts, technical data
```

### Spacing & Radius
```
Border Radius:    0.5rem (8px) base — clean, modern look
Shadows:          Subtle, using primary color at low opacity
```

---

## 3. RECOMMENDED NEW STACK

### Architecture: Turborepo Monorepo

This project uses a **monorepo** structure with three main apps and shared packages. The backend is a **standalone API server** separate from Next.js, enabling WebSockets, real-time events, background jobs, and serving both web and mobile clients from one API.

```
corelogix-erp/
├── apps/
│   ├── web/              # Next.js 15+ (App Router) — Web dashboard
│   ├── api/              # Go — REST API + WebSocket server (separate Go module)
│   └── mobile/           # React Native (Expo) — Mobile app
├── packages/
│   ├── shared/           # Shared TypeScript types, Zod schemas, constants, utils (web + mobile)
│   ├── ui/               # Shared UI primitives (for web + potential React Native Web)
│   └── config/           # Shared ESLint, TypeScript, Tailwind configs
├── turbo.json            # Orchestrates web + mobile builds (Go builds separately)
├── package.json          # Root workspace (pnpm)
├── tsconfig.base.json
└── docker-compose.yml    # Local dev: Postgres + Redis + Go API
```

> **Note on Go backend:** The `apps/api` directory is a standalone Go module with its own `go.mod`. It doesn't participate in the pnpm workspace but is orchestrated via Turborepo custom tasks or `docker-compose` for local dev. Database schema is defined via SQL migrations in `apps/api/migrations/`, and TypeScript types in `packages/shared` are generated from the OpenAPI spec exported by the Go API (via `openapi-typescript`).

---

### Web Frontend (`apps/web`)
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 15+ (App Router)** | SSR, RSC, file-based routing, optimized for dashboards |
| Language | **TypeScript 5.x (strict)** | Type safety across the entire app |
| Styling | **TailwindCSS 4.x** | Utility-first, fast iteration |
| UI Components | **shadcn/ui** | Radix primitives, fully customizable, copy-paste |
| Icons | **Lucide React** | Consistent, tree-shakeable icon set |
| Animations | **Framer Motion** | Production-grade animations |
| Charts | **Recharts** or **Tremor** | Data visualization |
| Forms | **React Hook Form + Zod** | Performant forms with schema validation |
| Tables | **TanStack Table v8** | Headless, powerful data tables |
| State (client) | **Zustand** | Lightweight, no boilerplate |
| State (server) | **TanStack React Query v5** | Caching, background refetch, optimistic updates |
| Date handling | **date-fns** | Lightweight, tree-shakeable |
| Toast | **Sonner** | Beautiful, minimal toast notifications |
| Command Palette | **cmdk** | Keyboard-driven navigation |
| Drag & Drop | **@dnd-kit** | Modern DnD for dashboards |
| Calendar | **react-big-calendar** | Full calendar views |
| Maps | **@vis.gl/react-google-maps** or Mapbox | Geolocation, route visualization |
| PDF | **@react-pdf/renderer** + **jsPDF** | Client & server-side PDF generation |
| Excel | **xlsx (SheetJS)** | Import/export spreadsheets |
| File Upload | **react-dropzone** | Drag & drop file uploads |
| WebSocket Client | **socket.io-client** | Real-time updates from API server |

> **Note:** Next.js handles SSR/RSC for the web dashboard but does **not** contain business logic APIs. All data mutations and queries go through the Fastify API. Next.js server actions are used only for lightweight BFF (Backend-for-Frontend) patterns like proxying authenticated requests.

---

### Backend API (`apps/api`) — Go
| Layer | Technology | Why |
|-------|-----------|-----|
| Language | **Go 1.22+** | Blazing fast, low memory, excellent concurrency, single binary deploy |
| HTTP Router | **Chi** or **Echo** | Lightweight, idiomatic, middleware-friendly |
| WebSockets | **gorilla/websocket** or **nhooyr/websocket** | Native Go performance for real-time events |
| ORM/Query | **sqlc** + **pgx** | Type-safe SQL at compile time, zero runtime overhead |
| Migrations | **golang-migrate** or **Atlas** | Versioned, repeatable database migrations |
| Database | **PostgreSQL** (via Supabase or Neon) | Robust, full-text search, JSON support |
| Auth | **Custom JWT** (golang-jwt) | Access + refresh tokens, stateless auth |
| Validation | **go-playground/validator** | Struct tag-based validation |
| API Docs | **swaggo/swag** | Auto-generated OpenAPI/Swagger from Go annotations |
| Background Jobs | **Asynq** (Redis-based) | Task queues: invoices, reports, emails, scheduled jobs |
| Caching | **Redis** (go-redis) | Rate limiting, session cache, pub/sub for WebSocket scaling |
| Image CDN | **Cloudinary** (Go SDK) or **Uploadthing** | Image optimization & delivery |
| Email | **Resend** (HTTP API) or **gomail** | Transactional emails via job queue |
| Monitoring | **Sentry** (Go SDK) | Error tracking & performance |
| Rate Limiting | **Custom middleware** or **tollbooth** | API protection |
| Config | **Viper** or **envconfig** | Env-based config management |
| Logging | **zerolog** or **slog** (stdlib) | Structured JSON logging |
| Testing | **stdlib testing** + **testify** | Unit & integration tests with mocks |

#### Real-Time Events (Socket.IO)
The backend emits events that both web and mobile clients consume:
- `order:created`, `order:updated`, `order:statusChanged` — live order board
- `stock:alert`, `stock:updated` — inventory alerts
- `delivery:locationUpdate`, `delivery:statusChanged` — GPS tracking for logistics
- `notification:new` — user notifications (mentions, approvals, assignments)
- `pos:sync` — POS terminal synchronization across devices
- `cashbox:movement` — real-time cash flow updates
- `chat:message` — internal team messaging

#### API Route Structure
```
/api/v1/auth/*          — login, register, refresh, logout
/api/v1/users/*         — user CRUD, roles, permissions
/api/v1/sales/*         — sales, invoices, credit notes
/api/v1/customers/*     — customer CRUD, loyalty, credit
/api/v1/products/*      — products, variants, categories, pricing
/api/v1/inventory/*     — stock, transfers, adjustments
/api/v1/purchases/*     — POs, suppliers, receiving
/api/v1/finance/*       — cashbox, checks, expenses, budgets
/api/v1/logistics/*     — routes, deliveries, fleet, tracking
/api/v1/hr/*            — employees, contracts, tasks
/api/v1/reports/*       — analytics, exports
/api/v1/settings/*      — business config, branches, tax
/api/v1/webhooks/*      — e-commerce & third-party integrations
/api/v1/uploads/*       — file/image uploads
```

---

### Mobile App (`apps/mobile`)
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **React Native (Expo SDK 52+)** | Cross-platform iOS/Android, shared JS ecosystem |
| Navigation | **Expo Router** | File-based routing (mirrors Next.js mental model) |
| UI Components | **Tamagui** or **NativeWind + custom** | Performant native styling, Tailwind-like DX |
| State (client) | **Zustand** | Same store patterns as web |
| State (server) | **TanStack React Query v5** | Same caching/fetching as web |
| Forms | **React Hook Form + Zod** | Shared validation schemas from `packages/shared` |
| Auth | **expo-secure-store** | Secure token storage on device |
| Push Notifications | **expo-notifications** + **FCM/APNs** | Order updates, stock alerts, task assignments |
| Maps | **react-native-maps** | Delivery tracking, route visualization |
| Camera/Scanner | **expo-camera** | Barcode/QR scanning for inventory |
| Offline Support | **WatermelonDB** or **MMKV** | Offline-first for field operations (deliveries, stock counts) |
| Biometrics | **expo-local-authentication** | Fingerprint/FaceID login |
| WebSocket Client | **socket.io-client** | Real-time updates (same events as web) |

#### Mobile-Specific Features
- **Delivery Driver App**: GPS tracking, route optimization, proof of delivery (photo + signature), offline delivery completion
- **Field Sales App**: Create orders on-the-go, scan products, check customer credit, collect payments
- **Warehouse Scanner**: Barcode scanning for receiving, picking, stock counts
- **Manager Dashboard**: KPI cards, approve orders/purchases, notifications
- **Employee Self-Service**: Clock in/out, view tasks, submit reports
- **POS Mode**: Simplified point-of-sale for tablet use at counters
- **Push Notifications**: Real-time alerts for approvals, stock alerts, order updates, task assignments

---

### Shared Packages (TypeScript — web + mobile)

#### `packages/shared`
- Zod validation schemas (used by web and mobile for client-side validation)
- TypeScript types/interfaces (auto-generated from Go API's OpenAPI spec via `openapi-typescript`)
- Business constants (tax rates, status enums, role definitions)
- Utility functions (formatters, calculators, date helpers)
- API client wrapper (typed fetch/axios client generated from OpenAPI)

#### `packages/ui`
- Base shadcn/ui components (for web)
- Shared component logic that could be reused

#### `packages/config`
- Shared ESLint, TypeScript, Tailwind configurations
- Common environment variable schemas

### Go API Internal Structure (`apps/api`)
```
apps/api/
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── config/               # Viper config, env loading
│   ├── server/               # HTTP server setup, middleware, routes
│   ├── handler/              # HTTP handlers (controllers) by domain
│   │   ├── auth.go
│   │   ├── sales.go
│   │   ├── inventory.go
│   │   ├── finance.go
│   │   └── ...
│   ├── service/              # Business logic layer
│   ├── repository/           # Database queries (sqlc-generated)
│   ├── middleware/            # Auth, CORS, rate limit, logging
│   ├── ws/                   # WebSocket hub, rooms, event handlers
│   ├── worker/               # Asynq background job handlers
│   └── pkg/                  # Internal shared utilities
│       ├── jwt/
│       ├── validator/
│       └── response/
├── migrations/               # SQL migration files
├── queries/                  # sqlc SQL query files
├── sqlc.yaml                 # sqlc configuration
├── docs/                     # Swagger/OpenAPI generated docs
├── go.mod
├── go.sum
├── Dockerfile
└── Makefile
```

---

### Infrastructure & DevOps
| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | **Turborepo** (JS apps) + **Makefile** (Go) | Fast builds, caching, task orchestration |
| Package Manager | **pnpm** | Fast, disk-efficient, great monorepo support |
| Web Hosting | **Vercel** | Optimized for Next.js, edge functions |
| API Hosting | **Railway**, **Fly.io**, or **AWS ECS** | Single binary Go deploy, low resource usage, persistent WebSockets |
| Database | **Supabase** or **Neon** (PostgreSQL) | Managed Postgres with connection pooling |
| Redis | **Upstash** or **Railway Redis** | Asynq queues, caching, WebSocket pub/sub (multi-instance) |
| Mobile Builds | **EAS Build (Expo)** | Cloud builds for iOS/Android, OTA updates |
| Mobile Distribution | **EAS Submit** + **TestFlight/Play Console** | App store submission pipeline |
| Monitoring | **Sentry** (all apps) | Error tracking across web, API, mobile |
| Analytics | **PostHog** | Product analytics (web + mobile SDKs) |
| Containers | **Docker** | Go API containerized for consistent deploys |

### Development
| Tool | Purpose |
|------|---------|
| Vitest | Unit & integration testing (web) |
| `go test` + testify | Unit & integration testing (Go API) |
| Playwright | E2E testing (web) |
| Detox or Maestro | E2E testing (mobile) |
| ESLint + Prettier | Code quality (JS/TS monorepo-wide) |
| golangci-lint | Code quality (Go — covers vet, staticcheck, etc.) |
| Husky + lint-staged | Pre-commit hooks (JS/TS) |
| GitHub Actions | CI/CD (lint → test → build → deploy per app) |
| Docker Compose | Local dev: Postgres + Redis + Go API (hot reload via Air) |
| Air | Go hot reload during development |

---

## 4. COMPLETE FEATURE MAP

### MODULE 1: Authentication & Onboarding
- [ ] Email/password registration (multi-step: admin info → business info → first branch)
- [ ] Email verification with token expiration
- [ ] Login with email/password
- [ ] Login with employee access code (numeric PIN)
- [ ] Password reset flow (request → email link → reset form)
- [ ] Password strength indicator (length, uppercase, lowercase, numbers, special chars)
- [ ] Role-based redirect after login (different roles see different dashboards)
- [ ] Session management with JWT in HttpOnly cookies (24h expiration)
- [ ] Session timeout (30 min inactivity) with 5-minute warning modal
- [ ] Multi-tab session synchronization
- [ ] Demo account creation with pre-loaded sample data
- [ ] Guided onboarding tour (step-by-step product walkthrough)
- [ ] Onboarding checklist for new users
- [ ] Terms & conditions page (14 sections)
- [ ] Privacy policy page (12 sections, Argentine law 25.326 compliance)
- [ ] Google OAuth integration

### MODULE 2: Dashboard
- [ ] Customizable widget grid (drag, drop, resize, add, remove)
- [ ] Layout persistence per user
- [ ] Role-based widget visibility
- [ ] Time-based greeting (morning/afternoon/evening)
- [ ] KPI cards: monthly sales, pending orders, active customers, stock alerts
- [ ] 7-day sales trend area chart
- [ ] Recent activity feed (sales, purchases, orders)
- [ ] Quick action buttons (filtered by role)
- [ ] Weather widget (for logistics planning)
- [ ] Command palette (Ctrl+K) for quick navigation
- [ ] Keyboard shortcuts throughout the app
- [ ] Onboarding tour trigger button
- [ ] Dashboard data refresh with loading states

### MODULE 3: Sales Management
- [ ] **Sales list** with filters: date range, invoice status, payment status
- [ ] **Sales detail panel**: customer info, seller, items breakdown, associated documents
- [ ] **Sales KPIs**: monthly total, pending balance, invoices generated, credit notes
- [ ] **Invoice generation** (AFIP/tax authority integration)
- [ ] **Credit note creation** from sales (select items to return, reason, calculate refund)
- [ ] **Customer management**: CRUD, credit limits, reputation tracking, delivery addresses
- [ ] **Customer categories/segmentation**
- [ ] **Customer loyalty program**
- [ ] **Promotions engine**: percentage discount, quantity-based, combo deals, date ranges
- [ ] **Sales orders (Pedidos)**: full lifecycle with 14 status states
- [ ] **Order approval workflow**: pending → evaluation → approved/rejected → preparation → shipped → delivered
- [ ] **Order status stepper** (visual timeline)
- [ ] **Order history audit trail** (every status change logged with user, timestamp, notes)
- [ ] **Signature capture** on delivery
- [ ] **Partial delivery** handling
- [ ] **Sales approvals page** (for managers to approve/reject pending orders)
- [ ] **POS (Point of Sale)** — see Module 3a below
- [ ] **Salesperson dashboard** (individual view for field sales)
- [ ] **Salespeople map view** (real-time location on Google Maps)
- [ ] **Customer visit tracking** (schedule, record, track visits)
- [ ] **Visit routes** (recurring visit schedules per zone)

### MODULE 3a: Point of Sale (POS)
- [ ] **Product search** with barcode scanning support
- [ ] **Product grid** for quick selection (bulk products)
- [ ] **Cart panel** with quantity controls, variant display, loose sale weights
- [ ] **Multi-payment checkout**: cash, card, transfer, check — split across methods
- [ ] **Payment shortcuts** (Alt+1-9 for payment methods)
- [ ] **Customer selection** during sale
- [ ] **Bag/register system** (open bag → sell → close bag → reconcile)
- [ ] **Cash withdrawal** management with employee validation
- [ ] **Daily summary**: total sales, ticket count, average ticket
- [ ] **Variant selector** (color, size) during sale
- [ ] **Weighing modal** for bulk/loose products
- [ ] **Sale complete** confirmation with receipt
- [ ] **Thermal receipt printing** (58mm format, Courier New font)
- [ ] **Configurable hotkeys** for POS operations
- [ ] **POS analytics** (daily, weekly, monthly)
- [ ] **Open bags tracking** (partial unit sales)
- [ ] **Internal POS orders**

### MODULE 4: Inventory Management
- [ ] **Product catalog** CRUD with full form:
  - Name, description, SKU, barcode/PLU
  - Category & family assignment
  - Images (upload, validation)
  - Pricing (cost, margin, sale price, loose price, USD price)
  - Variants (colors, sizes with barcodes per variant)
  - Unit of measure (KG, UNIDAD, LITRO, METRO, etc.)
  - Weight, dimensions
  - Branch-specific catalog items with per-branch stock
- [ ] **Product categories & families** (hierarchical)
- [ ] **Stock management** per branch
- [ ] **Stock movement history** (audit trail: who, what, when, why)
- [ ] **Price management** with multiple price lists per branch
- [ ] **Price lists** (different prices for different customer categories)
- [ ] **Unit conversions** (e.g., 1 bag = 25 kg)
- [ ] **Product returns** (customer returns, supplier returns)
- [ ] **Bulk import** from Excel/CSV with progress tracking
- [ ] **Product export** (CSV, Excel, JSON)
- [ ] **Stock breakage/loss** tracking
- [ ] **Low stock alerts** and notifications
- [ ] **Product variants** management (colors with hex codes, sizes numeric/letter)

### MODULE 5: Finance
- [ ] **Financial summary dashboard**: gross revenue, costs, net profit, receivables, payables, profitability
- [ ] **Cash flow chart** (inflows vs outflows, area chart)
- [ ] **Expense composition** pie chart by category
- [ ] **Date range picker** for all financial reports
- [ ] **Export to Excel** (multi-sheet: summary, daily cash flow, expenses)
- [ ] **Cash boxes (Cajas)** per branch — open, close, reconcile
- [ ] **Cash movements** (INGRESO, EGRESO, AJUSTE types)
- [ ] **Cash reconciliation (Arqueo)** with approval workflow
- [ ] **Bank accounts** management
- [ ] **Bank reconciliation**
- [ ] **Check management** (receive, endorse, deposit, bounce — full lifecycle)
- [ ] **Customer credit accounts (Cuenta Corriente)** — track customer debt
- [ ] **Supplier payment accounts** — track what you owe
- [ ] **Expense tracking** with categories (operational, admin, logistics, etc.)
- [ ] **Recurring expenses** (monthly/annual)
- [ ] **Tax management** (IVA/VAT configuration per branch)
- [ ] **Tax withholdings (Retenciones)** by province
- [ ] **Commission calculation** per salesperson (configurable tiers)
- [ ] **Commission configuration** (percentage, fixed, tiered by sales volume)
- [ ] **Financial vouchers/receipts (Comprobantes)**
- [ ] **Payment methods** management (cash, card, transfer, check — each with commission %)
- [ ] **Financial indices/ratios**
- [ ] **Budgets** management
- [ ] **Cash withdrawals** tracking

### MODULE 6: Purchasing & Suppliers
- [ ] **Supplier management** CRUD (name, CUIT, contact, bank info)
- [ ] **Supplier pricing agreements (Convenios)** with quantity tiers
- [ ] **Purchase orders** (create, approve, receive, close)
- [ ] **Purchase order status lifecycle** (similar to sales orders)
- [ ] **Supplier invoice processing** (match against PO, variance detection)
- [ ] **Supplier returns**
- [ ] **Supplier credit notes**
- [ ] **Supplier tax withholdings** by province
- [ ] **Product-supplier price relationships**

### MODULE 7: Logistics & Distribution
- [ ] **Delivery management (Repartos)**: plan, dispatch, track, complete
- [ ] **Route planning** with optimization
- [ ] **Delivery status tracking**: planned → in progress → completed/cancelled
- [ ] **Delivery events log**: arrival, completion, failure, partial delivery
- [ ] **Driver view** ("My Route" page)
- [ ] **Fleet management** (vehicles with dimensions, capacity, plates)
- [ ] **Vehicle dimension visualizer**
- [ ] **Zone management** (service territories per branch)
- [ ] **Internal transfers** between branches (with item-level tracking)
- [ ] **Street visits** view for field team
- [ ] **Salesman departure tracking** (when they leave the branch)
- [ ] **Real-time salesperson location** on map

### MODULE 8: HR & Administration
- [ ] **Employee management** (personal info, role, branch assignments)
- [ ] **Employee contracts** (salary, start/end dates, modality)
- [ ] **HR dashboard** with team overview
- [ ] **Task management** with priorities, assignees, comments
- [ ] **Reminders/notifications system**
- [ ] **Goals/objectives** (sales targets by employee/product)
- [ ] **Goal evaluation** tracking
- [ ] **Supervision dashboard** (orders, inventory, logistics oversight)
- [ ] **Branch management** (create, configure branches)
- [ ] **System configuration** (account settings, billing, fiscal, notifications)
- [ ] **Integration management** (API keys, e-commerce clients, Google Calendar)
- [ ] **Product variant configuration** (global colors, sizes, clothing types)
- [ ] **Reports** page with multiple export formats
- [ ] **Help/documentation** page

### MODULE 9: E-Commerce API
- [ ] **API client management** (create, update, delete clients)
- [ ] **API key generation** (`ec_` prefix + random hex)
- [ ] **API secret** with bcrypt hashing (shown only once)
- [ ] **Secret rotation**
- [ ] **Bearer token authentication** (JWT, 1-hour expiration)
- [ ] **CORS origin validation** per client
- [ ] **Product listing endpoint** (paginated, searchable, filterable)
- [ ] **Product detail endpoint**
- [ ] **Inventory metrics endpoint**
- [ ] **Usage tracking** (lastUsedAt per client)

### MODULE 10: User Profile
- [ ] **Profile view and edit**
- [ ] **Password change**
- [ ] **Notification preferences**
- [ ] **Layout preferences** (dashboard layout persistence)
- [ ] **API key management** (AFIP, Google Maps, Cloudinary credentials)

---

## 5. ALL PAGES & ROUTES

### Public Pages (Auth Group)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Auth-aware redirect (→ dashboard or → login) |
| `/login` | Login | Email/password + employee access code tabs |
| `/register` | Register | 3-step form: admin → business → branch |
| `/demo` | Demo | Create demo account with sample data |
| `/forgot-password` | Forgot Password | Email input, sends reset link |
| `/reset-password` | Reset Password | Token-validated new password form |
| `/verify-email` | Verify Email | Token auto-verification + resend option |
| `/terms` | Terms | 14-section terms & conditions |
| `/privacy` | Privacy | 12-section privacy policy |
| `/trial-demo` | Trial Demo | Landing page for trial experience |

### Onboarding
| Route | Page | Description |
|-------|------|-------------|
| `/onboarding` | Onboarding | 6-step guided tour (Welcome, CRM, ERP, POS, Analytics, Complete) |

### Protected ERP Pages (Dashboard Group)

#### Core
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Customizable widget grid, KPIs, charts, activity feed |
| `/dashboard/perfil` | Profile | User profile settings |
| `/dashboard/analisis` | Analytics | Advanced analytics & reporting |
| `/dashboard/ayuda` | Help | Documentation & support |
| `/dashboard/reportes` | Reports | Report generation & export |
| `/dashboard/recordatorios` | Reminders | Reminder management |
| `/dashboard/tareas` | Tasks | Task management with comments |
| `/dashboard/objetivos` | Objectives | Sales goals & targets |
| `/dashboard/supervision` | Supervision | Management oversight dashboard |
| `/dashboard/facturacion` | Invoicing | Invoice management |
| `/dashboard/invoicing` | Invoicing (alt) | Alternative invoicing interface |

#### Sales (`/dashboard/ventas/...`)
| Route | Page | Description |
|-------|------|-------------|
| `ventas` | Sales List | All sales with filters, KPIs, detail panel |
| `ventas/clientes` | Customers | Customer CRUD, credit limits, reputation |
| `ventas/pedidos` | Orders | Sales order management (full lifecycle) |
| `ventas/pos` | POS | Point of sale terminal |
| `ventas/pos/analytics` | POS Analytics | POS performance metrics |
| `ventas/pos/bolsas` | POS Bags | Cash register bag management |
| `ventas/pos/pedidos-internos` | Internal Orders | POS internal order handling |
| `ventas/vendedor` | Salesperson View | Individual salesperson dashboard |
| `ventas/vendedor/encargos` | Assignments | Salesperson task assignments |
| `ventas/vendedores-mapa` | Sales Map | Real-time salesperson locations |
| `ventas/visitas` | Visits | Customer visit scheduling & tracking |
| `ventas/fidelidad` | Loyalty | Customer loyalty program |
| `ventas/promociones` | Promotions | Promotion management |
| `ventas/aprobaciones` | Approvals | Order approval workflow |

#### Inventory (`/dashboard/inventario/...`)
| Route | Page | Description |
|-------|------|-------------|
| `inventario/productos` | Products | Product catalog CRUD (95KB component!) |
| `inventario/categorias` | Categories | Product categories & families |
| `inventario/stock` | Stock | Stock levels per branch |
| `inventario/precios` | Prices | Price management |
| `inventario/listas-precios` | Price Lists | Multiple price list management |
| `inventario/conversiones` | Conversions | Unit conversion rules |
| `inventario/devoluciones` | Returns | Return processing |
| `inventario/importar` | Import | Bulk import from Excel/CSV |
| `inventario/quiebre-stock` | Stock Breakage | Loss & breakage tracking |

#### Finance (`/dashboard/finanzas/...`)
| Route | Page | Description |
|-------|------|-------------|
| `finanzas/resumen` | Summary | Financial overview with KPIs & charts |
| `finanzas/cajas-bancos` | Cash & Banks | Cash box & bank account management |
| `finanzas/cheques` | Checks | Check lifecycle management |
| `finanzas/comisiones` | Commissions | Sales commission tracking |
| `finanzas/comprobantes` | Vouchers | Financial document management |
| `finanzas/conciliaciones` | Reconciliation | Bank reconciliation |
| `finanzas/cuentas` | Accounts | Chart of accounts |
| `finanzas/gastos` | Expenses | Expense tracking by category |
| `finanzas/impuestos` | Taxes | Tax configuration per branch |
| `finanzas/indices` | Indices | Financial ratios & indices |
| `finanzas/metodos-pago` | Payment Methods | Payment method configuration |
| `finanzas/movimientos` | Movements | Transaction log |
| `finanzas/presupuestos` | Budgets | Budget planning |
| `finanzas/retenciones` | Withholdings | Tax withholding management |
| `finanzas/retiros` | Withdrawals | Cash withdrawal tracking |

#### Logistics (`/dashboard/logistica/...`)
| Route | Page | Description |
|-------|------|-------------|
| `logistica/repartos` | Deliveries | Delivery route management |
| `logistica/repartos/mi-ruta` | My Route | Driver's personal route view |
| `logistica/repartos/mis-visitas` | My Visits | Driver's visit schedule |
| `logistica/salidas` | Departures | Outbound shipment tracking |
| `logistica/transferencias-internas` | Transfers | Inter-branch stock transfers |
| `logistica/vehiculos` | Vehicles | Fleet management |
| `logistica/visitas-calle` | Street Visits | Field team visit management |
| `logistica/zonas` | Zones | Service territory management |

#### Suppliers (`/dashboard/proveedores/...`)
| Route | Page | Description |
|-------|------|-------------|
| `proveedores` | Suppliers | Supplier CRUD |
| `proveedores/compras` | Purchases | Purchase order management |
| `proveedores/convenios` | Agreements | Pricing agreements with tiers |
| `proveedores/retenciones` | Withholdings | Supplier tax withholdings |

#### Warehouse (`/dashboard/deposito/...`)
| Route | Page | Description |
|-------|------|-------------|
| `deposito/pedidos` | Warehouse Orders | Order fulfillment from warehouse |

#### HR (`/dashboard/rrhh/...`)
| Route | Page | Description |
|-------|------|-------------|
| `rrhh/empleados` | Employees | Employee management |
| `rrhh/contratos` | Contracts | Employment contract management |
| `rrhh/panel` | HR Dashboard | HR overview panel |

#### Administration (`/dashboard/administracion/...`)
| Route | Page | Description |
|-------|------|-------------|
| `administracion` | Admin Hub | Administration landing page |
| `administracion/empleados` | Admin Employees | Employee admin functions |
| `administracion/sucursales` | Branches | Branch CRUD |
| `administracion/variantes` | Variants | Product variant config (colors, sizes) |
| `administracion/configuracion` | Settings | System settings (account, billing, fiscal, notifications, integrations) |
| `administracion/integraciones` | Integrations | External service connections |

---

## 6. AUTHENTICATION & AUTHORIZATION

### Auth Flows

**Registration Flow:**
1. Step 1: Admin info (name, email, password with strength indicator)
2. Step 2: Business info (company name, CUIT/tax ID)
3. Step 3: First branch (name, address, accept terms)
4. Email verification sent
5. User verifies email via token link
6. Redirect to login

**Login Flow (Email/Password):**
1. User enters email + password
2. Server validates against `Usuario` table (bcrypt compare)
3. JWT created with: `{ userId, role, sucursalId, name, email, sucursales[] }`
4. HttpOnly cookie set (24h, SameSite: lax, secure in prod)
5. Role-based redirect:
   - VENDEDOR_CALLE → `/dashboard/ventas/vendedor`
   - ENCARGADO_DE_CALLE → `/dashboard/logistica/visitas-calle`
   - ENCARGADO_DEPOSITO → `/dashboard/deposito/pedidos`
   - Everyone else → `/dashboard`

**Login Flow (Employee Access Code):**
1. Employee enters 7-digit numeric code
2. Server looks up `Empleado` by `accessCode`
3. Loads employee's branch assignments
4. Creates session with employee-specific permissions

**Password Reset Flow:**
1. User enters email on forgot-password page
2. Server generates token (stored in `PasswordResetToken` table, 1h expiry)
3. Email sent with reset link
4. User clicks link, token validated
5. New password set, redirect to login

**Session Management:**
- 30-minute inactivity timeout
- 5-minute warning modal before timeout
- Multi-tab synchronization (activity in one tab resets timer in all)
- On timeout: logout + redirect to login with return URL

### Role Definitions (9 roles)
```
ADMIN                  - Full system access, all modules
VENDEDOR               - Sales module, customer management, orders
ENCARGADO              - Branch management, approvals, oversight
ENCARGADO_DE_CALLE     - Field team management, street visits
ENCARGADO_DEPOSITO     - Warehouse operations, stock management
FINANZAS               - Finance module, accounting, reports
LOGISTICA              - Delivery management, routes, fleet
REPARTIDOR             - Driver view, delivery execution
VENDEDOR_CALLE         - Field sales, mobile-optimized view
```

### Permission System
- Server-side check on every action: `protectAction([Rol.ADMIN, Rol.VENDEDOR, ...])`
- Layout-level session check (redirects to login if no session)
- Branch-level access: users can only access data from their assigned branches
- Widget visibility filtered by role on dashboard
- Navigation menu items filtered by role
- Quick actions filtered by role

---

## 7. DATABASE SCHEMA

### Enums (45+)

```
Rol: ADMIN, VENDEDOR, ENCARGADO, ENCARGADO_DE_CALLE, ENCARGADO_DEPOSITO,
     FINANZAS, LOGISTICA, REPARTIDOR, VENDEDOR_CALLE

EstadoPedido: PENDIENTE_APROBACION, EN_EVALUACION, APROBADO, APROBADO_REPARTIDOR,
              RECHAZADO, EN_CONSOLIDACION, EN_PREPARACION, LISTO_PARA_ENVIO, ENVIADO,
              ENTREGADO, ABASTECIDO, ENTREGADO_PARCIALMENTE, CANCELADO, RECLAMADO,
              PENDIENTE_ABASTECIMIENTO, NO_ENTREGADO

EstadoReparto: PLANIFICADO, EN_CURSO, FINALIZADO, CANCELADO

TipoComprobante: FACTURA, NOTA_CREDITO, NOTA_DEBITO
TipoComprobanteLiteral: A, B, N, X
TipoVenta: DISTRIBUIDORA, POS

Reputacion: DEUDOR, BUENA, CRITICA, EXCELENTE, NORMAL

CondicionIVA: RESPONSABLE_INSCRIPTO, MONOTRIBUTO, EXENTO, NO_RESPONSABLE, CONSUMIDOR_FINAL

TipoTalle: NUMERO, LETRA
UnidadDeMedida: KG, UNIDAD, LITRO, METRO, CAJA, BOLSA, PACK (and more)

EstadoDeuda: PENDIENTE, PARCIAL, PAGADA, VENCIDA
EstadoCheque: RECIBIDO, DEPOSITADO, RECHAZADO, ENDOSADO, COBRADO
EstadoArqueo: PENDIENTE_REVISION, APROBADO, RECHAZADO

TipoMovimiento: INGRESO, EGRESO, AJUSTE
TipoMovimientoStock: COMPRA, VENTA, AJUSTE, TRANSFERENCIA, DEVOLUCION, QUIEBRE
TipoCaja: EFECTIVO, BANCO

TipoComision: PORCENTAJE, FIJO, ESCALONADO
TipoPromocion: PORCENTAJE, CANTIDAD, COMBO, REGALO, PRECIO_FIJO
TipoDescuento: PORCENTAJE, MONTO_FIJO

ModalidadTrabajo: PRESENCIAL, REMOTO, HIBRIDO
TipoGasto: OPERATIVO, ADMINISTRATIVO, LOGISTICA, COMERCIAL, IMPOSITIVO

EstadoBolsa: ABIERTA, CERRADA
EstadoPresupuesto: BORRADOR, ENVIADO, APROBADO, RECHAZADO, VENCIDO

TipoEvento: LLEGADA, ENTREGA, NO_ENTREGA, ENTREGA_PARCIAL, COBRO
```

### Models (102 total) — Organized by Domain

#### Users & Organization
```prisma
Usuario {
  id, email (unique), password, nombre, apellido, rol (Rol enum),
  emailVerified, image, phone,
  sucursales[] → Sucursal,
  empleados[] → Empleado,
  settings → UserSettings,
  ecommerceClients[] → EcommerceClient,
  createdAt, updatedAt
}

Empleado {
  id, nombre, apellido, email (unique), telefono, cuil (unique), cbu (unique),
  accessCode (unique), rol, fechaIngreso, activo, notas,
  sucursalId → Sucursal,
  sucursales[] → EmpleadoSucursal,
  zonas[] → EmpleadoZona,
  usuarioId → Usuario,
  contratos[] → Contrato,
  comisiones[] → ComisionVendedor,
  configComision → ConfiguracionComisionVendedor,
  objetivos[] → Objetivo,
  createdAt, updatedAt
}

Sucursal {
  id, nombre, direccion, telefono, email, activa,
  usuarioId → Usuario,
  empleados[] → Empleado,
  empleadosSucursal[] → EmpleadoSucursal,
  productos[] → CatalogoProducto,
  ventas[] → Venta,
  pedidos[] → PedidoVenta,
  cajas[] → Caja,
  zonas[] → Zona,
  createdAt, updatedAt
}

EmpleadoSucursal { id, empleadoId, sucursalId } (junction table)
EmpleadoZona { id, empleadoId, zonaId }

UserSettings {
  id, usuarioId → Usuario,
  afipCuit, afipCert, afipKey, afipPuntoVenta,
  cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret,
  googleMapsApiKey, geminiApiKey,
  puntoVentaAfip, createdAt, updatedAt
}

EmpleadoSettings { id, empleadoId, dashboardLayout (Json) }
Contrato { id, empleadoId, tipoContrato, fechaInicio, fechaFin, salario, modalidad }
```

#### Products & Inventory
```prisma
Producto {
  id, nombre, descripcion, marca, codigoBarras (unique), plu (unique),
  imagenUrl, imagenesUrls (String[]),
  peso, ancho, alto, largo,
  precioVenta, precioSuelto, precioVentaUSD, precioCompra,
  unidadDeMedida, margenUtilidad,
  familiaId → FamiliaProducto,
  categoriaId → CategoriaProducto,
  variantes[] → VarianteProducto,
  catalogos[] → CatalogoProducto,
  productoPadreId → Producto (self-relation),
  activo, createdAt, updatedAt
}

VarianteProducto {
  id, productoId → Producto,
  colorId → Color, talleId → Talle,
  codigoBarras (unique), stock, precioAdicional,
  activo, createdAt
}

CatalogoProducto {
  id, productoId → Producto, sucursalId → Sucursal,
  stock, stockMinimo, precioVenta, precioSuelto,
  margenUtilidad, activo, createdAt, updatedAt
}

FamiliaProducto { id, nombre, sucursalId, categorias[] → CategoriaProducto }
CategoriaProducto { id, nombre, familiaId → FamiliaProducto, productos[] }

Color { id, nombre, hex, activo, sucursalId }
Talle { id, valor, tipo (TipoTalle), orden, activo, sucursalId }
TipoPrenda { id, nombre, activo, sucursalId }

MovimientoStock {
  id, productoId, sucursalId, varianteId,
  cantidad, tipoMovimiento, motivo, referenciaId,
  usuarioId, createdAt
}

BolsaAbierta { id, productoId, sucursalId, pesoRestante, estado, createdAt }
ConversionProducto { id, productoId, unidadOrigen, unidadDestino, factor }
```

#### Sales
```prisma
Venta {
  id, sucursalId, clienteId, vendedorId,
  fecha, total, subtotal, descuento, impuesto,
  tipoVenta (DISTRIBUIDORA/POS),
  estado, facturada, comprobanteId,
  items[] → ItemVenta, pagos[] → PagoVenta,
  notasCredito[] → NotaCredito,
  createdAt, updatedAt
}

ItemVenta {
  id, ventaId, productoId, varianteId,
  cantidad, precioUnitario, subtotal, descuento
}

PedidoVenta {
  id, numeroPedido, sucursalId, clienteId, vendedorId,
  estado (EstadoPedido), prioridad,
  fechaEntrega, direccionEntregaId,
  items[] → ItemPedidoVenta,
  historial[] → HistorialEstadoPedido,
  notas, firmaCliente, firmaEmpleado,
  repartoId → Reparto,
  createdAt, updatedAt
}

ItemPedidoVenta {
  id, pedidoId, productoId, varianteId,
  cantidad, cantidadEntregada, precioUnitario, subtotal
}

HistorialEstadoPedido {
  id, pedidoId, estadoAnterior, estadoNuevo,
  usuarioId, notas, createdAt
}

Cliente {
  id, nombre, apellido, email, telefono, cuit, dni,
  condicionIVA, reputacion, limiteCredito, saldoDeudor,
  categoriaId → CategoriaCliente,
  sucursalId, activo,
  direcciones[] → Direccion,
  ventas[] → Venta,
  pedidos[] → PedidoVenta,
  cuentaCorriente → CuentaCorriente,
  createdAt, updatedAt
}

Direccion { id, clienteId, calle, numero, piso, depto, ciudad, provincia, codigoPostal, principal }
CategoriaCliente { id, nombre, descripcion, sucursalId }
DevolucionCliente { id, ventaId, clienteId, items, motivo, total, createdAt }
```

#### Purchasing
```prisma
Proveedor {
  id, nombre, cuit (unique), email, telefono, direccion,
  contacto, notas, activo, sucursalId,
  productos[] → ProductoProveedor,
  convenios[] → ConvenioProveedor,
  compras[] → Compra,
  pedidosCompra[] → PedidoCompra,
  retenciones[] → RetencionProveedor,
  cuentaCorriente → CuentaCorrienteProveedor,
  createdAt, updatedAt
}

ProductoProveedor { id, proveedorId, productoId, precio, codigoProveedor }
ConvenioProveedor { id, proveedorId, productoId, cantidadMinima, precioConvenio, vigente }

Compra {
  id, proveedorId, sucursalId, fecha, total, estado,
  items[] → ItemCompra, pagos[] → PagoCompra,
  createdAt
}

PedidoCompra {
  id, proveedorId, sucursalId, estado,
  items[] → ItemPedidoCompra,
  historial[] → HistorialEstadoPedidoCompra,
  createdAt, updatedAt
}

DevolucionProveedor { id, compraId, proveedorId, items, motivo, total }
NotaCreditoProveedor { id, proveedorId, compraId, monto, motivo }
RetencionProveedor { id, proveedorId, provincia, tipo, porcentaje }
```

#### Finance
```prisma
Caja {
  id, nombre, sucursalId, tipo (TipoCaja),
  saldo, activa,
  movimientos[] → MovimientoCaja,
  arqueos[] → ArqueoCaja
}

MovimientoCaja {
  id, cajaId, tipo (TipoMovimiento), monto, concepto,
  referenciaId, referenciaTipo,
  usuarioId, createdAt
}

ArqueoCaja {
  id, cajaId, montoSistema, montoFisico, diferencia,
  estado (EstadoArqueo), usuarioId,
  desglose[] → ArqueoDesglose,
  createdAt
}

EntidadBancaria { id, nombre, sucursal, numeroCuenta, cbu, alias, sucursalId }

Cheque {
  id, numero, monto, fechaEmision, fechaVencimiento,
  estado (EstadoCheque), banco, emisor, receptor,
  sucursalId, createdAt
}

CuentaCorriente { id, clienteId, saldo, limiteCredito, activa }
CuentaCorrienteProveedor { id, proveedorId, saldo }

MetodoPago { id, nombre, tipo, comisionPorcentaje, descuentoPorcentaje, activo, sucursalId }
PagoVenta { id, ventaId, metodoPagoId, monto, referencia, createdAt }
PagoCompra { id, compraId, metodoPagoId, monto, referencia, createdAt }

NotaCredito { id, ventaId, clienteId, monto, motivo, items, createdAt }
NotaCreditoAplicada { id, notaCreditoId, ventaId, monto, createdAt }

Comprobante {
  id, tipo (TipoComprobante), tipoLiteral (A/B/N/X),
  puntoVenta, numero, fecha, total,
  condicionIVA, cae, caeFechaVto,
  ventaId, sucursalId, createdAt
}

Gasto { id, concepto, monto, categoria, fecha, sucursalId, usuarioId }
GastoRecurrente { id, concepto, monto, categoria, frecuencia, proximaFecha, sucursalId }
Impuesto { id, nombre, porcentaje, activo, sucursalId }

ListaPrecio { id, nombre, sucursalId, activa, precios[] → PrecioListaProducto }
PrecioListaProducto { id, listaId, productoId, precio }
```

#### Logistics
```prisma
Reparto {
  id, sucursalId, repartidorId → Empleado,
  vehiculoId → Vehiculo,
  fecha, estado (EstadoReparto),
  pedidos[] → PedidoVenta,
  eventos[] → EventoReparto,
  createdAt
}

EventoReparto {
  id, repartoId, pedidoId, tipo (TipoEvento),
  latitud, longitud, notas, foto,
  createdAt
}

Vehiculo {
  id, marca, modelo, patente (unique), año,
  capacidadKg, capacidadM3,
  ancho, alto, largo,
  activo, sucursalId
}

Zona { id, nombre, sucursalId, descripcion, empleados[] → EmpleadoZona }

TransferenciaSucursal {
  id, sucursalOrigenId, sucursalDestinoId,
  estado, fecha,
  items[] → ItemTransferencia,
  createdAt
}

ItemTransferencia { id, transferenciaId, productoId, varianteId, cantidad }

RutaDeVisita {
  id, nombre, zonaId, empleadoId,
  diaSemana, frecuencia,
  clientes[], createdAt
}

Visita {
  id, clienteId, empleadoId, fecha,
  tipo, estado, notas, resultado,
  latitud, longitud, createdAt
}

SalidaVendedor { id, empleadoId, sucursalId, fechaSalida, fechaRetorno, notas }
```

#### Promotions & Loyalty
```prisma
Promocion {
  id, nombre, descripcion, tipo (TipoPromocion),
  valor, productoId, categoriaId,
  fechaInicio, fechaFin, activa,
  cantidadMinima, productoRegaloId,
  sucursalId, createdAt
}

ProgramaFidelidad {
  id, nombre, descripcion, puntosPorPeso,
  activo, sucursalId
}
```

#### Operations & Tasks
```prisma
Tarea {
  id, titulo, descripcion, prioridad, estado,
  fechaVencimiento, asignadoAId → Empleado,
  creadoPorId → Usuario,
  comentarios[] → ComentarioTarea,
  sucursalId, createdAt, updatedAt
}

ComentarioTarea { id, tareaId, usuarioId, contenido, createdAt }
Recordatorio { id, titulo, mensaje, fecha, leido, usuarioId, createdAt }

Objetivo {
  id, empleadoId, productoId, categoriaId,
  meta, actual, periodo, fechaInicio, fechaFin,
  sucursalId, createdAt
}

EvaluacionObjetivo { id, objetivoId, valor, fecha, notas }
Supervision { id, sucursalId, tipo, datos (Json), fecha, createdAt }

ComisionVendedor { id, empleadoId, ventaId, monto, porcentaje, periodo, createdAt }
ConfiguracionComisionVendedor {
  id, empleadoId, tipoComision, porcentajeBase,
  escalonamiento (Json), activa
}
```

#### E-Commerce & Integrations
```prisma
EcommerceClient {
  id, name, apiKey (unique), apiSecretHash,
  isActive, allowedOrigins (String[]),
  lastUsedAt, usuarioId → Usuario,
  sucursalId → Sucursal,
  createdAt, updatedAt
}

GoogleCalendar { id, calendarId, accessToken, refreshToken, usuarioId }

PasswordResetToken { id, email, token, expiresAt, createdAt }
EmailVerificationToken { id, email, token, expiresAt, createdAt }
```

### Key Relationships Summary
- **One-to-Many:** Usuario→Sucursal, Sucursal→Empleado, Cliente→Venta, Proveedor→Compra
- **Many-to-Many:** Empleado↔Sucursal (via junction), Empleado↔Zona (via junction), Producto↔Proveedor (via junction)
- **Self-Relations:** Producto→Producto (parent/child), Empleado supervisor chains
- **Cascade Deletes:** Usuario cascades to settings, clients; Sucursal cascades to inventory

---

## 8. SERVER ACTIONS

76 server action files organized by domain:

### Authentication & User
- `auth.actions.ts` — login, logout, validateAccessCode, getSession
- `register.actions.ts` — registerUser (multi-step)
- `password-reset.actions.ts` — requestReset, validateToken, resetPassword
- `email-verification.actions.ts` — verifyEmail, resendVerification
- `demo.actions.ts` — createDemoAccount (generates sample data)
- `session.actions.ts` — refreshSession, getSessionData

### Sales
- `ventas.actions.ts` — getVentasForSucursal, getVentaDetails, createVenta
- `pedidos.actions.ts` — CRUD + status transitions for sales orders
- `clients.actions.ts` — CRUD + credit management + reputation
- `pos.actions.ts` — createSale, openBag, closeBag, processPOSPayment
- `bolsas.actions.ts` — bag management for POS
- `aprobaciones.actions.ts` — approveOrder, rejectOrder
- `visitas.actions.ts` — schedule, record, track customer visits
- `vendedores-ubicacion.actions.ts` — real-time location updates
- `fidelidad.actions.ts` — loyalty program management
- `promociones.actions.ts` — promotion CRUD + engine

### Inventory
- `products.actions.ts` — CRUD + variants + images + import/export
- `stock.actions.ts` — stock adjustments, movements, alerts
- `categorias.actions.ts` — category & family management
- `conversiones.actions.ts` — unit conversion rules
- `devoluciones.actions.ts` — customer & supplier returns
- `listas-precios.actions.ts` — price list management
- `precios.actions.ts` — price management & updates

### Finance
- `finanzas.actions.ts` — getFinancialSummary, export to Excel
- `cajas-bancos.actions.ts` — cash box operations, bank accounts
- `movimientos.actions.ts` — financial movement logging
- `pagos.actions.ts` — payment processing & recording
- `conciliaciones.actions.ts` — bank & cash reconciliation
- `cheques.actions.ts` — check lifecycle management
- `cuentas.actions.ts` — account management
- `gastos.actions.ts` — expense CRUD + recurring expenses
- `comisiones.actions.ts` — commission calculation & configuration
- `comprobantes.actions.ts` — voucher/receipt management
- `retenciones.actions.ts` — tax withholding management
- `retiros.actions.ts` — cash withdrawal tracking
- `presupuestos.actions.ts` — budget management
- `indices.actions.ts` — financial indices
- `impuestos.actions.ts` — tax configuration
- `metodos-pago.actions.ts` — payment method CRUD

### Purchasing
- `compras.actions.ts` — purchase transactions
- `pedidos-compra.actions.ts` — purchase order lifecycle
- `providers.actions.ts` — supplier CRUD
- `agreements.actions.ts` / `convenios.actions.ts` — pricing agreements

### Logistics
- `repartos.actions.ts` — delivery management & tracking
- `ruta.actions.ts` — route planning
- `transferencia.actions.ts` — inter-branch transfers
- `vehiculos.actions.ts` — fleet management
- `zonas.actions.ts` — zone management
- `salidas.actions.ts` — outbound shipment tracking

### HR & Admin
- `empleados.actions.ts` — employee CRUD
- `contratos.actions.ts` — contract management
- `tareas.actions.ts` — task management with comments
- `recordatorios.actions.ts` — reminder/notification management
- `objetivos.actions.ts` — goals & target tracking
- `supervision.actions.ts` — oversight dashboard data
- `admin.actions.ts` — system administration
- `config.actions.ts` — system configuration
- `sucursales.actions.ts` — branch management
- `variantes.actions.ts` — variant configuration

### Dashboard & Analytics
- `dashboard.actions.ts` — dashboard KPIs, widget data, layout persistence
- `analytics.actions.ts` — analytical reports & metrics
- `reportes.actions.ts` — report generation
- `weather.actions.ts` — weather data for logistics

### Integrations
- `afip.actions.ts` — electronic invoicing
- `ecommerce-clients.actions.ts` — API client management
- `integraciones.actions.ts` — external service configuration
- `google-calendar.actions.ts` — calendar integration
- `notifications.actions.ts` — notification management

### Pattern for ALL Actions
```typescript
"use server";
import { protectAction } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ /* validation */ });

export async function actionName(input: z.infer<typeof schema>) {
  const session = await protectAction([Rol.ADMIN, Rol.VENDEDOR]);
  const validated = schema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    // Business logic here
  });

  revalidatePath("/dashboard/module");
  return { success: true, data: result };
}
```

---

## 9. API ENDPOINTS

### REST API Routes (`/api/...`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google/callback` | Public | Google OAuth callback |
| GET | `/api/session` | Session | Get current user session |
| POST | `/api/demo-request` | Public | Submit demo request |
| POST | `/api/upload` | Session | Upload file to Cloudinary |
| POST | `/api/reports/export` | Session | Export reports to file |
| POST | `/api/proxy` | Session | Proxy external requests |

### E-Commerce API (`/api/ecommerce/...`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ecommerce/auth/token` | API Key | Get Bearer token (1h) |
| GET | `/api/ecommerce/products` | Bearer | List products (paginated) |
| GET | `/api/ecommerce/products/[id]` | Bearer | Get product detail |
| GET | `/api/ecommerce/metrics` | Bearer | Inventory metrics |
| GET | `/api/ecommerce/clients` | Session | List API clients |
| POST | `/api/ecommerce/clients` | Session+Admin | Create API client |
| GET | `/api/ecommerce/clients/[id]` | Session | Get client details |
| PUT | `/api/ecommerce/clients/[id]` | Session+Admin | Update client |
| DELETE | `/api/ecommerce/clients/[id]` | Session+Admin | Delete client |
| POST | `/api/ecommerce/clients/[id]/rotate-secret` | Session+Admin | Rotate API secret |

---

## 10. COMPONENTS LIBRARY

### Base UI Components (shadcn/ui + custom)
These are the foundational building blocks. Rebuild these first:

**Inputs & Forms:**
- `Button` — variants: default, destructive, outline, secondary, ghost, link; sizes: sm, default, lg, icon; loading state
- `Input` — text input with focus ring
- `Textarea` — multiline input
- `Checkbox` — with checked/unchecked states
- `Switch` — toggle switch
- `Select` — dropdown with search (Radix)
- `Combobox` — searchable select
- `RadioGroup` — radio button group
- `Label` — form label
- `Calendar` — date picker (react-day-picker)
- `Form` — React Hook Form wrapper components (FormField, FormItem, FormLabel, FormControl, FormMessage)
- `FormInput` — custom input with validation
- `SubmitButton` — button with loading/pending state

**Layout:**
- `Card` — container with header, content, footer sections
- `Separator` — horizontal/vertical divider
- `ScrollArea` — custom scrollable container
- `Tabs` — tabbed interface
- `Collapsible` — expandable section
- `ResizablePanels` — draggable panel resizer

**Feedback:**
- `Badge` — status indicator (variants: default, outline, destructive, secondary)
- `Alert` — alert box with icon
- `Progress` — progress bar
- `Skeleton` — loading placeholder (pulse animation)
- `Loader` — spinning loader
- `EmptyState` — empty content placeholder with icon and message
- `ErrorBoundary` — error fallback UI
- `RetryError` — error with retry button
- `Sonner` — toast notification system

**Overlays:**
- `Dialog` — modal dialog (Radix)
- `DetailModal` — extended modal with tabs, header, footer
- `Sheet` — slide-in side panel
- `Popover` — floating content
- `Tooltip` — hover tooltip
- `DropdownMenu` — context menu
- `ConfirmDialog` — confirmation dialog with accept/cancel
- `ActionSheet` — mobile bottom sheet

**Data Display:**
- `DataTable` (676 lines) — the MAIN data table component with:
  - Column sorting (click headers)
  - Column filtering (per-column + global search)
  - Pagination (page size selector, page navigation)
  - Column visibility toggle
  - Column resizing (drag borders)
  - Column pinning (freeze columns)
  - Row selection (checkboxes)
  - Density modes: compact, normal, comfortable
  - Theme modes: default, minimal, bordered, striped
  - Export: CSV, clipboard
  - Print support
  - Fullscreen toggle
- `ResponsiveTable` — mobile-friendly table
- `Table` — basic HTML table primitives

**Specialized:**
- `StatusStepper` — workflow step visualization (order lifecycle)
- `KpiCard` — KPI metric display with trend indicator
- `InfoSection` — labeled information section
- `Avatar` — user avatar with initials fallback
- `Carousel` — image carousel (Embla)
- `Chart` / `LazyChart` — chart wrapper with lazy loading
- `MapPreview` — Google Maps preview
- `SignaturePad` — signature capture canvas
- `IconButton` — icon-only button
- `ExportMenu` — dropdown with export options (CSV, Excel, PDF, clipboard)
- `Command` — command palette (cmdk)

### Auth Components
- `PasswordInput` — password field with show/hide toggle
- `PasswordStrengthIndicator` — real-time strength validator (5 criteria)
- `CuitInput` — Argentine tax ID input with auto-formatting and validation
- `InputWithIcon` — input field with leading icon

### Layout Components
- `AppShell` — main app layout (sidebar + header + content area)
- `Sidebar` — left navigation with role-based filtering, search, collapsible sections
- `Header` — top bar with breadcrumbs, notifications, user menu, branch/currency selectors
- `CommandCenter` (90KB) — global command palette (Ctrl+K) with navigation, actions, downloads
- `CurrencySelector` — ARS/USD currency toggle
- `SucursalSelector` — branch/location selector
- `BillToggle` — invoice display mode toggle
- `AIAssistantButton` — AI assistant trigger
- `DashboardErrorBoundary` — error boundary wrapper

### Dashboard Components
- `DashboardHeader` — greeting, date, customize toggle
- `KpiWidget` — KPI card with trend
- `SalesChartWidget` — 7-day sales area chart
- `RecentActivityWidget` — activity feed
- `QuickActionsWidget` — role-filtered quick action buttons
- `WeatherWidget` — weather display
- `WidgetGrid` — drag/drop/resize dashboard grid (react-grid-layout)
- `WidgetSelector` — add widget dialog
- `WidgetSkeleton` — loading placeholder

### POS Components
- `CartPanel` — shopping cart with quantity controls and totals
- `POSHeader` — session info and daily summary
- `ProductSearchInput` — barcode/text search
- `ActiveBulkProductsGrid` — quick-select product grid
- `SearchResultsGrid` — search results display
- `ContextualInfoPanel` — contextual information
- `ObjectivesTasksPanel` — objectives display
- `CashWithdrawalPanel` — withdrawal management
- **POS Modals:** BagSelector, CashWithdrawal, Checkout (multi-payment), CustomerSearch, EmployeeWithdrawalValidation, HotkeySettings, OpenBag, SaleComplete (receipt), VariantSelector, Weighing
- `POSHotkeyProvider` — keyboard shortcut context

### Order Components
- `PedidoDetailsModal` (362 lines) — comprehensive order viewer with 6 tabs: Resumen, Items, Logistica, Pagos, Historial, Comprobantes
- `PedidoHeader` — order info header
- `OrderStatusStepper` — visual workflow timeline
- `KPISection` — order metrics
- `NewPedidoModal` — create order
- `EditPedidoModal` — edit order
- `PedidosFilters` — filter controls
- `PedidosChart` — orders chart

### Invoicing Components
- `InvoicingForm` (95KB) — complex invoice form: client selection, product search, variant selection, discounts, taxes, image upload, promotions
- `AfipInvoicePrintButton` — AFIP-compliant invoice printing
- `ClientCreditSummaryCard` — credit limit display
- `EncargoForm` — special order form

### Finance Components
- `FinanzasKpiCard` — financial KPI card
- `FinanzasCard` — financial section card
- `FinanzasPageHeader` — section header with date range and export

### Admin Components
- Configuration tabs: Account, Billing, Fiscal, Notifications, Integrations
- Integration cards: ApiKeyInput, ApiKeysCard, EcommerceClientsCard, GoogleCalendarCard
- Branch management: SucursalModal, SucursalesTable
- Variant management: VariantsManager, ColorList, TalleList, CurvaTallesModal

### Logistics Components
- Delivery: DateFilters, RepartoCard, RepartoDetailModal, RoutePlanner
- Departures: DailyAgendaView, MapView, ViewSwitcher, VisitaModal
- Transfers: TransferenciaModal, TransferenciaDetailModal, StockAnalysis
- Vehicles: VehiculoModal, DimensionVisualizerModal, VehicleDetailTabs
- Zones: ZonaFormModal, ManageVisitasModal, ManageZoneModal

### Onboarding Components
- `EnhancedOnboardingTour` — step-by-step interactive product tour
- `OnboardingChecklist` — setup progress checklist
- `TourButton` — tour launch button

---

## 11. STATE MANAGEMENT

### Zustand Stores (5)

**`user-store.ts`** — User session state
```typescript
{
  user: { id, name, email, role, sucursalId, sucursales[] } | null,
  isAuthenticated: boolean,
  isHydrated: boolean,
  setUser(user), clearUser(), hydrate()
}
```

**`pos-store.ts`** — POS terminal state
```typescript
{
  items: CartItem[],
  customer: Customer | null,
  activeBag: Bag | null,
  addItem(product, variant, qty),
  removeItem(id),
  updateQuantity(id, qty),
  setCustomer(customer),
  clearCart(),
  getSubtotal(), getTotal(), getTax()
}
```

**`currency-store.ts`** — Currency selection
```typescript
{
  currency: 'ARS' | 'USD',
  exchangeRate: number,
  setCurrency(currency),
  setExchangeRate(rate)
}
```

**`ui-store.ts`** — UI state
```typescript
{
  sidebarOpen: boolean,
  isMobile: boolean,
  toggleSidebar(),
  setSidebarOpen(open),
  setMobile(mobile)
}
```

**`bill-store.ts`** — Invoice display preferences
```typescript
{
  billType: 'A' | 'B' | 'N',
  setBillType(type)
}
```

### React Query Configuration
```typescript
{
  queries: {
    staleTime: 60_000,       // 1 minute
    gcTime: 300_000,         // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  },
  mutations: { retry: 0 }
}
```

### Custom Hooks (15+)
- `useAsyncAction` — wrapper for server actions with loading/error states
- `useEscapeKey` — close modals on Escape
- `useFocusTrap` — trap focus inside modals
- `useImportProgress` — track bulk import progress
- `useMediaQuery` — responsive breakpoint detection
- `useMobile` — mobile device detection
- `useOnboarding` — tour state management
- `useSessionSync` — multi-tab session synchronization
- `useSessionTimeout` — inactivity timeout
- `useSignaturePreview` — signature canvas preview
- `useUSBScale` — USB scale integration for weighing
- `useDebounce` — debounced values
- `useModalLifecycle` — modal open/close lifecycle
- `useTableExport` — table data export
- `hooks/queries/use-pedidos-compra.ts` — React Query hooks for purchase orders (pattern for all query hooks)

---

## 12. DESIGN SYSTEM & TOKENS

### CSS Variables (Light Mode)
```css
:root {
  --radius: 0.625rem;

  /* Core */
  --background: #FFFFFF;
  --foreground: #0A2E52;

  /* Cards & Popovers */
  --card: #FFFFFF;
  --card-foreground: #0A2E52;
  --popover: #FFFFFF;
  --popover-foreground: #0A2E52;

  /* Brand */
  --primary: #0A2E52;
  --primary-foreground: #FFFFFF;
  --secondary: #1B5F7C;
  --secondary-foreground: #FFFFFF;
  --accent: #00C4B3;
  --accent-foreground: #FFFFFF;

  /* Muted */
  --muted: #F7FAFC;
  --muted-foreground: #1B5F7C;

  /* State */
  --destructive: #FF5A5F;

  /* Borders & Input */
  --border: #D1E5EB;
  --input: #D1E5EB;
  --ring: #00C4B3;

  /* Sidebar */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #0A2E52;
  --sidebar-primary: #0A2E52;
  --sidebar-accent: #00C4B3;
  --sidebar-border: #D1E5EB;

  /* Charts (HSL) */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
}
```

### Extended Tailwind Colors
```typescript
// tailwind.config.ts
{
  brand: {
    primary: "#0A2E52",
    secondary: "#1B5F7C",
    accent: "#00C4B3",
    "accent-hover": "#00B0A2",
  },
  state: {
    success: "#2ECC71",
    warning: "#F59E0B",
    error: "#FF5A5F",
    info: "#3B82F6",
  },
  "surface-ui": {
    base: "#FFFFFF",
    muted: "#F7FAFC",
    border: "#D1E5EB",
  },
}
```

### Typography
- **Primary:** Geist (sans-serif) — body, UI, headings
- **Monospace:** Geist Mono — code, technical content
- **Print:** "Courier New" — thermal receipts

### Spacing & Radius
```
Radius base: 0.625rem (10px)
Radius sm: 6px
Radius md: 8px
Radius lg: 10px
Radius xl: 14px
```

### Custom Shadow
```
shadow-custom: 0 4px 14px 0 rgba(10, 46, 82, 0.2)
```

### Z-Index Scale
```
z-60, z-70, z-80, z-90, z-100
```

---

## 13. BUSINESS LOGIC & CALCULATIONS

### Order State Machine
```
PENDIENTE_APROBACION → EN_EVALUACION → APROBADO → EN_PREPARACION
  → LISTO_PARA_ENVIO → ENVIADO → ENTREGADO
                    ↘ RECHAZADO
                    ↘ CANCELADO (from any state)
                    ↘ ENTREGADO_PARCIALMENTE
                    ↘ RECLAMADO
                    ↘ NO_ENTREGADO

Purchase orders additionally:
  → APROBADO_REPARTIDOR → ABASTECIDO
  → PENDIENTE_ABASTECIMIENTO → EN_CONSOLIDACION
```

### Commission Calculation
```
Types: PORCENTAJE | FIJO | ESCALONADO
- PORCENTAJE: sale_total * (commission_rate / 100)
- FIJO: fixed_amount_per_sale
- ESCALONADO: tiered rates based on monthly sales volume
  e.g., 0-100K → 3%, 100K-500K → 5%, 500K+ → 7%
```

### Promotion Engine
```
Types:
- PORCENTAJE: X% off product/category
- CANTIDAD: Buy X get discount
- COMBO: Buy products A+B for special price
- REGALO: Buy X get Y free
- PRECIO_FIJO: Fixed price override

Conditions: date range, min quantity, specific products/categories
Stacking: promotions can stack (configurable)
```

### Financial Calculations
- **Gross Margin:** (revenue - cost) / revenue * 100
- **Accounts Receivable Aging:** 0-30, 31-60, 61-90, 90+ days
- **Cash Reconciliation:** system_amount vs physical_amount → difference
- **Tax (IVA):** configurable per branch, applied per product category

### CUIT Validation (Argentine Tax ID)
- Format: XX-XXXXXXXX-X (11 digits)
- Check digit algorithm implemented
- Auto-formatting on input

### Currency Formatting
- Primary: ARS (Argentine Peso) — `$1.234,56`
- Secondary: USD — `US$1,234.56`
- Exchange rate stored in currency store

---

## 14. INTEGRATIONS

### AFIP (Argentine Tax Authority)
- **SDK:** @afipsdk/afip.js + facturajs
- **Functions:** Electronic invoice generation, CAE (authorization code) retrieval
- **Invoice Types:** A (B2B), B (B2C), N (internal), X (non-fiscal)
- **Required Credentials:** CUIT, Certificate (.crt), Private Key (.key), Punto de Venta number
- **NOTE FOR REBUILD:** This can be replaced with any country's tax invoicing system. The pattern is: generate invoice data → call tax API → receive authorization code → store on comprobante

### Google Services
- **OAuth:** Google sign-in as authentication provider
- **Google Maps:** Geolocation, route visualization, salesperson tracking
- **Google Calendar:** Scheduling integration

### Cloudinary
- **Purpose:** Image upload, optimization, CDN delivery
- **Usage:** Product images, brand assets, user avatars
- **Config:** Cloud name, API key, API secret per user settings

### E-Commerce REST API
- See Section 9 for full endpoint documentation
- Bearer token auth with 1-hour expiration
- API key format: `ec_` prefix

---

## 15. ROLE-BASED ACCESS CONTROL

### Permission Matrix

| Feature | ADMIN | VENDEDOR | ENCARGADO | FINANZAS | LOGISTICA | REPARTIDOR | VENDEDOR_CALLE | ENC_DEPOSITO | ENC_CALLE |
|---------|-------|----------|-----------|----------|-----------|------------|----------------|--------------|-----------|
| Dashboard (full) | x | | x | | | | | | |
| Sales | x | x | x | | | | | | |
| POS | x | x | x | | | | | | |
| Customers | x | x | x | | | | x | | |
| Orders | x | x | x | | | x | x | | |
| Order Approval | x | | x | | | | | | |
| Inventory | x | | x | | | | | x | |
| Products | x | | x | | | | | x | |
| Finance | x | | | x | | | | | |
| Cash Boxes | x | | x | x | | | | | |
| Suppliers | x | | x | x | | | | | |
| Purchases | x | | x | x | | | | | |
| Logistics | x | | x | | x | x | | | x |
| Deliveries | x | | | | x | x | | | |
| My Route | | | | | | x | | | |
| Fleet | x | | | | x | | | | |
| HR | x | | x | | | | | | |
| Employees | x | | x | | | | | | |
| Admin | x | | | | | | | | |
| Branches | x | | | | | | | | |
| Settings | x | | | | | | | | |
| Integrations | x | | | | | | | | |
| Field Sales | | | | | | | x | | |
| Warehouse | x | | | | | | | x | |
| Street Visits | | | | | | | | | x |
| Reports | x | | x | x | x | | | | |
| Analytics | x | | x | x | | | | | |

### Special Role Behaviors
- **VENDEDOR_CALLE:** Redirected to field sales dashboard, mobile-optimized
- **REPARTIDOR:** Redirected to "My Route" page, delivery-focused
- **ENCARGADO_DEPOSITO:** Redirected to warehouse orders page
- **ENCARGADO_DE_CALLE:** Redirected to street visits page

---

## 16. FILE STRUCTURE REFERENCE

```
corelogix-erp/                          # Monorepo root
├── apps/
│   ├── api/                            # ═══ GO BACKEND ═══
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go            # Entry point, server bootstrap
│   │   ├── internal/
│   │   │   ├── config/                # Env config (Viper/envconfig)
│   │   │   ├── server/
│   │   │   │   ├── server.go          # HTTP server setup
│   │   │   │   ├── router.go          # Route registration
│   │   │   │   └── middleware.go      # Global middleware chain
│   │   │   ├── handler/              # HTTP handlers by domain
│   │   │   │   ├── auth.go
│   │   │   │   ├── users.go
│   │   │   │   ├── sales.go
│   │   │   │   ├── orders.go
│   │   │   │   ├── customers.go
│   │   │   │   ├── products.go
│   │   │   │   ├── inventory.go
│   │   │   │   ├── purchases.go
│   │   │   │   ├── suppliers.go
│   │   │   │   ├── finance.go
│   │   │   │   ├── cashbox.go
│   │   │   │   ├── checks.go
│   │   │   │   ├── logistics.go
│   │   │   │   ├── hr.go
│   │   │   │   ├── reports.go
│   │   │   │   ├── settings.go
│   │   │   │   ├── uploads.go
│   │   │   │   └── webhooks.go
│   │   │   ├── service/              # Business logic layer
│   │   │   │   ├── auth_service.go
│   │   │   │   ├── sales_service.go
│   │   │   │   ├── inventory_service.go
│   │   │   │   ├── finance_service.go
│   │   │   │   ├── promotion_engine.go
│   │   │   │   ├── commission_service.go
│   │   │   │   ├── invoice_service.go  # AFIP/tax authority integration
│   │   │   │   ├── order_state_machine.go
│   │   │   │   └── ...
│   │   │   ├── repository/           # Database layer (sqlc-generated + custom)
│   │   │   │   ├── db.go             # sqlc generated
│   │   │   │   ├── models.go         # sqlc generated
│   │   │   │   ├── queries.sql.go    # sqlc generated
│   │   │   │   └── custom_queries.go # Complex queries not suited for sqlc
│   │   │   ├── middleware/
│   │   │   │   ├── auth.go           # JWT validation
│   │   │   │   ├── cors.go
│   │   │   │   ├── ratelimit.go
│   │   │   │   ├── logger.go
│   │   │   │   └── rbac.go           # Role-based access control
│   │   │   ├── ws/                   # WebSocket layer
│   │   │   │   ├── hub.go            # Connection hub
│   │   │   │   ├── client.go         # Client connection handler
│   │   │   │   ├── rooms.go          # Room management (per-branch, per-user)
│   │   │   │   └── events.go         # Event type definitions
│   │   │   ├── worker/               # Asynq background jobs
│   │   │   │   ├── processor.go      # Job processor setup
│   │   │   │   ├── invoice_worker.go
│   │   │   │   ├── email_worker.go
│   │   │   │   ├── report_worker.go
│   │   │   │   └── scheduler.go      # Cron-like scheduled tasks
│   │   │   └── pkg/                  # Internal shared utilities
│   │   │       ├── jwt/
│   │   │       ├── response/         # Standardized API responses
│   │   │       ├── pagination/
│   │   │       ├── validator/
│   │   │       └── money/            # Precise decimal money operations
│   │   ├── migrations/               # SQL migration files (up/down)
│   │   │   ├── 000001_init_schema.up.sql
│   │   │   ├── 000001_init_schema.down.sql
│   │   │   └── ...
│   │   ├── queries/                  # sqlc query files (*.sql)
│   │   │   ├── users.sql
│   │   │   ├── sales.sql
│   │   │   ├── products.sql
│   │   │   ├── inventory.sql
│   │   │   └── ...
│   │   ├── docs/                     # Swagger/OpenAPI generated
│   │   ├── scripts/
│   │   │   └── seed.go               # Database seeding
│   │   ├── sqlc.yaml
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── Dockerfile
│   │   ├── Makefile
│   │   └── .air.toml                 # Hot reload config
│   │
│   ├── web/                            # ═══ NEXT.JS WEB DASHBOARD ═══
│   │   ├── public/
│   │   │   ├── assets/
│   │   │   │   ├── logos/logo.png
│   │   │   │   ├── banners/auth-banner.png
│   │   │   │   └── icons/            # SVG icons
│   │   │   └── ticket.css            # Thermal printer styles
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css       # Theme CSS variables
│   │   │   │   ├── layout.tsx        # Root layout (fonts, providers)
│   │   │   │   ├── page.tsx          # Home (auth-aware redirect)
│   │   │   │   ├── (auth)/           # Public auth routes
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── demo/
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   ├── reset-password/
│   │   │   │   │   ├── verify-email/
│   │   │   │   │   ├── terms/
│   │   │   │   │   └── privacy/
│   │   │   │   ├── (erp)/            # Protected ERP routes
│   │   │   │   │   ├── layout.tsx    # Auth check + AppShell
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── error.tsx
│   │   │   │   │   └── dashboard/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── ventas/        # 14 pages
│   │   │   │   │       ├── inventario/    # 9 pages
│   │   │   │   │       ├── finanzas/      # 15 pages
│   │   │   │   │       ├── logistica/     # 8 pages
│   │   │   │   │       ├── proveedores/   # 4 pages
│   │   │   │   │       ├── deposito/
│   │   │   │   │       ├── rrhh/          # 3 pages
│   │   │   │   │       ├── administracion/ # 6 pages
│   │   │   │   │       ├── perfil/
│   │   │   │   │       ├── analisis/
│   │   │   │   │       ├── reportes/
│   │   │   │   │       ├── tareas/
│   │   │   │   │       ├── objetivos/
│   │   │   │   │       ├── supervision/
│   │   │   │   │       ├── recordatorios/
│   │   │   │   │       ├── facturacion/
│   │   │   │   │       └── ayuda/
│   │   │   │   └── (onboarding)/
│   │   │   │       └── onboarding/
│   │   │   ├── components/            # React components
│   │   │   │   ├── ui/               # Base shadcn components
│   │   │   │   ├── auth/
│   │   │   │   ├── layout/           # App shell, sidebar, header
│   │   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   │   ├── pos/              # POS system
│   │   │   │   ├── pedidos/
│   │   │   │   ├── pedidos-compra/
│   │   │   │   ├── invoicing/
│   │   │   │   ├── purchase-invoice/
│   │   │   │   ├── finanzas/
│   │   │   │   ├── onboarding/
│   │   │   │   └── system/
│   │   │   ├── hooks/
│   │   │   │   ├── queries/          # React Query hooks (call Go API)
│   │   │   │   ├── use-socket.ts     # WebSocket connection hook
│   │   │   │   ├── use-session-timeout.ts
│   │   │   │   └── ...
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts     # Typed HTTP client for Go API
│   │   │   │   ├── ws-client.ts      # WebSocket client
│   │   │   │   ├── auth.ts           # Client-side JWT handling
│   │   │   │   ├── permissions.ts    # RBAC utilities
│   │   │   │   └── ...
│   │   │   ├── store/                # Zustand stores
│   │   │   │   ├── user-store.ts
│   │   │   │   ├── pos-store.ts
│   │   │   │   ├── currency-store.ts
│   │   │   │   ├── ui-store.ts
│   │   │   │   └── bill-store.ts
│   │   │   └── providers/
│   │   │       ├── query-provider.ts
│   │   │       └── socket-provider.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── components.json           # shadcn/ui config
│   │   └── .env.example
│   │
│   └── mobile/                         # ═══ REACT NATIVE (EXPO) ═══
│       ├── app/                       # Expo Router file-based routes
│       │   ├── (auth)/               # Login, register
│       │   ├── (tabs)/               # Main tab navigation
│       │   │   ├── dashboard.tsx
│       │   │   ├── orders.tsx
│       │   │   ├── inventory.tsx
│       │   │   ├── deliveries.tsx
│       │   │   └── profile.tsx
│       │   ├── sales/
│       │   ├── scanner/              # Barcode/QR scanner
│       │   ├── pos/                  # Mobile POS
│       │   └── delivery/             # Driver delivery flow
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       │   ├── api-client.ts         # Same typed client as web
│       │   ├── ws-client.ts
│       │   └── secure-store.ts       # Token storage
│       ├── store/                    # Zustand stores
│       ├── app.json
│       ├── package.json
│       ├── tsconfig.json
│       └── eas.json                  # EAS Build config
│
├── packages/
│   ├── shared/                        # Shared TypeScript code (web + mobile)
│   │   ├── src/
│   │   │   ├── types/                # Auto-generated from OpenAPI
│   │   │   ├── schemas/              # Zod validation schemas
│   │   │   ├── constants/            # Enums, tax rates, roles
│   │   │   └── utils/                # Formatters, calculators
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                            # Shared UI components
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/                        # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── docker-compose.yml                 # Local dev: Postgres + Redis + Go API
├── turbo.json
├── package.json                       # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

---

## 17. BUILD & DEPLOYMENT NOTES

### Environment Variables Required

#### Go API (`apps/api/.env`)
```bash
# Server
PORT=8080
ENV=development                    # development | staging | production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nexora?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=random-secret
JWT_REFRESH_SECRET=random-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# E-Commerce API
ECOMMERCE_JWT_SECRET=random-secret

# AFIP (Argentine Tax - swap for your country's tax API)
AFIP_CUIT=...
AFIP_CERT=...                      # Base64 encoded certificate
AFIP_KEY=...                       # Base64 encoded private key

# Email
RESEND_API_KEY=...

# Sentry
SENTRY_DSN=...
```

#### Next.js Web (`apps/web/.env`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080  # Go API URL
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws  # WebSocket URL
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
SENTRY_DSN=...
```

#### Mobile (`apps/mobile/.env`)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Build Commands
```bash
# ═══ Local Development (all services) ═══
docker-compose up -d               # Start Postgres + Redis
cd apps/api && air                  # Go API with hot reload (port 8080)
pnpm --filter web dev              # Next.js dev with Turbopack (port 3000)
pnpm --filter mobile start         # Expo dev server

# ═══ Go API ═══
cd apps/api
make migrate-up                    # Run database migrations
make sqlc                          # Generate type-safe query code
make seed                          # Seed database with sample data
make build                         # Build binary → ./bin/server
make test                          # Run all tests
make lint                          # golangci-lint
make swagger                       # Generate OpenAPI docs
make docker-build                  # Build Docker image

# ═══ Next.js Web ═══
pnpm --filter web build            # Production build
pnpm --filter web test             # Vitest
pnpm --filter web lint             # ESLint

# ═══ Mobile ═══
pnpm --filter mobile build:ios     # EAS Build for iOS
pnpm --filter mobile build:android # EAS Build for Android

# ═══ Shared Packages ═══
pnpm --filter shared generate-types  # Generate TS types from Go API's OpenAPI spec

# ═══ Monorepo-wide ═══
pnpm turbo build                   # Build all JS/TS apps
pnpm turbo lint                    # Lint all JS/TS apps
pnpm turbo test                    # Test all JS/TS apps
```

### Deployment

| App | Platform | Notes |
|-----|----------|-------|
| Go API | **Railway** or **Fly.io** | Single binary, Dockerfile deploy, persistent for WebSockets |
| Next.js Web | **Vercel** | Automatic deploys from git, edge functions |
| Mobile | **EAS Submit** | TestFlight (iOS) + Play Console (Android) |
| Database | **Supabase** or **Neon** | Managed PostgreSQL with connection pooling |
| Redis | **Upstash** or **Railway** | Asynq queues + caching + WebSocket pub/sub |
| Image CDN | **Cloudinary** | Image optimization & delivery |

### Performance Notes
- Go API compiles to a single ~20MB binary, starts in <100ms, uses minimal RAM
- WebSocket connections scale horizontally via Redis pub/sub adapter
- Asynq workers can run as separate processes or in the same binary
- Next.js uses Turbopack for development, RSC for optimal client bundle size
- React Query stale time: 1 min; GC time: 5 min
- PostgreSQL full-text search for search features
- Body size limit: 50MB on Go API (for Excel imports)
- Mobile: OTA updates via EAS Update for JS bundle changes (no App Store review needed)

---

## REBUILD CHECKLIST

### Phase 1: Monorepo & Infrastructure Setup
- [ ] Initialize Turborepo monorepo with pnpm workspaces
- [ ] Set up `apps/api` Go module (Chi/Echo, project structure, Makefile)
- [ ] Set up `apps/web` Next.js 15+ with App Router
- [ ] Set up `apps/mobile` Expo project with Expo Router
- [ ] Set up `packages/shared` (types, schemas, constants)
- [ ] Set up `packages/config` (ESLint, TS, Tailwind shared configs)
- [ ] Docker Compose for local dev (Postgres + Redis)
- [ ] GitHub Actions CI pipeline (lint, test, build for all apps)

### Phase 2: Backend API Foundation (Go)
- [ ] Database schema via SQL migrations (golang-migrate)
- [ ] sqlc setup and query generation
- [ ] Auth system: JWT access/refresh, registration, login, password reset, email verification
- [ ] RBAC middleware (role + permission checks)
- [ ] WebSocket hub with rooms (per-branch, per-user)
- [ ] Asynq background job processor setup
- [ ] Swagger/OpenAPI doc generation
- [ ] API error handling & response standardization
- [ ] Rate limiting & CORS middleware
- [ ] Generate TypeScript types from OpenAPI → `packages/shared`

### Phase 3: Web Frontend Foundation (Next.js)
- [ ] Build base UI component library (shadcn/ui)
- [ ] Create app shell (sidebar, header, command palette)
- [ ] Typed API client (from OpenAPI-generated types)
- [ ] WebSocket client & provider (socket connection, event handlers)
- [ ] Auth flow (login, register, token storage, refresh, protected routes)
- [ ] React Query hooks wired to Go API
- [ ] RBAC on frontend (route guards, UI permission checks)

### Phase 4: Core Modules (API + Web)
- [ ] Dashboard with customizable widgets + real-time KPIs
- [ ] Product & inventory management (+ stock alerts via WebSocket)
- [ ] Customer management (CRUD, credit, loyalty)
- [ ] Sales order lifecycle (+ live order board via WebSocket)
- [ ] Supplier & purchase management

### Phase 5: Operations (API + Web)
- [ ] POS system (+ cross-device sync via WebSocket)
- [ ] Invoicing system (AFIP integration, background PDF generation)
- [ ] Finance module (cash boxes, payments, expenses, checks)
- [ ] Logistics (deliveries, routes, fleet, GPS tracking via WebSocket)

### Phase 6: Advanced Features (API + Web)
- [ ] Commission system
- [ ] Promotion engine
- [ ] Check management & bank reconciliation
- [ ] Reports & analytics (background generation via Asynq)
- [ ] E-commerce webhook API
- [ ] Email notifications (via Asynq + Resend)

### Phase 7: Mobile App (React Native / Expo)
- [ ] Auth flow (login, biometrics, secure token storage)
- [ ] Delivery driver app (GPS tracking, route view, proof of delivery)
- [ ] Field sales app (create orders, scan products, check credit)
- [ ] Warehouse scanner (barcode scanning, stock counts)
- [ ] Manager dashboard (KPIs, approvals, notifications)
- [ ] Push notifications (FCM/APNs via Expo)
- [ ] Offline support for critical flows
- [ ] Mobile POS mode (tablet)

### Phase 8: Polish & Launch
- [ ] Onboarding tour (web + mobile)
- [ ] Help documentation
- [ ] Dark mode (web + mobile)
- [ ] Performance optimization (API query tuning, frontend bundle)
- [ ] Testing: Go unit/integration tests, Vitest (web), Playwright E2E, Maestro (mobile)
- [ ] Security audit (OWASP top 10, JWT hardening, input sanitization)
- [ ] Production deployment pipeline (Vercel + Railway/Fly.io + EAS)

---

> **This document contains everything needed to rebuild this ERP system from scratch.** Every feature, every page, every data model, every component, every color, and every business rule is documented above. The new architecture separates concerns into a **Go API backend** (REST + WebSockets + background jobs), a **Next.js web dashboard**, and a **React Native mobile app**, all sharing types and validation schemas. Use this as the single source of truth for the rebuild.

---

*Generated on 2026-02-27 by analyzing 481 TypeScript files, 2,430 lines of Prisma schema, 82 pages, 191 components, 76 server actions, and 100+ dependencies. Updated to reflect Go backend + monorepo + mobile app architecture.*
