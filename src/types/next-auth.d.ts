import type { Role } from "@/lib/domain/types";

declare module "next-auth" {
  interface User {
    role: Role;
    organisationId?: string;
    organisationName?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      organisationId?: string;
      organisationName?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    organisationId?: string;
    organisationName?: string;
  }
}
