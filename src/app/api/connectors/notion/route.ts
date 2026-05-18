import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.provider !== "notion") {
    return Response.json({ pages: [], error: "Sign in with Notion first." }, { status: 401 });
  }

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 30, filter: { property: "object", value: "page" } }),
  });

  if (!res.ok) {
    return Response.json({ pages: [], error: `Notion API: ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  type NotionResult = { id: string; url: string; properties?: Record<string, { title?: { plain_text: string }[] }>; last_edited_time: string; icon?: { emoji?: string } };
  const pages = (data.results || []).map((r: NotionResult) => ({
    id: r.id,
    url: r.url,
    title:
      r.properties?.title?.title?.[0]?.plain_text ||
      r.properties?.Name?.title?.[0]?.plain_text ||
      "Untitled",
    lastEdited: r.last_edited_time,
    icon: r.icon?.emoji || null,
  }));
  return Response.json({ pages });
}
