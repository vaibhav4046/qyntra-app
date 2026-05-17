import { NODES } from "@/lib/data";
import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

interface UserFile {
  kind: string;
  title: string;
  summary?: string;
  source?: string;
  source_url?: string;
}

async function loadUserCorpus(userId: string): Promise<UserFile[]> {
  if (!hasSupabase() || !userId) return [];
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("files")
      .select("kind,title,summary,source,source_url")
      .eq("user_id", userId)
      .limit(60);
    if (error) return [];
    return (data || []) as UserFile[];
  } catch {
    return [];
  }
}

function buildSystemPrompt(userFiles: UserFile[], demoMode: boolean): string {
  const base = `You are Qyntra — a personal knowledge OS compiled from the user's own files.

Rules:
- Answer grounded on the corpus below. If the answer is not in the corpus, say so directly. Never invent file titles.
- Cite inline with [1], [2] and list numbered references at the end.
- Sharp, terse, no fluff. Markdown sparingly.
- End with a "Predicted follow-ups:" section with 2-3 specific next questions.`;

  if (demoMode || userFiles.length === 0) {
    const corpus = NODES.map((n, i) => `[${i + 1}] [${n.kind}] ${n.label} — ${n.summary}`).join("\n");
    const banner = demoMode
      ? "\n\nMODE: DEMO. The corpus below is sample data. State this in your first answer if asked about source provenance."
      : "\n\nMODE: EMPTY. User has no synced files yet. Encourage them to connect a source at /sources, but still answer using the sample corpus for now.";
    return `${base}\n\nCORPUS (${userFiles.length === 0 && !demoMode ? "sample fallback" : "demo"}):\n${corpus}${banner}`;
  }

  const corpus = userFiles
    .map((f, i) => `[${i + 1}] [${f.kind}] ${f.title}${f.summary ? " — " + f.summary : ""}${f.source ? " (from " + f.source + ")" : ""}`)
    .join("\n");
  return `${base}\n\nMODE: LIVE — answers are grounded on the user's real synced files only.\n\nCORPUS (${userFiles.length} files):\n${corpus}`;
}

export async function POST(req: Request) {
  // Require authentication
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: "Authentication required. Please sign in first." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, provider = "nvidia", demoMode = false } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages array required" }, { status: 400 });
  }

  // Sanitize messages
  const sanitized = messages
    .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
    .slice(-20);

  // Load user corpus from Supabase if not demo
  const userId = (session.user as { id?: string }).id;
  const userFiles = !demoMode && userId ? await loadUserCorpus(userId) : [];
  const systemPrompt = buildSystemPrompt(userFiles, demoMode);

  const payload = {
    model: provider === "nvidia" ? "meta/llama-3.1-70b-instruct" : "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...sanitized],
    temperature: 0.6,
    max_tokens: 1024,
    stream: true,
  };

  const apiKey = provider === "nvidia" ? process.env.NVIDIA_API_KEY : process.env.GROQ_API_KEY;
  const endpoint = provider === "nvidia" 
    ? "https://integrate.api.nvidia.com/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";

  if (!apiKey) {
    return Response.json({ error: `API key for ${provider} not found.` }, { status: 500 });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `API error from ${provider}: ${text}` }, { status: res.status });
    }

    if (!res.body) throw new Error("No response body");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const reader = res.body!.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(l => l.trim().startsWith("data: "));
            
            for (const line of lines) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices?.[0]?.delta?.content || "";
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n[Stream Error: ${(err as Error).message}]`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return Response.json({ error: `Chat API error: ${(err as Error).message}` }, { status: 500 });
  }
}
