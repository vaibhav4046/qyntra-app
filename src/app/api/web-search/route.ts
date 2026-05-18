import { auth } from "@/lib/auth";

// Free web search via DuckDuckGo HTML endpoint (no API key required).
// We scrape the result snippets and return the top 8.

interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function unwrapDuckDuckGoUrl(href: string): string {
  // DuckDuckGo wraps results as /l/?uddg=<encoded URL>
  const m = href.match(/uddg=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return href;
    }
  }
  return href;
}

async function searchDuckDuckGo(query: string, max = 8): Promise<WebResult[]> {
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    },
    body: new URLSearchParams({ q: query, kl: "us-en" }).toString(),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const results: WebResult[] = [];
  // Match each result block: a "result__a" link + result__snippet div
  const blockRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html)) && results.length < max) {
    const url = unwrapDuckDuckGoUrl(m[1]);
    const title = stripTags(m[2]);
    const snippet = stripTags(m[3]);
    if (title && url) results.push({ title, url, snippet });
  }
  return results;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthenticated" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const query: string = (body?.query || "").toString().trim();
  if (!query) return Response.json({ error: "query required" }, { status: 400 });
  try {
    const results = await searchDuckDuckGo(query, 8);
    return Response.json({ query, results, source: "duckduckgo" });
  } catch (err) {
    return Response.json({ error: (err as Error).message, results: [] }, { status: 500 });
  }
}
