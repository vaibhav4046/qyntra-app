import { NODES } from "@/lib/data";
import { auth } from "@/lib/auth";

const SYSTEM_PROMPT = `You are Qyntra — a personal knowledge OS that has compiled the user's private wiki from their Drive, Notion, Gmail, Slack, LinkedIn, GitHub, arXiv and desktop files.

You answer grounded on the user's own corpus. When you make a claim, cite it inline with [1], [2] etc and list sources at the end as numbered references.

Your tone: sharp, terse, no fluff. Use markdown sparingly. Predict what the user wants next and surface 2-3 follow-up questions at the end inside a section called "Predicted follow-ups:".

The user's wiki currently contains these pages and entities:
${NODES.map((n) => `- [${n.kind}] ${n.label} — ${n.summary}`).join("\n")}

The user's strongest predicted-next links right now: GraphRAG (92%), Cross-Encoder Reranking (81%), Hybrid retrieval claim (74%).
`;

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

  const { messages, provider = "nvidia" } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages array required" }, { status: 400 });
  }

  // Sanitize messages
  const sanitized = messages
    .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
    .slice(-20);

  const payload = {
    model: provider === "nvidia" ? "meta/llama-3.1-70b-instruct" : "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...sanitized],
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
