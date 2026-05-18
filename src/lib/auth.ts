import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import LinkedIn from "next-auth/providers/linkedin";
import Notion from "next-auth/providers/notion";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    expiresAt?: number; // unix timestamp (seconds)
    user: DefaultSession["user"] & { id?: string };
  }
}

const providers = [];

/* ─── PROVIDER SPLIT ───
 * SIGN-IN  → GitHub, Notion  (primary identity providers)
 * INGESTION → Google, LinkedIn, GitHub, Notion, Slack
 *   - Google & LinkedIn stay in auth.ts so /sources can call signIn()
 *     to exchange tokens for Drive/Gmail/Profile ingestion.
 *   - Slack is excluded from auth.ts because user tokens expire in ~12 hours.
 *     Slack uses a custom OAuth flow via /api/connectors/slack/*
 */

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  providers.push(
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    })
  );
}

if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
  providers.push(
    Notion({
      clientId: process.env.NOTION_CLIENT_ID,
      clientSecret: process.env.NOTION_CLIENT_SECRET,
      redirectUri: process.env.NOTION_REDIRECT_URI || "",
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Upsert profile row in Supabase on every sign-in
      if (!hasSupabase() || !account || !user.email) return true;
      try {
        const id = `${account.provider}:${account.providerAccountId}`;
        const sb = supabaseAdmin();
        await sb.from("profiles").upsert(
          {
            id,
            email: user.email,
            name: user.name || profile?.name || null,
            image: user.image || null,
            provider: account.provider,
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.error("[auth.signIn] supabase upsert failed", err);
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.uid = `${account.provider}:${account.providerAccountId}`;
        // expires_at comes as seconds from some providers; normalize
        token.expiresAt = account.expires_at ?? undefined;
      }
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.provider = token.provider as string;
      session.expiresAt = token.expiresAt as number | undefined;
      (session.user as { id?: string }).id = token.uid as string | undefined;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/onboarding";
    },
  },
  pages: { signIn: "/signin" },
});
