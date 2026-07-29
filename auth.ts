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
        return token;
      }

      const expiresAt = token.expiresAt as number | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      if (!expiresAt || Date.now() < expiresAt * 1000 - 60_000) {
        return token;
      }
      if (!refreshToken) return token;

      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });
        const refreshed = await res.json();
        if (!res.ok) throw refreshed;
        token.accessToken = refreshed.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
        token.refreshToken = refreshed.refresh_token ?? refreshToken;
      } catch (err) {
        console.error("Failed to refresh Google access token", err);
        token.accessToken = undefined;
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
