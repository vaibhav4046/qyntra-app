import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Qyntra — Personal Knowledge OS · Wikithon ’26 Finalist";

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
            "radial-gradient(circle at 78% 28%, rgba(255,91,31,0.45), transparent 55%), linear-gradient(135deg, #050608 0%, #0c0d10 100%)",
          color: "#f4f4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, letterSpacing: 4, textTransform: "uppercase", fontSize: 18, color: "#a1a1aa" }}>
          <div style={{ width: 14, height: 14, background: "#ff5b1f", borderRadius: 3 }} />
          Qyntra · Personal Knowledge OS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 92, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2, maxWidth: 1000 }}>
            Your own <span style={{ color: "#ff5b1f" }}>Wikipedia.</span>
          </div>
          <div style={{ fontSize: 92, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2 }}>memory.</div>
          <div style={{ fontSize: 28, color: "#a1a1aa", maxWidth: 920, marginTop: 16, lineHeight: 1.4 }}>
            Compiled from your Notion, Drive, Gmail, GitHub and desktop. Cited claims, 3D galaxy view, grounded chat.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ padding: "8px 14px", border: "1px solid rgba(255,91,31,0.45)", borderRadius: 999, fontSize: 18, color: "#ffc15c", letterSpacing: 2, textTransform: "uppercase" }}>
              Wikithon ’26 Finalist
            </span>
            <span style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, fontSize: 18, color: "#a1a1aa", letterSpacing: 2, textTransform: "uppercase" }}>
              qyntra-app.vercel.app
            </span>
          </div>
          <div style={{ fontSize: 18, color: "#71717a", letterSpacing: 2, textTransform: "uppercase" }}>Built by Vaibhav</div>
        </div>
      </div>
    ),
    size,
  );
}
