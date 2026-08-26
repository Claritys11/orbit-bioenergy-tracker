import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/domain/types";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { memberships: { include: { organisation: true } } },
        });
        if (!user || user.deletedAt) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            organisationId: user.memberships[0]?.organisationId,
            action: "AUTH_LOGIN",
            entityType: "User",
            entityId: user.id,
            after: { email: user.email, role: user.role },
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisationId: user.memberships[0]?.organisationId,
          organisationName: user.memberships[0]?.organisation.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organisationId = user.organisationId;
        token.organisationName = user.organisationName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
        session.user.organisationId =
          typeof token.organisationId === "string" ? token.organisationId : undefined;
        session.user.organisationName =
          typeof token.organisationName === "string" ? token.organisationName : undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
