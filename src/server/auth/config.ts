import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { UserRole } from "@/generated/prisma/client";
import { authenticate } from "@/server/auth/authenticate";

class LockedAccountError extends CredentialsSignin {
  code = "locked";
}

// Auth.js v5, phiên lưu trong JWT (cookie HttpOnly, NFR-01). Mỗi trang và server action
// vẫn đọc lại người dùng trong CSDL qua getActor() để tài khoản vừa bị khoá mất quyền ngay.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const result = await authenticate(email, password);
        if (result.status === "locked") throw new LockedAccountError();
        if (result.status !== "ok") return null;
        return {
          id: String(result.user.id),
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id);
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "number" && token.role) {
        session.user.uid = token.uid;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
