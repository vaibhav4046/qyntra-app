export async function GET() {
  // Auth providers shown on /signin and /signup.
  // NOTE: env vars must be set in Vercel Dashboard > Settings > Environment Variables
  // and the project redeployed before they appear here.
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
