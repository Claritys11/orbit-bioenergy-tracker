# ORBIT

**Organic Recycling & Bioenergy Impact Tracker**

> **ORBIT is a digital coordination and traceability system that connects schools with community waste-to-energy operators, turning verified organic waste contributions into measurable and traceable energy returns.**

ORBIT is a production-minded competition prototype built for **JA WE Challenge 2026** (*Theme: "Reimagine Energy: Powering Our Future from Waste"*). It bridges the physical-to-digital gap using **persistent reusable QR containers**, connecting physical organic waste flows with quality verification, biodigester conversion, verified biogas accounting, purity-to-power allocation, fulfilment, and public impact reporting.

---

## ⚡ Core Architecture & Canonical Chain of Custody

```text
CANONICAL OPERATIONAL CHAIN:

School / Canteen Waste Source (CANTEEN_STAFF)
      │  Select assigned reusable container; mark READY (no official weight entered)
      ▼
School Admin (SCHOOL_ADMIN)
      │  Select accumulated ready containers; request pickup
      ▼
Logistics Operator (OPERATOR)
      │  Accept/Schedule pickup; route fleet; transport in-transit; deliver to facility
      ▼
Community Facility (COMMUNITY_PARTNER)
      │  Receive container (/scan)
      │  Weigh calibrated gross mass (verifiedGrossMassKg)
      │  Contamination inspection & sorting (rejectedMassKg)
      │  Automatic calculation of accepted organics & contamination rate
      │  Conversion Cycle in anaerobic biodigester
      │  Record measured physical gas output (measuredGasM3 → verifiedGasM3)
      ▼
ORBIT Traceability & Allocation Engine
      │  Automatic Purity-to-Power allocation (Schools, Community Facility, Contributors)
      ▼
Community Energy Fulfilment & Public Transparency Layer
```

### Key Principles

1. **Role Responsibility Model**:
   - `CANTEEN_STAFF`: Mark assigned reusable container ready. No weighing, no QR scanner, no pickup scheduling.
   - `SCHOOL_ADMIN`: Coordinate ready school containers and submit multi-item pickup requests.
   - `OPERATOR`: Collection and transport logistics ONLY. No contamination inspections, no conversion cycles, no gas verification.
   - `COMMUNITY_PARTNER`: Community Facility processing workspace. Receives containers, performs calibrated weighing and contamination inspection, records conversion cycles with measured physical gas, and fulfils biogas.
   - `SUPER_ADMIN`: Platform-wide administration and QR container issuance.
   - `STUDENT`: Read-only educational learning and public-safe traceability.
2. **Persistent Reusable QR Containers**: Reusable containers belong to the organisation (`CNT-SMK-001-01`). The physical QR tag identifies the container across endless cycles. Batches do not generate new physical QR codes.
3. **Verified Mass Belongs to Community**: Source registration does not demand a guessed kilogram value. Official mass is measured on calibrated scales upon facility arrival.
4. **Separation of Estimated Gas and Verified Gas**: Model estimations are clearly distinguished from physical flow-meter measurements (`measuredGasM3` $\to$ `verifiedGasM3`).
5. **Automatic Energy Allocation**: Upon verifying physical gas output, ORBIT automatically executes the allocation engine without tedious manual percentage calculations.

---

## 💡 Operational Incentive Model

| Stakeholder | Role in Supply Chain | Incentives & Returns |
| :--- | :--- | :--- |
| **School / Canteen** | Source separation & container readiness | Verified energy credits, LPG savings, and public sustainability recognition |
| **TPS3R Logistics Operator** | Collection scheduling, vehicle routes & transport | Efficient logistics routing, container tracking & transport transparency |
| **Community Facility** | Receiving, calibrated weighing, inspection, conversion & gas measurement | Clean biogas processing, bio-fertilizer digestate, local clean cooking gas |
| **Supporting Contributor** | Market/vendor feedstock stabilization | Organic waste disposal & supporting pool energy allocation |
| **ORBIT Platform** | Digital coordination, automated allocation & audit logs | Platform integrity & public impact transparency |

---

## 🛠️ Stack

- **Framework**: Next.js App Router (Turbopack), TypeScript strict mode, Vanilla Tailwind CSS
- **Database & Auth**: PostgreSQL, Prisma ORM, Auth.js (Credentials login with bcrypt hashes)
- **Validation & Business Logic**: Zod validation schemas, Server-side RBAC, isolated domain logic in `src/lib/domain`
- **Analytics & QR**: Recharts analytics, QR generation (`qrcode`), browser scanning (`html5-qrcode`)
- **Testing**: Vitest unit tests, Playwright E2E testing framework
- **Environment**: Docker Compose for local PostgreSQL (Port 55432)

---

## 🚀 Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL container**:
   ```bash
   docker compose up -d
   ```

3. **Configure environment (`.env`)**:
   ```bash
   cp .env.example .env
   ```

4. **Synchronize database & seed demo containers**:
   ```bash
   npm run db:generate
   npx prisma db push
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3115](http://localhost:3115) in your browser.

---

## 🔑 Demo Credentials

All demo accounts use the password: **`OrbitDemo2026!`**

| Role | Email | Scope & Wewenang Utama |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | `super@orbit.test` | QR container issuance (`/admin/containers`), partner organisation & user registration (`/admin/users`), system settings, global audit logs, allocation configuration |
| `SCHOOL_ADMIN` | `school@orbit.test` | Ready waste batches overview, multi-item pickup request creation (`/operations/pickups`), pickup monitoring, energy credit & impact reports |
| `CANTEEN_STAFF` | `canteen@orbit.test` | Simple reusable container load registration (`/batches/new`): select container $\to$ mark ready $\to$ done |
| `STUDENT` | `student@orbit.test` | Educational waste journey trace, sorting accuracy feedback, public school impact reports |
| `OPERATOR` | `operator@orbit.test` | Logistics & transport ONLY: Pickup request review (Accept/Reject), fleet routes, collection in transit, delivery confirmation to facility (`/operations/pickups`) |
| `COMMUNITY_PARTNER` | `community@orbit.test` | Community Facility processing workspace: Receive container (`/scan`), calibrated weighing & contamination inspection (`/operations/inspections`), conversion cycles with measured gas (`/operations/conversions`), energy fulfilment (`/operations/fulfilment`) |

---

## 📐 Role Permissions & Architecture

ORBIT enforces capability-based security. Server components query database models directly through Prisma, while mutations execute through Server Actions guarded by Zod validation schemas and RBAC checks (`src/lib/services/authz.ts` and `src/lib/domain/rbac.ts`).

| Role | Main Permissions | Forbidden Operations |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Full platform administration | None |
| `SCHOOL_ADMIN` | `manage_org`, `view_reports`, `view_audit`, `view_batches`, `request_pickup` | `inspect_batch`, `record_conversion`, `manage_pickup_logistics`, `fulfil_allocation` |
| `CANTEEN_STAFF` | `create_waste_record`, `create_batch`, `view_batches`, `view_reports` | `inspect_batch`, `record_conversion`, `receive_container`, `request_pickup`, `manage_pickup_logistics` |
| `STUDENT` | `view_student`, `view_reports` (Public-safe trace only) | All operational mutations |
| `OPERATOR` | `respond_pickup_request`, `manage_pickup_logistics`, `view_reports`, `view_batches` | `inspect_batch`, `record_conversion`, `calculate_allocation`, `fulfil_allocation`, `receive_container` |
| `COMMUNITY_PARTNER` | `receive_container`, `inspect_batch`, `record_conversion`, `fulfil_allocation`, `manage_safety`, `view_reports`, `view_batches` | `respond_pickup_request`, `manage_pickup_logistics`, `request_pickup` |

---

## ⚖️ Purity-to-Power Engine Formulas

### 1. Inspection & Contamination
$$\text{contaminationRate} = \frac{\text{rejectedMass}}{\text{verifiedGrossMass}} \times 100\%$$
$$\text{acceptedMass} = \text{verifiedGrossMass} - \text{rejectedMass}$$

### 2. Contribution Score & Estimated Gas
$$\text{contributionScore} = \text{acceptedMass} \times \text{yieldFactor} \times \text{qualityFactor} \times \text{conditionFactor}$$
$$\text{estimatedGas} = \text{acceptedMass} \times \text{yieldFactor} \times \text{conditionFactor}$$

### 3. Allocatable Verified Gas
$$\text{allocatableGas} = \text{verifiedGas} - \text{operationalUse} - \text{safetyReserve}$$

Default allocation pool defaults: **50% Schools**, **30% Operator**, **20% Supporting Contributors**.

---

## ⚙️ Perintah Utama (CLI Commands)

```bash
npm run dev          # Dev server pada http://localhost:3115
npm run lint         # ESLint check
npm run typecheck    # TypeScript strict mode check
npm run test         # Vitest unit tests
npm run validate     # Jalankan lint, typecheck, unit tests, dan production build
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed data kontainer & siklus konversi demo
```

---

## 🔒 Prototype Boundaries

ORBIT is monitoring software, not a physical hardware safety controller. It does not operate physical valves, biodigester flare systems, gas compression, Bio-CNG, PLN grid integration, blockchain, or real financial payment gateways. Sensor readings are clearly marked as simulated. Safety-critical shutdowns must be handled by certified local hardware and trained adult operators.
