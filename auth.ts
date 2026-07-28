import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLAN_SEEDS } from "@/lib/mockData";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    calendarConnected?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { name: user.name, image: user.image },
        });
        return true;
      }
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
          plans: { create: DEFAULT_PLAN_SEEDS },
        },
      });
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.calendarConnected = !!token.refreshToken;
      return session;
    },
  },
});
