export function ConnIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" };

  if (kind === "drive") return (
    <svg {...props}>
      <path d="M7.71 3l-5.5 9.53 2.55 4.4L10.27 7.4 7.71 3z" fill="#FBBC04" />
      <path d="M16.29 3h-8.58l5.5 9.53h8.58L16.29 3z" fill="#4285F4" />
      <path d="M7.71 17.4l5.5-4.87h8.58l-5.5 9.53h-8.58L7.71 17.4z" fill="#34A853" />
    </svg>
  );
  if (kind === "notion") return (
    <svg {...props}>
      <rect width="24" height="24" rx="4" fill="#fff" />
      <path d="M5.3 5.6c.6.5 1.1.5 2.3.4l11-.7c.2 0 .1-.2 0-.3l-1.8-1.3c-.4-.3-.9-.6-1.8-.5l-10.7.8c-.4 0-.5.2-.3.4l1.3 1.2zm.7 2.5v11c0 .6.3.8 1 .8l12-.7c.7 0 .8-.4.8-.9V7.4c0-.4-.2-.7-.6-.6l-12.5.7c-.5 0-.7.3-.7.6z" fill="#000" />
    </svg>
  );
  if (kind === "gmail") return (
    <svg {...props}>
      <path d="M3 18.5V7.5l9 6.5 9-6.5v11c0 .5-.4 1-1 1h-3V13l-5 3.5L7 13v6.5H4c-.5 0-1-.5-1-1z" fill="#EA4335" />
      <path d="M21 6c0-.5-.4-1-1-1h-1l-7 5-7-5H4c-.5 0-1 .5-1 1v1.5l9 6.5 9-6.5V6z" fill="#FBBC04" />
      <path d="M3 7.5l9 6.5V8L7 5H4c-.5 0-1 .5-1 1v1.5z" fill="#34A853" />
      <path d="M21 7.5V6c0-.5-.4-1-1-1h-3l-5 3v6l9-6.5z" fill="#4285F4" />
    </svg>
  );
  if (kind === "desktop") return (
    <svg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" fill="none" stroke="#cdd0d8" strokeWidth="1.5" />
      <rect x="5" y="6" width="14" height="8" rx="0.5" fill="#1c1f24" />
      <rect x="7" y="8" width="4" height="1" fill="#ff5b1f" />
      <rect x="7" y="10" width="6" height="1" fill="#ffc15c" opacity="0.6" />
      <rect x="7" y="12" width="3" height="1" fill="#4cd5c8" opacity="0.6" />
    </svg>
  );
  if (kind === "github") return (
    <svg {...props}>
      <path d="M12 2.2c-5.5 0-10 4.5-10 10 0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1 .8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5 0-5.5-4.5-10-10-10z" fill="#fff" />
    </svg>
  );
  if (kind === "arxiv") return (
    <svg {...props}>
      <rect width="24" height="24" rx="3" fill="#B31B1B" />
      <text x="12" y="16" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#fff" letterSpacing="-0.5">arXiv</text>
    </svg>
  );
  return (
    <svg {...props}>
      <rect width="24" height="24" rx="4" fill="#1c1f24" />
      <circle cx="12" cy="12" r="3" fill="#ff5b1f" />
    </svg>
  );
}
