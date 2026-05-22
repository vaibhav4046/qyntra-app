import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Generate a Wikipedia article from your own files — Qyntra";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
          background:
            "radial-gradient(circle at 18% 72%, rgba(255,193,92,0.35), transparent 55%), linear-gradient(135deg, #050608 0%, #0c0d10 100%)",
          color: "#f4f4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, letterSpacing: 4, textTransform: "uppercase", fontSize: 18, color: "#a1a1aa" }}>
          <div style={{ width: 14, height: 14, background: "#ffc15c", borderRadius: 3 }} />
          Qyntra · /wiki article auto-generator
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2, maxWidth: 1040 }}>
            Write me a <span style={{ color: "#ffc15c" }}>Wikipedia page</span> on…
          </div>
          <div style={{ fontSize: 26, color: "#a1a1aa", maxWidth: 980, marginTop: 12, lineHeight: 1.4 }}>
            Type any topic. Qyntra pulls cited snippets from your sources, assembles an encyclopedia entry with infobox,
            sticky TOC, references and a one-click print/PDF. Powered by Groq Llama 3.3 70B.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ padding: "8px 14px", border: "1px solid rgba(255,193,92,0.45)", borderRadius: 999, fontSize: 18, color: "#ffc15c", letterSpacing: 2, textTransform: "uppercase" }}>
              Cited inline
            </span>
            <span style={{ padding: "8px 14px", border: "1px solid rgba(255,91,31,0.45)", borderRadius: 999, fontSize: 18, color: "#ff5b1f", letterSpacing: 2, textTransform: "uppercase" }}>
              Sticky TOC
            </span>
            <span style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, fontSize: 18, color: "#a1a1aa", letterSpacing: 2, textTransform: "uppercase" }}>
              Print / PDF
            </span>
          </div>
          <div style={{ fontSize: 18, color: "#71717a", letterSpacing: 2, textTransform: "uppercase" }}>qyntra-app.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
