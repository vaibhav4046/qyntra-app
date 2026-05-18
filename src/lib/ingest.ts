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

  for (const row of rows) {
    if (row.source_id) {
      await sb
        .from("files")
        .delete()
        .eq("user_id", row.user_id)
        .eq("source", row.source)
        .eq("source_id", row.source_id);
    }
  }

  const { error } = await sb.from("files").insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return rows.length;
}

export async function markConnectorSynced(
  userId: string,
  provider: string,
  itemCount: number,
  accessToken?: string
) {
  const sb = supabaseAdmin();
  await sb.from("connectors").upsert(
    {
      user_id: userId,
      provider,
      is_on: true,
      item_count: itemCount,
      last_sync: new Date().toISOString(),
      access_token: accessToken || null,
    },
    { onConflict: "user_id,provider" }
  );
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
  return pages.map((p) => ({
    user_id: userId,
    source: "notion",
    source_id: p.id,
    source_url: p.url,
    kind: "PAGE",
    title:
      p.properties?.title?.title?.[0]?.plain_text ||
      p.properties?.Name?.title?.[0]?.plain_text ||
      "Untitled",
    last_modified: p.last_edited_time,
    tags: ["notion"],
  }));
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export async function fetchDriveFiles(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink)",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const files: DriveFile[] = data.files || [];
  return files.map((f) => ({
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
    last_modified: f.modifiedTime,
    tags: ["drive"],
  }));
}

interface GmailMsg {
  id: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

export async function fetchGmailMessages(token: string, userId: string): Promise<IngestRow[]> {
  const list = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=in:inbox",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!list.ok) throw new Error(`Gmail API ${list.status}: ${await list.text()}`);
  const listData = await list.json();
  const ids = ((listData.messages || []) as GmailMsg[]).slice(0, 20).map((m) => m.id);

  const rows: IngestRow[] = [];
  for (const id of ids) {
    const r = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) continue;
    const m = await r.json();
    const headers = Object.fromEntries(
      ((m.payload?.headers || []) as GmailHeader[]).map((h) => [h.name, h.value])
    );
    rows.push({
      user_id: userId,
      source: "gmail",
      source_id: m.id,
      source_url: `https://mail.google.com/mail/u/0/#inbox/${m.id}`,
      kind: "EMAIL",
      title: headers.Subject || "(no subject)",
      summary: m.snippet,
      content: `From: ${headers.From || ""}\nDate: ${headers.Date || ""}\n\n${m.snippet || ""}`,
      last_modified: headers.Date,
      tags: ["gmail"],
    });
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

  rows.push(
    ...repos.map((r) => ({
      user_id: userId,
      source: "github",
      source_id: `repo:${r.id}`,
      source_url: r.html_url,
      kind: "REPO",
      title: r.full_name,
      summary: r.description || undefined,
      last_modified: r.updated_at,
      tags: ["github", "repo", r.language || ""].filter(Boolean),
    }))
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

  rows.push(
    ...starred.map((r) => ({
      user_id: userId,
      source: "github",
      source_id: `starred:${r.id}`,
      source_url: r.html_url,
      kind: "STARRED_REPO",
      title: r.full_name,
      summary: r.description || undefined,
      last_modified: r.updated_at,
      tags: ["github", "starred", r.language || ""].filter(Boolean),
    }))
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
