# ORBIT

Organic Recycling & Bioenergy Impact Tracker.

ORBIT is a production-minded competition prototype for a School-to-Community Bioenergy Loop. It coordinates waste registration, QR traceability, operator quality verification, pickup, conversion, verified gas records, purity-to-power allocation, fulfilment, sustainability reporting, safety monitoring, and audit logs.

## Stack

- Next.js App Router, TypeScript strict mode, Tailwind CSS
- PostgreSQL and Prisma ORM
- Auth.js credentials login with bcrypt password hashes
- Zod validation and server-side RBAC
- Recharts analytics, QR generation, browser QR scanning
- Vitest unit tests and Playwright browser tests
- Docker Compose for local PostgreSQL

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Create `.env` from `.env.example` and generate a local secret:

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Put the generated value in `AUTH_SECRET`.

4. Create tables and seed demo data:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Credentials

All demo accounts use `OrbitDemo2026!`.

| Role | Email |
| --- | --- |
| SUPER_ADMIN | `super@orbit.test` |
| SCHOOL_ADMIN | `school@orbit.test` |
| CANTEEN_STAFF | `canteen@orbit.test` |
| STUDENT | `student@orbit.test` |
| OPERATOR | `operator@orbit.test` |
| COMMUNITY_PARTNER | `community@orbit.test` |

## Architecture

ORBIT is a modular monolith. Server components read operational data directly through Prisma. Mutations are server actions with Zod validation, RBAC checks, trusted recalculation, and audit logging. The core algorithm lives in isolated domain modules under `src/lib/domain` and is tested independently from the UI.

Important decisions:

- QR payloads use opaque tokens and open safe public trace pages.
- Estimated gas is calculated for contribution transparency only.
- Allocation uses verified gas minus operational use and safety reserve.
- Finalised allocations are not silently recalculated. Corrections should create a new version.
- TPS3R/KSM biodigester capability is explicit through `BiodigesterStatus`.
- ORBIT is monitoring software, not a physical safety controller.

## Role Permissions

| Role | Main permissions |
| --- | --- |
| SUPER_ADMIN | system settings, organisations, global reports, audit, allocation config |
| SCHOOL_ADMIN | school profile, reports, school users |
| CANTEEN_STAFF | create QR waste batches, monitor pickup status |
| STUDENT | safe traceability and educational impact only |
| OPERATOR | pickup, inspection, conversion, allocation, fulfilment, safety |
| COMMUNITY_PARTNER | approved allocation and impact reports |

Permissions are enforced on the server in `src/lib/services/authz.ts` and `src/lib/domain/rbac.ts`.

## Purity-to-Power Engine

Inspection:

```text
contaminationRate = rejectedMass / verifiedGrossMass * 100
acceptedMass = verifiedGrossMass - rejectedMass
```

Contribution:

```text
contributionScore =
acceptedMass * yieldFactor * qualityFactor * conditionFactor
```

Estimated gas:

```text
estimatedGas = acceptedMass * yieldFactor * conditionFactor
```

Allocatable verified gas:

```text
allocatableGas = verifiedGas - operationalUse - safetyReserve
```

Demo allocation defaults are 50% schools, 30% operator, and 20% supporting contributors. The school pool must remain the largest, supporting contributors cannot exceed schools, and unused supporting allocation returns first to schools.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run validate
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

## Deployment

Use a managed PostgreSQL database, set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `NEXT_PUBLIC_APP_URL`, run Prisma migrations, then build and start the Next.js app.

See [docs/deployment.md](docs/deployment.md) for step-by-step Vercel and Coolify setup, including build settings, environment variables, database migration, and demo seeding.

The included GitHub Actions workflow runs Prisma generation, migrations, lint, type-check, unit tests, and production build against a PostgreSQL service. Local Docker Compose maps PostgreSQL to host port `55432` to avoid colliding with an existing local database on `5432`.

## Prototype Boundaries

ORBIT does not implement real biodigester control, gas compression, Bio-CNG, PLN integration, blockchain, real financial transactions, or AI prediction. Sensor data may be simulated and is labelled as simulated. Safety-critical shutdowns must be handled by certified local hardware and trained adult operators.

Financial values, LPG equivalents, yields, contamination thresholds, and the 5% ORBIT fee are pilot assumptions for demo validation.
