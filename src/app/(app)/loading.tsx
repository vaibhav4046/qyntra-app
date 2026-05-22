/**
 * Generic loading skeleton for any (app)/* surface that hasn't yet hydrated.
 * Keep it dependency-free so it renders instantly.
 */
export default function AppLoading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(255,91,31,0.2)",
            borderTopColor: "#ff5b1f",
            borderRadius: "50%",
            animation: "qyntra-spin 0.9s linear infinite",
          }}
        />
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#a1a1aa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading surface…
        </span>
        <style>{`@keyframes qyntra-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
