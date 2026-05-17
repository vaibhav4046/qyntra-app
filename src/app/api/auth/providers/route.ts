import { auth } from "@/lib/auth";

export async function GET() {
  // Auth.js internal: providers array from auth config
  // We return only the ids + names so the UI can show real configured providers
  const { providers } = await auth().then(() => ({} as any)).catch(() => ({} as any));
  // Actually, auth() returns session. We need to access the config directly.
  // Since we can't easily introspect the auth config here, we'll hard-sync with auth.ts
  const configured: { id: string; name: string }[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    configured.push({ id: "google", name: "Google" });
  }
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    configured.push({ id: "github", name: "GitHub" });
  }
  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
    configured.push({ id: "slack", name: "Slack" });
  }
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    configured.push({ id: "linkedin", name: "LinkedIn" });
  }
  if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
    configured.push({ id: "notion", name: "Notion" });
  }

  return Response.json({ providers: configured });
}
