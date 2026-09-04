FROM public.ecr.aws/docker/library/node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM base AS builder
WORKDIR /app
ARG DATABASE_URL="postgresql://orbit:orbit2026@localhost:55432/orbit"
ARG AUTH_SECRET="orbit_demo_super_secret_auth_secret_2026_fallback"
ARG AUTH_URL="http://localhost:3115"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3115"
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_URL=$AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3115
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3115
CMD ["node", "server.js"]
