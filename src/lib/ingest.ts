import { supabaseAdmin } from "@/lib/supabase";

export interface IngestRow {
  user_id: string;
  source: string;
  source_id?: string;
  source_url?: string;
  kind: string;
  title: string;
  summary?: string;
  content?: string;
  tags?: string[];
  last_modified?: string;
}

export interface IngestResult {
  inserted: number;
  source: string;
  message?: string;
}

export async function ingestRows(rows: IngestRow[]): Promise<number> {
  if (!rows.length) return 0;
  const sb = supabaseAdmin();
  const userId = rows[0].user_id;
  const source = rows[0].source;

  // Atomic replacement: delete all existing rows for this user+source, then insert fresh.
  // This prevents duplicates and stale data from partial deletes.
  const { error: delErr } = await sb
    .from("files")
    .delete()
    .eq("user_id", userId)
    .eq("source", source);
  if (delErr) {
    throw new Error(`Supabase delete failed: ${delErr.message}`);
  }

  const { error } = await sb.from("files").insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return rows.length;
}

export async function markConnectorSynced(
  userId: string,
  provider: string,
  itemCount: number,
  accessToken?: string,
  refreshToken?: string
) {
  const sb = supabaseAdmin();
  const row: Record<string, unknown> = {
    user_id: userId,
    provider,
    is_on: true,
    item_count: itemCount,
    last_sync: new Date().toISOString(),
  };
  if (accessToken !== undefined) row.access_token = accessToken || null;
  if (refreshToken !== undefined) row.refresh_token = refreshToken || null;
  await sb.from("connectors").upsert(row, { onConflict: "user_id,provider" });
}

interface NotionPageProps {
  title?: { title?: { plain_text: string }[] };
  Name?: { title?: { plain_text: string }[] };
}

interface NotionPage {
  id: string;
  url: string;
  properties?: NotionPageProps;
  last_edited_time: string;
}

interface NotionRichText {
  plain_text?: string;
}
interface NotionBlock {
  type: string;
  [k: string]: unknown;
}

function extractBlockText(block: NotionBlock): string {
  // Each Notion block has a payload keyed by its type, containing rich_text array
  const payload = (block as Record<string, unknown>)[block.type] as
    | { rich_text?: NotionRichText[] }
    | undefined;
  if (!payload?.rich_text) return "";
  return payload.rich_text.map((rt) => rt.plain_text || "").join("");
}

async function fetchNotionPageContent(token: string, pageId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const blocks: NotionBlock[] = data.results || [];
    return blocks
      .map((b) => extractBlockText(b))
      .filter(Boolean)
      .join("\n")
      .slice(0, 16000); // cap per-page to 16KB
  } catch {
    return "";
  }
}

export async function fetchNotionPages(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 50, filter: { property: "object", value: "page" } }),
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const pages: NotionPage[] = data.results || [];

  // Fetch content for each page in parallel (capped concurrency via small batches)
  const rows: IngestRow[] = [];
  const batchSize = 5;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const enriched = await Promise.all(
      batch.map(async (p) => {
        const content = await fetchNotionPageContent(token, p.id);
        const title =
          p.properties?.title?.title?.[0]?.plain_text ||
          p.properties?.Name?.title?.[0]?.plain_text ||
          "Untitled";
        return {
          user_id: userId,
          source: "notion",
          source_id: p.id,
          source_url: p.url,
          kind: "PAGE",
          title,
          summary: content.slice(0, 240) || undefined,
          content: content || undefined,
          last_modified: p.last_edited_time,
          tags: ["notion"],
        } as IngestRow;
      })
    );
    rows.push(...enriched);
  }
  return rows;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

async function fetchDriveDocText(token: string, fileId: string, mimeType: string): Promise<string> {
  try {
    // Only Google Docs / Sheets / Slides export to text. Skip PDFs and binary.
    if (!mimeType.startsWith("application/vnd.google-apps")) return "";
    const exportMime = mimeType.includes("spreadsheet")
      ? "text/csv"
      : mimeType.includes("presentation")
      ? "text/plain"
      : "text/plain";
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 16000);
  } catch {
    return "";
  }
}

export async function fetchDriveFiles(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink)",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const files: DriveFile[] = data.files || [];

  // Fetch content for top 20 Google Docs / Sheets / Slides in parallel batches
  const contents = new Map<string, string>();
  const exportable = files.filter((f) => f.mimeType.startsWith("application/vnd.google-apps")).slice(0, 20);
  for (let i = 0; i < exportable.length; i += 5) {
    const batch = exportable.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (f) => ({ id: f.id, content: await fetchDriveDocText(token, f.id, f.mimeType) }))
    );
    for (const { id, content } of results) {
      if (content) contents.set(id, content);
    }
  }

  return files.map((f) => {
    const content = contents.get(f.id) || "";
    return {
      user_id: userId,
      source: "drive",
      source_id: f.id,
      source_url: f.webViewLink,
      kind: f.mimeType.includes("spreadsheet")
        ? "SHEET"
        : f.mimeType.includes("presentation")
        ? "SLIDES"
        : f.mimeType.includes("pdf")
        ? "PDF"
        : "DOC",
      title: f.name,
      summary: content.slice(0, 240) || undefined,
      content: content || undefined,
      last_modified: f.modifiedTime,
      tags: ["drive"],
    };
  });
}

interface GmailMsg {
  id: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

function decodeGmailBase64Url(data: string): string {
  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractGmailBody(payload: GmailPart | undefined): string {
  if (!payload) return "";
  // Prefer text/plain, fallback text/html stripped of tags
  function walk(p: GmailPart): { plain?: string; html?: string } {
    if (p.mimeType === "text/plain" && p.body?.data) return { plain: decodeGmailBase64Url(p.body.data) };
    if (p.mimeType === "text/html" && p.body?.data) return { html: decodeGmailBase64Url(p.body.data) };
    if (p.parts) {
      const out: { plain?: string; html?: string } = {};
      for (const child of p.parts) {
        const w = walk(child);
        if (w.plain && !out.plain) out.plain = w.plain;
        if (w.html && !out.html) out.html = w.html;
      }
      return out;
    }
    return {};
  }
  const { plain, html } = walk(payload);
  if (plain) return plain;
  if (html) return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return "";
}

export async function fetchGmailMessages(token: string, userId: string): Promise<IngestRow[]> {
  const list = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=in:inbox",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!list.ok) throw new Error(`Gmail API ${list.status}: ${await list.text()}`);
  const listData = await list.json();
  const ids = ((listData.messages || []) as GmailMsg[]).slice(0, 25).map((m) => m.id);

  const rows: IngestRow[] = [];
  // Parallel fetch (Gmail allows ~10 RPS)
  const batchSize = 5;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(async (id) => {
        try {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );
    for (const m of fetched) {
      if (!m) continue;
      const headers = Object.fromEntries(
        ((m.payload?.headers || []) as GmailHeader[]).map((h) => [h.name, h.value])
      );
      const dateIso = headers.Date ? new Date(headers.Date).toISOString() : undefined;
      const body = extractGmailBody(m.payload).slice(0, 16000);
      const content = `From: ${headers.From || ""}\nDate: ${headers.Date || ""}\nSubject: ${headers.Subject || ""}\n\n${body || m.snippet || ""}`;
      rows.push({
        user_id: userId,
        source: "gmail",
        source_id: m.id,
        source_url: `https://mail.google.com/mail/u/0/#inbox/${m.id}`,
        kind: "EMAIL",
        title: headers.Subject || "(no subject)",
        summary: (body || m.snippet || "").slice(0, 240),
        content,
        last_modified: dateIso,
        tags: ["gmail"],
      });
    }
  }
  return rows;
}

interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  language: string | null;
}

interface GhGist {
  id: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  files?: Record<string, { filename?: string; language?: string | null }>;
}

interface GhIssue {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  updated_at: string;
  state: string;
  repository_url?: string;
  pull_request?: unknown;
}

async function fetchGithubJson<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

function settledArray<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === "fulfilled" ? result.value : [];
}

async function fetchRepoReadme(token: string, fullName: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 16000); // cap per-repo
  } catch {
    return "";
  }
}

export async function fetchGithubData(token: string, userId: string): Promise<IngestRow[]> {
  const [reposResult, gistsResult, issuesResult, starredResult] = await Promise.allSettled([
    fetchGithubJson<GhRepo[]>(token, "/user/repos?per_page=50&sort=updated"),
    fetchGithubJson<GhGist[]>(token, "/gists?per_page=50"),
    fetchGithubJson<GhIssue[]>(token, "/issues?filter=all&state=all&per_page=50"),
    fetchGithubJson<GhRepo[]>(token, "/user/starred?per_page=50&sort=updated"),
  ]);

  const repos = settledArray(reposResult);
  const gists = settledArray(gistsResult);
  const issues = settledArray(issuesResult);
  const starred = settledArray(starredResult);
  const rows: IngestRow[] = [];

  // Fetch READMEs for top 20 owned repos in parallel batches of 5
  const readmes = new Map<string, string>();
  const topRepos = repos.slice(0, 20);
  for (let i = 0; i < topRepos.length; i += 5) {
    const batch = topRepos.slice(i, i + 5);
    const fetched = await Promise.all(
      batch.map(async (r) => ({ name: r.full_name, content: await fetchRepoReadme(token, r.full_name) }))
    );
    for (const { name, content } of fetched) {
      if (content) readmes.set(name, content);
    }
  }

  rows.push(
    ...repos.map((r) => {
      const readme = readmes.get(r.full_name) || "";
      const fullContent = readme
        ? `${r.description ? r.description + "\n\n" : ""}${readme}`
        : r.description || "";
      return {
        user_id: userId,
        source: "github",
        source_id: `repo:${r.id}`,
        source_url: r.html_url,
        kind: "REPO",
        title: r.full_name,
        summary: r.description || (readme ? readme.slice(0, 240) : undefined),
        content: fullContent || undefined,
        last_modified: r.updated_at,
        tags: ["github", "repo", r.language || ""].filter(Boolean),
      };
    })
  );

  rows.push(
    ...gists.map((g) => {
      const files = Object.values(g.files || {});
      const title = g.description || files[0]?.filename || "Untitled gist";
      return {
        user_id: userId,
        source: "github",
        source_id: `gist:${g.id}`,
        source_url: g.html_url,
        kind: "GIST",
        title,
        summary: files.map((f) => f.filename).filter(Boolean).join(", ") || undefined,
        last_modified: g.updated_at,
        tags: ["github", "gist", files[0]?.language || ""].filter(Boolean),
      };
    })
  );

  rows.push(
    ...issues.map((i) => ({
      user_id: userId,
      source: "github",
      source_id: `${i.pull_request ? "pr" : "issue"}:${i.id}`,
      source_url: i.html_url,
      kind: i.pull_request ? "PULL_REQUEST" : "ISSUE",
      title: i.title,
      summary: i.body?.slice(0, 300) || undefined,
      content: i.body || undefined,
      last_modified: i.updated_at,
      tags: ["github", i.pull_request ? "pull-request" : "issue", i.state],
    }))
  );

  // Fetch READMEs for top 10 starred repos too
  const starredReadmes = new Map<string, string>();
  const topStarred = starred.slice(0, 10);
  for (let i = 0; i < topStarred.length; i += 5) {
    const batch = topStarred.slice(i, i + 5);
    const fetched = await Promise.all(
      batch.map(async (r) => ({ name: r.full_name, content: await fetchRepoReadme(token, r.full_name) }))
    );
    for (const { name, content } of fetched) {
      if (content) starredReadmes.set(name, content);
    }
  }

  rows.push(
    ...starred.map((r) => {
      const readme = starredReadmes.get(r.full_name) || "";
      const fullContent = readme
        ? `${r.description ? r.description + "\n\n" : ""}${readme}`
        : r.description || "";
      return {
        user_id: userId,
        source: "github",
        source_id: `starred:${r.id}`,
        source_url: r.html_url,
        kind: "STARRED_REPO",
        title: r.full_name,
        summary: r.description || (readme ? readme.slice(0, 240) : undefined),
        content: fullContent || undefined,
        last_modified: r.updated_at,
        tags: ["github", "starred", r.language || ""].filter(Boolean),
      };
    })
  );

  if (!rows.length) {
    const firstError = [reposResult, gistsResult, issuesResult, starredResult].find(
      (result) => result.status === "rejected"
    ) as PromiseRejectedResult | undefined;
    if (firstError) throw firstError.reason;
  }

  return rows;
}

export async function runIngest(
  provider: string,
  accessToken: string,
  userId: string
): Promise<IngestResult> {
  let rows: IngestRow[] = [];

  switch (provider) {
    case "notion":
      rows = await fetchNotionPages(accessToken, userId);
      break;
    case "google":
      rows = [
        ...(await fetchDriveFiles(accessToken, userId)),
        ...(await fetchGmailMessages(accessToken, userId)),
      ];
      break;
    case "drive":
      rows = await fetchDriveFiles(accessToken, userId);
      break;
    case "gmail":
      rows = await fetchGmailMessages(accessToken, userId);
      break;
    case "github":
      rows = await fetchGithubData(accessToken, userId);
      break;
    default:
      return { inserted: 0, source: provider, message: `Unsupported provider: ${provider}` };
  }

  const inserted = await ingestRows(rows);
  await markConnectorSynced(userId, provider, inserted, accessToken);
  return { inserted, source: provider };
}
