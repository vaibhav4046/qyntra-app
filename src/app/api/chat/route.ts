import { NODES } from "@/lib/data";
import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

interface UserFile {
  kind: string;
  title: string;
  summary?: string;
  content?: string;
  source?: string;
  source_url?: string;
  source_id?: string;
}

/** Approximate token count for English text (very rough). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate content to fit within a token budget, keeping the most important parts. */
function truncateContent(content: string | undefined | null, maxTokens: number): string {
  if (!content) return "";
  const estimated = estimateTokens(content);
  if (estimated <= maxTokens) return content;
  // Keep first portion (usually has the most important info)
  const maxChars = maxTokens * 4;
  return content.slice(0, maxChars) + "\n[…truncated]";
}

async function loadUserCorpus(userId: string, limit = 60): Promise<{ files: UserFile[]; totalContentChars: number }> {
  if (!hasSupabase() || !userId) return { files: [], totalContentChars: 0 };
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("files")
      .select("kind,title,summary,content,source,source_url,source_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { files: [], totalContentChars: 0 };
    const files = (data || []) as UserFile[];
    const totalContentChars = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);
    return { files, totalContentChars };
  } catch {
    return { files: [], totalContentChars: 0 };
  }
}

function buildSystemPrompt(userFiles: UserFile[], demoMode: boolean): { prompt: string; corpusTokens: number } {
  const base = `You are Qyntra — a personal knowledge OS compiled from the user's own files.

Rules:
- Answer grounded EXCLUSIVELY on the corpus below. If the answer is not in the corpus, say so directly. Never invent file titles or facts.
- Cite inline with [1], [2] and list numbered references at the end.
- Sharp, terse, no fluff. Markdown sparingly.
- When quoting from files, include the exact quote and the source.
- End with a "Predicted follow-ups:" section with 2-3 specific next questions.
- If asked about a specific file, search the corpus for that file title and answer based on its content.`;

  if (demoMode || userFiles.length === 0) {
    const corpus = NODES.map((n, i) => `[${i + 1}] [${n.kind}] ${n.label} — ${n.summary}`).join("\n");
    const prompt = `${base}\n\nCORPUS (sample fallback — ${NODES.length} nodes):\n${corpus}\n\nMODE: ${demoMode ? "DEMO. Using sample data." : "EMPTY. User has no synced files yet."}`;
    return { prompt, corpusTokens: estimateTokens(prompt) };
  }

  // Build corpus with rich content. Prioritize: title + summary + truncated content.
  // Budget: keep total corpus under ~6000 tokens so we leave room for the conversation.
  const perFileContentBudget = 200; // tokens per file for content
  let corpusLines: string[] = [];
  let contentCharsUsed = 0;

  for (const [i, f] of userFiles.entries()) {
    const truncated = truncateContent(f.content, perFileContentBudget);
    contentCharsUsed += truncated.length;
    const line = `[${i + 1}] [${f.kind}] ${f.title}${f.summary ? " — " + f.summary : ""}${truncated ? "\nContent: " + truncated : ""}${f.source ? " (from " + f.source + ")" : ""}`;
    corpusLines.push(line);
  }

  const corpus = corpusLines.join("\n\n");
  const prompt = `${base}\n\nMODE: LIVE — answers grounded on the user's real synced files only.\n\nCORPUS (${userFiles.length} files):\n${corpus}`;
  return { prompt, corpusTokens: estimateTokens(prompt) };
}

export async function POST(req: Request) {
  const startTime = Date.now();

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

  const { messages, provider = "groq", demoMode = false } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages array required" }, { status: 400 });
  }

  // Sanitize messages
  const sanitized = messages
    .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
    .slice(-20);

  // Load user corpus from Supabase. Real files ALWAYS win over demoMode flag —
  // if user ingested anything, ground on it. demoMode only matters when corpus empty.
  const userId = (session.user as { id?: string }).id;
  const corpus = userId ? await loadUserCorpus(userId) : { files: [], totalContentChars: 0 };
  const { files: userFiles, totalContentChars } = corpus;
  const effectiveDemoMode = demoMode && userFiles.length === 0;
  const { prompt: systemPrompt, corpusTokens } = buildSystemPrompt(userFiles, effectiveDemoMode);

  const conversationText = sanitized.map((m: { content: string }) => m.content).join(" ");
  const conversationTokens = estimateTokens(conversationText);
  const systemTokens = corpusTokens + estimateTokens(systemPrompt);
  const totalInputTokens = systemTokens + conversationTokens;

  // Cap max_tokens dynamically based on context size
  const maxTokens = Math.min(2048, 8192 - totalInputTokens);
  if (maxTokens < 256) {
    return Response.json(
      { error: "Context window full. Try a shorter question or clear the conversation." },
      { status: 413 }
    );
  }

  const payload = {
    model: provider === "nvidia" ? "meta/llama-3.1-70b-instruct" : "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...sanitized],
    temperature: 0.4,
    max_tokens: maxTokens,
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
    let outputTokens = 0;

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
                if (delta) {
                  outputTokens += estimateTokens(delta);
                  controller.enqueue(encoder.encode(delta));
                }
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
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Input-Tokens": String(totalInputTokens),
        "X-Output-Tokens": String(outputTokens),
        "X-Provider": provider,
        "X-Corpus-Files": String(userFiles.length),
        "X-Corpus-Chars": String(totalContentChars),
      },
    });
  } catch (err) {
    return Response.json({ error: `Chat API error: ${(err as Error).message}` }, { status: 500 });
  }
}
