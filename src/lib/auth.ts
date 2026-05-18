import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export interface QSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  accessToken?: string;
  refreshToken?: string;
  provider?: string;
  expiresAt?: number;
}

/**
 * Compatibility wrapper: returns a session-like object from Clerk.
 * Call this in API routes and server components.
 */
export async function auth(): Promise<QSession | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || null;

  // Detect which OAuth provider they signed in with
  const external = user.externalAccounts?.[0];
  const provider = external?.provider === "oauth_google"
    ? "google"
    : external?.provider === "oauth_github"
    ? "github"
    : external?.provider === "oauth_notion"
    ? "notion"
    : undefined;

  return {
    user: {
      id: userId,
      email: email || null,
      name,
      image: user.imageUrl || null,
    },
    provider,
  };
}

/**
 * Fetch an OAuth access token from Clerk for the given provider.
 * Works for: google, github, notion (and their aliases drive/gmail).
 */
export async function getOAuthToken(userId: string, provider: string): Promise<string | undefined> {
  const clerkProvider =
    provider === "google" || provider === "drive" || provider === "gmail"
      ? "oauth_google"
      : provider === "github"
      ? "oauth_github"
      : provider === "notion"
      ? "oauth_notion"
      : null;

  if (!clerkProvider) return undefined;

  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(userId, clerkProvider);
    return response.data[0]?.token;
  } catch {
    return undefined;
  }
}

/**
 * Sign-out helper for server actions / API routes.
 * On the client, use useClerk().signOut() instead.
 */
export async function signOut() {
  // Clerk handles sign-out via the client SDK or redirect to /signout
  // This is a no-op for compatibility; client components handle the real sign-out.
}
