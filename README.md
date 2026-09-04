# ORBIT

**Organic Recycling & Bioenergy Impact Tracker**

> **ORBIT is a digital coordination and traceability system that connects schools with community waste-to-energy operators, turning verified organic waste contributions into measurable and traceable energy returns.**

ORBIT is a production-minded competition prototype built for **JA WE Challenge 2026** (*Theme: "Reimagine Energy: Powering Our Future from Waste"*). It bridges the physical-to-digital gap using **persistent reusable QR containers**, connecting physical organic waste flows with quality verification, biodigester conversion, verified biogas accounting, purity-to-power allocation, fulfilment, and public impact reporting.

---

## ⚡ Core Architecture & Physical-to-Digital Loop

```text
PHYSICAL WORLD

School / Market Canteen
      │
      ▼ (Reusable Container Tag: CNT-TELKOM-001-01)
Waste Batch Submitted (1-Scan Canteen UX)
      │
      ▼
Operator Pickup & Transit (Logistics & Fleet Collection)
      │
      ▼
Community Partner Facility Inspection & Bin Emptying (Container freed: EMPTIED → AVAILABLE)
      │
      ▼
Community Partner Conversion Cycle & Verified Biogas Production
      │
      ▼
Purity-to-Power Energy Allocation & Fulfilment


DIGITAL WORLD (ORBIT Engine)

  • Identity & QR Resolver (/c/[qrToken])
  • Chain of Custody Mass Tracking (declared → collected → verified → accepted)
  • Superadmin Partner Onboarding & Auto-Sync (/admin/users → /partners)
  • Purity-to-Power Allocation Engine (50% Schools / 30% Operator / 20% Contributors)
  • Auditable Supply Chain Journey Timeline
  • Public Transparency Layer & Energy Return Accounting
```

### Key Principles

1. **Persistent Reusable QR Containers**: QR tags encode permanent digital identities (`CNT-TELKOM-001-01`) attached to physical bins. Schools do NOT print disposable QR codes for every bag.
2. **1 Active Batch per Container**: Enforced at the database and UI levels to prevent impossible physical duplicates. A container can only create a new batch after the current batch is inspected and emptied at the facility.
3. **Immediate Container Return to Service**: Containers return to `AVAILABLE` immediately upon facility receipt and inspection, freeing the bin for canteen reuse without waiting for multi-week anaerobic digestion.
4. **🛡️ No Verified Source Identity = No Source-Specific Energy Allocation**: TPS3R operators may process un-tagged waste, but only verified QR containers allow clean organic contributions to be reliably credited back to participating schools and communities.
5. **Superadmin Partner Onboarding**: Superadmins can register new Schools, Community Partners, Waste Operators, and Supporting Contributors; new partners dynamically update on the public `/partners` showcase.
6. **Estimated Gas vs. Verified Gas**: Contribution previews use estimated yield, but energy allocation and fulfilment strictly consume **Verified Gas** recorded post-conversion.

---

## 💡 Operational Incentive Model

| Stakeholder | Role in Supply Chain | Incentives & Returns |
| :--- | :--- | :--- |
| **School / Canteen** | Source separation & container registration | Verified energy credits, LPG savings, and public sustainability impact |
| **TPS3R Operator** | Logistical collection, fleet routes & container pickup | Reliable route scheduling, container tracking & logistics efficiency |
| **Community Partner** | Quality inspection, biodigester conversion & gas allocation | Clean energy conversion, digestate fertilizer & local community impact |
| **Supporting Contributor** | Market/vendor feedstock stabilization | Organic waste disposal & supporting pool energy allocation |
| **ORBIT Platform** | Digital coordination, accounting & audit logs | Small platform maintenance fee (5% pilot default) |

---

## 🛠️ Stack

- **Framework**: Next.js App Router, TypeScript strict mode, Tailwind CSS
- **Database & Auth**: PostgreSQL, Prisma ORM, Auth.js (Credentials login with bcrypt hashes)
- **Validation & Business Logic**: Zod validation, Server-side RBAC, isolated domain logic in `src/lib/domain`
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
| `SCHOOL_ADMIN` | `school@orbit.test` | School container overview, waste batch history, multi-item pickup request creation (`/operations/pickups`), pickup progress monitoring, energy credit & impact reports |
| `CANTEEN_STAFF` | `canteen@orbit.test` | Mobile 1-scan reusable container load registration (`/c/[qrToken]` or `/batches/new`), declared mass entry, category confirmation, sorting feedback |
| `STUDENT` | `student@orbit.test` | Educational waste journey trace, sorting accuracy feedback, public school impact reports |
| `OPERATOR` | `operator@orbit.test` | Incoming pickup request review (Accept/Reject), vehicle fleet route scheduling, collection transit, facility contamination inspection, conversion cycles, verified gas recording, allocation calculation & fulfilment, biodigester safety |
| `COMMUNITY_PARTNER` | `community@orbit.test` | Read-only monitoring of community allocation pools, local energy benefit, fulfilment status, approved facility performance, and public impact reports |

---

## 📐 Role Permissions & Architecture

ORBIT is built as a **Modular Monolith**. Server components query database models directly through Prisma, while mutations execute through Server Actions guarded by Zod validation schemas and RBAC checks (`src/lib/services/authz.ts` and `src/lib/domain/rbac.ts`).

| Role | Main Permissions |
| :--- | :--- |
| `SUPER_ADMIN` | `manage_system`, `manage_org`, `manage_containers`, `issue_qr`, `create_waste_record`, `view_batches`, `request_pickup`, `respond_pickup_request`, `manage_pickup_logistics`, `inspect_batch`, `record_conversion`, `calculate_allocation`, `fulfil_allocation`, `view_reports`, `view_audit`, `manage_safety` |
| `SCHOOL_ADMIN` | `manage_org`, `view_reports`, `view_audit`, `view_batches`, `request_pickup` |
| `CANTEEN_STAFF` | `create_waste_record`, `create_batch`, `view_batches`, `view_reports` |
| `STUDENT` | `view_student`, `view_reports` (Public-safe trace only) |
| `OPERATOR` | `respond_pickup_request`, `manage_pickup_logistics`, `inspect_batch`, `record_conversion`, `calculate_allocation`, `fulfil_allocation`, `manage_safety`, `view_reports`, `view_batches` |
| `COMMUNITY_PARTNER` | `view_reports` (Read-only monitoring) |

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
