import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Slack from "next-auth/providers/slack";
import LinkedIn from "next-auth/providers/linkedin";
import Notion from "next-auth/providers/notion";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    user: DefaultSession["user"];
  }
}

const providers = [];

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

if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
  providers.push(
    Slack({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
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
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callbacks
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/home";
    },
  },
  pages: { signIn: "/signin" },
});
