# Deployment Guide

This project can run on Vercel or Coolify. Both need a PostgreSQL database and the same required environment variables.

## Required Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="minimum-32-random-characters"
AUTH_URL="https://your-production-domain.example"
NEXT_PUBLIC_APP_URL="https://your-production-domain.example"
```

Generate `AUTH_SECRET` locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Keep `AUTH_SECRET` private. `NEXT_PUBLIC_APP_URL` is public because it is bundled for browser-side code.

## Before Deploying

1. Push the latest code to GitHub.
2. Prepare a managed PostgreSQL database.
3. Copy the production database connection string.
4. Run migrations against the production database.
5. Optionally seed demo data if this deployment is for judging/demo.

Production migration command:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma migrate deploy
```

Demo seed command:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma db seed
```

Do not run seed on a real production database after real users have started using the app unless you intentionally want demo records there.

## Option A: Vercel

Vercel is the simplest option for the Next.js app. Use a managed database such as Prisma Postgres from the Vercel Marketplace, Neon, Supabase, Railway, or any PostgreSQL provider that allows Vercel to connect.

### 1. Import Project

1. Open Vercel Dashboard.
2. Click **Add New > Project**.
3. Import `Claritys11/orbit-bioenergy-tracker`.
4. Framework Preset: **Next.js**.
5. Root Directory: `./`.

### 2. Build And Output Settings

Use these settings:

| Setting | Value |
| --- | --- |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | leave empty / default |
| Development Command | `npm run dev` |

`npm run build` already runs `prisma generate && next build`.

### 3. Environment Variables

In **Project Settings > Environment Variables**, add these for Production:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="generated-secret"
AUTH_URL="https://your-vercel-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
```

After you attach a custom domain, update:

```env
AUTH_URL="https://your-custom-domain.com"
NEXT_PUBLIC_APP_URL="https://your-custom-domain.com"
```

Then redeploy.

### 4. Database Migration

Run migration from your local terminal using the production `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma migrate deploy
```

For demo/judging data:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma db seed
```

### 5. Deploy

1. Click **Deploy** in Vercel.
2. Open the generated URL.
3. Check:
   - `/`
   - `/transparency`
   - `/login`
   - login with `operator@orbit.test` if demo seed was run.

### Vercel Notes

- If build fails with missing `DATABASE_URL`, make sure the variable exists for the same environment being deployed.
- If login redirects incorrectly, check that `AUTH_URL` and `NEXT_PUBLIC_APP_URL` match the deployed URL.
- If database connections are unstable, use a pooled connection string from your database provider.

## Option B: Coolify

Coolify is a good option if you want the app and database on your own VPS. This repo includes a Dockerfile, so the recommended path is Dockerfile deployment plus a separate Coolify PostgreSQL resource.

### 1. Create PostgreSQL Resource

1. Open Coolify.
2. Create or select a Project and Environment.
3. Add a new **PostgreSQL** database resource.
4. Start the database.
5. Copy the internal connection string for app-to-database traffic.

The internal host is preferred because the app and database run inside Coolify networking.

### 2. Create Application

1. Add a new Application from GitHub.
2. Select `Claritys11/orbit-bioenergy-tracker`.
3. Branch: `main`.
4. Build Pack: **Dockerfile**.
5. Base Directory: `/`.
6. Dockerfile Location: `/Dockerfile`.
7. Port / Ports Exposes: `3000`.
8. Static site: disabled.

### 3. Environment Variables

In the application **Environment Variables** tab, add:

```env
DATABASE_URL="postgresql://USER:PASSWORD@POSTGRES_INTERNAL_HOST:5432/DATABASE?schema=public"
AUTH_SECRET="generated-secret"
AUTH_URL="https://your-coolify-domain.com"
NEXT_PUBLIC_APP_URL="https://your-coolify-domain.com"
```

Keep these available for both build and runtime. Coolify enables both by default for new variables.

### 4. Migrations

Use one of these approaches.

Recommended manual first deploy:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma migrate deploy
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" npx prisma db seed
```

Or set a Coolify post-deployment command:

```bash
npx prisma migrate deploy
```

Only add seed as a one-time manual command for demo environments.

### 5. Deploy

1. Click **Deploy**.
2. Open the generated Coolify URL.
3. Check `/`, `/transparency`, and `/login`.
4. If seeded, test `operator@orbit.test` with `OrbitDemo2026!`.

### Coolify Notes

- Use Dockerfile deployment for this repo because `next.config.ts` outputs a standalone Next.js server.
- The Docker container listens on port `3000`.
- If the app shows database errors, verify the `DATABASE_URL` uses the Coolify internal database hostname, not `localhost`.
- If env changes do not apply, redeploy the application.

## Quick Decision

Choose Vercel if you want the fastest public URL and less server maintenance.

Choose Coolify if you want more control, easier self-hosted database colocation, and VPS ownership.

