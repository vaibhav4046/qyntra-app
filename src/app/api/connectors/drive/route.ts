import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || session.provider !== "google") {
    return Response.json({ files: [], error: "Sign in with Google first." }, { status: 401 });
  }

  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,iconLink,webViewLink)",
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );

  if (!res.ok) {
    return Response.json({ files: [], error: `Drive API: ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  return Response.json({ files: data.files || [] });
}
