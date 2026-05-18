import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.provider !== "google") {
    return Response.json({ messages: [], error: "Sign in with Google first." }, { status: 401 });
  }

  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox",
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!listRes.ok) {
    return Response.json({ messages: [], error: `Gmail API: ${listRes.status}` }, { status: listRes.status });
  }
  const list = await listRes.json();
  const ids = (list.messages || []).slice(0, 12).map((m: { id: string }) => m.id);

  const details = await Promise.all(
    ids.map(async (id: string) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      if (!r.ok) return null;
      const m = await r.json();
      const headers = Object.fromEntries(
        (m.payload?.headers || []).map((h: { name: string; value: string }) => [h.name, h.value])
      );
      return {
        id: m.id,
        from: headers.From,
        subject: headers.Subject,
        date: headers.Date,
        snippet: m.snippet,
      };
    })
  );

  return Response.json({ messages: details.filter(Boolean) });
}
