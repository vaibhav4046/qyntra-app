/**
 * Image OCR via Groq vision (Llama 3.2 11B / 90B).
 * POST { image: dataUrl, prompt?: string } → { text }
 *
 * Used by /ask when a user pastes / drops an image. Returns extracted text and
 * a 1-line caption so the chat input can prepend it before sending.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const VISION_MODEL = "llama-3.2-11b-vision-preview";

export async function POST(req: Request) {
  let body: { image?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const image = body.image?.trim();
  if (!image || !image.startsWith("data:image/")) {
    return Response.json({ error: "image must be a data URL (data:image/...)" }, { status: 400 });
  }
  if (image.length > 5_000_000) {
    return Response.json({ error: "image too large (max ~5 MB base64)" }, { status: 413 });
  }

  const userKey = req.headers.get("x-qyntra-api-key") || "";
  const apiKey = userKey || process.env.GROQ_API_KEY || "";
  if (!apiKey) return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  const userPrompt =
    body.prompt?.trim() ||
    "Extract any visible text in this image verbatim. Then on a new line starting with `Caption:`, give a one-sentence caption of what the image shows.";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `Groq vision error: ${res.status} ${text.slice(0, 300)}` }, { status: 502 });
    }
    const json = await res.json();
    const out = (json.choices?.[0]?.message?.content || "").toString();
    return Response.json({ ok: true, text: out });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
