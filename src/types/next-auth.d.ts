import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: { uid: number; role: UserRole } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: number;
    role?: UserRole;
  }
}
