/**
 * Wiki Article Auto-Generator — the Week 2 killer feature.
 *
 * POST /api/wiki/generate { topic: string }
 *
 * Steps:
 *   1. Gather relevant snippets from the user's Supabase `files` (or demo seed
 *      when the user is anonymous / has no corpus).
 *   2. Ask Groq Llama 3.3 70B to write a Wikipedia-style article grounded ONLY
 *      on those snippets. Structured JSON output (lede / sections / infobox /
 *      references / see-also).
 *   3. Return the JSON for the client to render.
 *
 * Falls back to a clear error when the corpus is empty AND we have no demo seed.
 */
import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";
import { NODES, FILES_SEED } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 60;

interface CorpusItem {
  title: string;
  summary: string;
  body: string;
  source: string;
  source_url?: string;
  kind: string;
}

interface ArticleOutput {
  title: string;
  lede: string;
  infobox: { label: string; value: string }[];
  sections: { heading: string; body: string }[];
  references: { id: number; title: string; source: string; url?: string; snippet?: string }[];
  seeAlso: string[];
}

async function loadCorpus(userId: string | undefined, topic: string): Promise<{ items: CorpusItem[]; demo: boolean }> {
  const lowerTopic = topic.toLowerCase();

  if (userId && hasSupabase()) {
    try {
      const sb = supabaseAdmin();
      // Naive ilike scoring — bring back rows whose title or content mentions the topic
      // or one of its words. For the hackathon this is enough; production would use pgvector.
      const words = lowerTopic.split(/\s+/).filter((w) => w.length > 2);
      const orFilter = [`title.ilike.%${topic}%`, `content.ilike.%${topic}%`, `summary.ilike.%${topic}%`]
        .concat(words.map((w) => `title.ilike.%${w}%`))
        .join(",");
      const { data } = await sb
        .from("files")
        .select("title, summary, content, source, source_url, kind")
        .eq("user_id", userId)
        .or(orFilter)
        .limit(12);
      if (data && data.length > 0) {
        return {
          demo: false,
          items: data.map((d) => ({
            title: d.title || "Untitled",
            summary: d.summary || "",
            body: (d.content || "").slice(0, 4000),
            source: d.source || "user",
            source_url: d.source_url || undefined,
            kind: d.kind || "DOC",
          })),
        };
      }
    } catch {
      /* fall through to demo seed */
    }
  }

  // Demo fallback — combine NODES + FILES_SEED so anonymous judges still get rich
  // grounded answers. We rank items by simple substring score.
  const score = (text: string) => {
    let s = 0;
    for (const w of lowerTopic.split(/\s+/)) {
      if (!w) continue;
      if (text.toLowerCase().includes(w)) s += 1;
    }
    return s;
  };
  const seeds: CorpusItem[] = NODES.map((n) => ({
    title: n.label,
    summary: n.summary,
    body: n.preview || n.summary,
    source: n.source || "Qyntra",
    source_url: n.sourceUrl,
    kind: n.kind,
  })).concat(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FILES_SEED as any[]).map((f) => ({
      title: f.title,
      summary: f.sub,
      body: f.preview || f.sub || "",
      source: f.source || "Qyntra",
      source_url: f.url,
      kind: f.kind || "DOC",
    }))
  );
  const ranked = seeds
    .map((s) => ({ s, score: score(s.title + " " + s.summary + " " + s.body) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.s);
  return { items: ranked.length ? ranked : seeds.slice(0, 8), demo: true };
}

function buildPrompt(topic: string, items: CorpusItem[]): string {
  const evidence = items
    .map((c, i) => `[${i + 1}] ${c.title} (${c.source})\n${c.summary}\n${c.body}`.slice(0, 1200))
    .join("\n\n---\n\n");

  return `You are Qyntra, a personal-Wikipedia article generator. Write a single Wikipedia-style article about "${topic}" using ONLY the evidence snippets below. Cite every claim inline with [n] referring to the snippet numbers. Never invent facts. If the evidence is thin, say so honestly in the lede.

Return STRICT JSON matching this TypeScript shape — no prose, no markdown fences:
{
  "title": string,
  "lede": string,            // 2-4 sentences, encyclopedia style
  "infobox": { "label": string, "value": string }[],   // 3-6 entries, e.g. Type / Domain / First seen
  "sections": { "heading": string, "body": string }[], // 3-5 sections, each 80-180 words
  "references": { "id": number, "title": string, "source": string, "url"?: string, "snippet"?: string }[],
  "seeAlso": string[]        // 3-5 related topics drawn from the evidence
}

EVIDENCE:
${evidence}`;
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 2400,
      messages: [
        { role: "system", content: "You write encyclopedia entries grounded only on the supplied evidence." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "{}";
}

function safeParse(text: string): ArticleOutput | null {
  try {
    return JSON.parse(text) as ArticleOutput;
  } catch {
    // Sometimes the model wraps in fences despite response_format. Strip and retry.
    const cleaned = text
      .replace(/^```(?:json)?/m, "")
      .replace(/```$/m, "")
      .trim();
    try {
      return JSON.parse(cleaned) as ArticleOutput;
    } catch {
      return null;
    }
  }
}

export async function POST(req: Request) {
  let topic = "";
  try {
    const body = await req.json();
    topic = (body?.topic || "").toString().trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!topic || topic.length < 2) {
    return Response.json({ error: "Topic required" }, { status: 400 });
  }
  if (topic.length > 120) {
    return Response.json({ error: "Topic too long (max 120 chars)" }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  const { items, demo } = await loadCorpus(userId, topic);

  const userKey = req.headers.get("x-qyntra-api-key") || "";
  const apiKey = userKey || process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  try {
    const raw = await callGroq(buildPrompt(topic, items), apiKey);
    const article = safeParse(raw);
    if (!article) {
      return Response.json({ error: "Model returned unparseable JSON", raw: raw.slice(0, 500) }, { status: 502 });
    }
    return Response.json({
      ok: true,
      article,
      grounded: !demo,
      sourceCount: items.length,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
