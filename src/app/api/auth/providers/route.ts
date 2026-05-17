export async function GET() {
  /* Auth-providers endpoint: returns only the providers suitable for sign-in.
   * Slack is excluded because its user token expires in ~12 hours and is
   * therefore only available for ingestion via /sources (not login). */
  const configured: { id: string; name: string }[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    configured.push({ id: "google", name: "Google" });
  }
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    configured.push({ id: "github", name: "GitHub" });
  }
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    configured.push({ id: "linkedin", name: "LinkedIn" });
  }
  if (process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET) {
    configured.push({ id: "notion", name: "Notion" });
  }

  return Response.json({ providers: configured });
}
