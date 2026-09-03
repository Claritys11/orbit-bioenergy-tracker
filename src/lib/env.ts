import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://orbit:orbit2026@localhost:55432/orbit"),
  AUTH_SECRET: z.string().min(1).default("orbit_demo_super_secret_auth_secret_2026_fallback"),
  AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3115"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  AUTH_SECRET: process.env.AUTH_SECRET || undefined,
  AUTH_URL: process.env.AUTH_URL || undefined,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
});

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://orbit:orbit2026@localhost:55432/orbit",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "orbit_demo_super_secret_auth_secret_2026_fallback",
      AUTH_URL: process.env.AUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3115",
    };
