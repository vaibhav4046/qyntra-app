import { auth } from "@/lib/auth";
import { supabaseAdmin, hasSupabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!hasSupabase()) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("files")
      .select("id,source,source_id,source_url,kind,title,summary,content,tags,last_modified,created_at")
      .eq("user_id", session.user.id)
      .eq("id", id)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json({ file: data });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
