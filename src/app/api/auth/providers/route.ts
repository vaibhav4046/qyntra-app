export async function GET() {
  /* Auth-providers endpoint: returns only the providers shown on /signin.
   * Ingestion-only providers (LinkedIn, Slack) are kept in auth.ts
   * so /sources can still call signIn() for token exchange, but they are
   * hidden from the sign-in UI.
   */
  const configured: { id: string; name: string }[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    configured.push({ id: "google", name: "Google" });
  }
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    configured.push({ id: "github", name: "GitHub" });
  }
  if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
    configured.push({ id: "notion", name: "Notion" });
  }

  return Response.json({ providers: configured });
}
