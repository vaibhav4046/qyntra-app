export function ConnIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" };

  if (kind === "google") return (
    <svg {...props} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
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
