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

/**
 * Upsert ingested rows into Supabase files table.
 * Dedupes per (user_id, source, source_id).
 */
export async function ingestRows(rows: IngestRow[]): Promise<number> {
  if (!rows.length) return 0;
  const sb = supabaseAdmin();
  // Delete existing rows with same (user_id, source, source_id) then insert
  // Simpler: do best-effort upsert via on_conflict=user_id,source,source_id (would need unique constraint).
  // Without unique constraint, use a manual dedup: delete then insert in a transaction-ish way.
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

/** Update connector last_sync + item_count. */
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

/* ─── PROVIDER ADAPTERS ─── */

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
    kind: f.mimeType.includes("spreadsheet") ? "SHEET" : f.mimeType.includes("presentation") ? "SLIDES" : f.mimeType.includes("pdf") ? "PDF" : "DOC",
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

export async function fetchGithubRepos(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch(
    "https://api.github.com/user/repos?per_page=30&sort=updated",
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const repos: GhRepo[] = await res.json();
  return repos.map((r) => ({
    user_id: userId,
    source: "github",
    source_id: String(r.id),
    source_url: r.html_url,
    kind: "REPO",
    title: r.full_name,
    summary: r.description || undefined,
    last_modified: r.updated_at,
    tags: ["github", r.language || ""].filter(Boolean),
  }));
}

interface SlackChannel {
  id: string;
  name: string;
  topic?: { value: string };
  purpose?: { value: string };
  num_members?: number;
}

export async function fetchSlackChannels(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch(
    "https://slack.com/api/conversations.list?limit=30&exclude_archived=true&types=public_channel",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Slack API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack: ${data.error}`);
  const channels: SlackChannel[] = data.channels || [];
  return channels.map((c) => ({
    user_id: userId,
    source: "slack",
    source_id: c.id,
    source_url: `slack://channel?team=&id=${c.id}`,
    kind: "THREAD",
    title: `#${c.name}`,
    summary: c.purpose?.value || c.topic?.value || undefined,
    tags: ["slack"],
  }));
}

interface LinkedInProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export async function fetchLinkedInProfile(token: string, userId: string): Promise<IngestRow[]> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`LinkedIn API ${res.status}: ${await res.text()}`);
  const p: LinkedInProfile = await res.json();
  return [
    {
      user_id: userId,
      source: "linkedin",
      source_id: p.sub,
      source_url: "https://www.linkedin.com/in/me",
      kind: "PROFILE",
      title: p.name || "LinkedIn profile",
      summary: p.email,
      tags: ["linkedin", "profile"],
    },
  ];
}

/** Dispatch by provider. Returns count + (optional) error. */
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
    case "drive":
      rows = await fetchDriveFiles(accessToken, userId);
      break;
    case "gmail":
      rows = await fetchGmailMessages(accessToken, userId);
      break;
    case "github":
      rows = await fetchGithubRepos(accessToken, userId);
      break;
    case "slack":
      rows = await fetchSlackChannels(accessToken, userId);
      break;
    case "linkedin":
      rows = await fetchLinkedInProfile(accessToken, userId);
      break;
    default:
      return { inserted: 0, source: provider, message: `Unsupported provider: ${provider}` };
  }
  const inserted = await ingestRows(rows);
  await markConnectorSynced(userId, provider, inserted, accessToken);
  return { inserted, source: provider };
}
