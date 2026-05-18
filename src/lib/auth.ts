import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Notion from "next-auth/providers/notion";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { verifyMagicToken } from "@/lib/magic-link";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    expiresAt?: number;
    user: DefaultSession["user"] & { id?: string };
  }
}

// Prevent Next.js from inlining env vars at build time.
// We read them at runtime so redeploys pick up new OAuth credentials
// without requiring a clean build.
function env(key: string): string | undefined {
  return process.env[key];
}

const providers = [];

// Google is configured for backend ingestion but hidden from sign-in UI
if (env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")) {
  providers.push(
    Google({
      clientId: env("GOOGLE_CLIENT_ID")!,
      clientSecret: env("GOOGLE_CLIENT_SECRET")!,
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

if (env("GITHUB_ID") && env("GITHUB_SECRET")) {
  providers.push(
    GitHub({
      clientId: env("GITHUB_ID")!,
      clientSecret: env("GITHUB_SECRET")!,
      authorization: {
        params: {
          scope: "read:user user:email repo gist read:org",
        },
      },
    })
  );
}

if (env("NOTION_CLIENT_ID") && env("NOTION_CLIENT_SECRET")) {
  providers.push(
    Notion({
      clientId: env("NOTION_CLIENT_ID")!,
      clientSecret: env("NOTION_CLIENT_SECRET")!,
      redirectUri:
        env("NOTION_REDIRECT_URI") ||
        `${env("NEXTAUTH_URL") || "https://qyntra-app.vercel.app"}/api/auth/callback/notion`,
    })
  );
}

// Magic-link Credentials provider — always enabled. Authenticates via signed token.
providers.push(
  Credentials({
    id: "magic",
    name: "Magic Link",
    credentials: {
      token: { label: "Magic token", type: "text" },
    },
    async authorize(creds) {
      const token = creds?.token;
      if (!token || typeof token !== "string") return null;
      const payload = verifyMagicToken(token);
      if (!payload) return null;
      const id = `email:${Buffer.from(payload.email).toString("hex").slice(0, 32)}`;
      // Best-effort: ensure profile row exists
      if (hasSupabase()) {
        try {
          const sb = supabaseAdmin();
          await sb.from("profiles").upsert(
            { id, email: payload.email, name: payload.name || null, provider: "email" },
            { onConflict: "id" }
          );
        } catch {}
      }
      return {
        id,
        email: payload.email,
        name: payload.name || null,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!hasSupabase() || !account || !user.email) return true;
      // Credentials/magic provider already upserted in authorize()
      if (account.provider === "magic") return true;
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
        if (account.provider === "magic" && user?.id) {
          token.uid = user.id as string;
        } else {
          token.uid = `${account.provider}:${account.providerAccountId}`;
        }
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
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // malformed URL → fall through to safe default
      }
      return `${baseUrl}/onboarding`;
    },
  },
  pages: { signIn: "/signin" },
});
