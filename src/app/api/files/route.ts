import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ files: [], error: "Unauthenticated" }, { status: 401 });
  }
  if (!hasSupabase()) {
    return Response.json({ files: [] });
  }
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

  try {
    const sb = supabaseAdmin();
    let q = sb
      .from("files")
      .select("id,source,source_id,source_url,kind,title,summary,tags,last_modified,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (source) q = q.eq("source", source);
    const { data, error } = await q;
    if (error) return Response.json({ files: [], error: error.message }, { status: 500 });
    return Response.json({ files: data || [] });
  } catch (err) {
    return Response.json({ files: [], error: (err as Error).message }, { status: 500 });
  }
}

function detectKind(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "PDF";
  if (ext === "md" || ext === "markdown") return "DOC";
  if (ext === "txt" || ext === "text") return "DOC";
  if (ext === "docx") return "DOC";
  if (ext === "csv" || ext === "json" || ext === "xml") return "DOC";
  return "DOC";
}

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  // Plain text files
  if (["txt", "md", "csv", "json", "xml", "text", "markdown", "js", "ts", "tsx", "jsx", "py", "html", "css", "sql"].includes(ext)) {
    return buffer.toString("utf-8").slice(0, 50000);
  }

  // PDF — try pdf-parse if installed
  if (ext === "pdf") {
    try {
      const { default: pdfParse } = await import("pdf-parse") as any;
      const result = await pdfParse(buffer);
      return (result.text || "").slice(0, 50000);
    } catch {
      return "";
    }
  }

  // DOCX — try mammoth if installed
  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth") as any;
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || "").slice(0, 50000);
    } catch {
      return "";
    }
  }

  return "";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!hasSupabase()) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name || "untitled";
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractText(buffer, filename);
    const kind = detectKind(filename);

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("files")
      .insert({
        user_id: session.user.id,
        source: "desktop",
        source_id: filename,
        title: filename,
        summary: content ? content.slice(0, 300) + (content.length > 300 ? "…" : "") : undefined,
        content: content || undefined,
        kind,
        tags: ["desktop", kind.toLowerCase()],
      })
      .select("id")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, id: data?.id, title: filename, kind, chars: content.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
