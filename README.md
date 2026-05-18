# Qyntra — Personal Knowledge OS

> Your own Wikipedia, compiled from your files.

**Live Demo:** [qyntra-app.vercel.app](https://qyntra-app.vercel.app)

**Pitch Deck:** Deploy `presentation/` folder to Vercel for the Wikithon '26 presentation

---

## What It Is

Qyntra turns scattered knowledge across Notion, Drive, Gmail, GitHub and your desktop into a single living wiki — your own private Wikipedia. Auto-generated entity pages with cited claims, a 3D galaxy you can navigate, hybrid (memory + web) chat grounded on your real corpus, and predictive next-page navigation that surfaces forgotten knowledge.

**Wikithon '26 Build** — Built in one day with AI coding assistants as pair programmers.

---

## Live URL

🔗 **https://qyntra-app.vercel.app**

---

## One-Liner

Your own Wikipedia, compiled from your files.

---

## The Problem

- Drive folders untouched for months
- Important emails lost in inbox noise
- GitHub repos starred and forgotten
- Desktop files scattered, unsearchable
- No single place to ask questions across all your knowledge

## The Solution

One private wiki that ingests from everywhere and lets you talk to your own knowledge.

**Flow:** Connect sources → Auto-sync → Ask questions → Get cited answers from your real files.

---

## 7 Surfaces

| Surface | Path | What It Does |
|---------|------|--------------|
| **Dashboard** | `/home` | Time-aware greeting, live stats, connector health |
| **Wiki** | `/wiki` | Featured article, Did You Know, stats, categories |
| **3D Galaxy** | `/map-3d` | Interactive knowledge graph, clickable nodes, fly-through |
| **Ask** | `/ask` | Grounded chat with corpus sidebar, streaming answers, token counters |
| **Read** | `/read` | Full-text article viewer, TOC, infobox, predicted next page |
| **Files** | `/files` | Searchable file browser, drag-drop, autonomous desktop ingest |
| **Sources** | `/sources` | OAuth connectors, toggle on/off, sync on demand |

---

## Key Differentiators

1. **Real cited memory** — Every claim links to source file `[1]`, `[2]`. No hallucinations.
2. **Hybrid auth** — Passwordless magic-link OR Google/Notion/GitHub OAuth
3. **Local-first ingestion** — Desktop folder via File System Access API + fallback for all browsers
4. **Demo mode** — One click loads sample workspace for judges. No account needed.
5. **Auto-ingest on OAuth** — Files pulled moments after consent
6. **Real-time sync** — Background polling every 5 minutes

---

## Tech Stack

- **Next.js 16** App Router · **React 19** · **TypeScript**
- **Tailwind CSS 4** · **Framer Motion** · **Zustand**
- **Auth.js v5** — Email magic-link + Google/Notion/GitHub OAuth
- **Supabase** — Postgres with RLS
- **Groq** — Llama 3.3 70B streaming
- **Three.js / React Three Fiber** — 3D galaxy
- **Vercel** — Deployment

**AI Tools Used:** Claude Code · OpenCode · Gemini · Jules

---

## Architecture

```
User → Next.js App (React 19 + TypeScript)
       ├── Auth.js (magic-link / OAuth)
       ├── API Routes (/api/ingest, /api/chat)
       │   ├── Ingest Engine (Drive/Gmail/GitHub/Notion/Desktop)
       │   └── Groq LLM (Llama 3.3 70B, grounded on corpus)
       └── Supabase (profiles, files, connectors)
```

### Data Flow

1. **Ingest** — Source APIs → Extract text → Transform → Atomic insert to Supabase
2. **Chat** — Load corpus → Budget tokens → Build prompt → Groq LLM → Stream response with citations
3. **Read** — Fetch file from DB → Render full content with metadata

---

## Database Schema

### `profiles`

```sql
id          uuid PRIMARY KEY    -- user identifier (email hash or OAuth sub)
email       text                -- user email
name        text                -- display name
provider    text                -- auth provider: google, github, notion, email
image       text                -- avatar URL
created_at  timestamptz
```

Stores user identities from magic-link or OAuth sign-in.

### `files`

```sql
id            uuid PRIMARY KEY
user_id       uuid REFERENCES profiles(id)
source        text                -- drive, gmail, github, notion, desktop
source_id     text                -- provider-specific ID
source_url    text                -- link back to original
kind          text                -- PAGE, DOC, PDF, EMAIL, REPO, GIST, etc.
title         text
summary       text
content       text                -- full extracted text
user_content  text                -- editable notes
tags          text[]
last_modified timestamptz
created_at    timestamptz
```

Core knowledge table. Atomic delete-then-insert per source prevents duplicates. `content` holds extracted text from PDFs, DOCX, code files, emails. `user_content` lets users add private notes.

### `connectors`

```sql
user_id       uuid
provider      text
is_on         boolean
item_count    integer
last_sync     timestamptz
access_token  text                -- OAuth token for background sync
refresh_token text
expires_at    timestamptz
PRIMARY KEY (user_id, provider)
```

Tracks which sources are connected, when they last synced, and stores OAuth tokens for background ingestion.

### `passwords` (magic-link auth)

```sql
email         text PRIMARY KEY
password_hash text                -- bcrypt hashed
magic_token   text                -- one-time sign-in token
magic_expires timestamptz
created_at    timestamptz
updated_at    timestamptz
```

Passwordless email authentication with bcrypt-hashed passwords and time-bounded magic tokens.

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js handlers |
| `/api/auth/providers` | GET | List configured OAuth providers |
| `/api/signup` | POST | Email sign-up / magic-link generation |
| `/api/ingest/[provider]` | POST | Ingest from specific source (drive, gmail, github, notion) |
| `/api/ingest/auto` | POST | Auto-ingest all connected sources |
| `/api/chat` | POST | Stream LLM response grounded on user corpus |
| `/api/files` | GET/POST | List files / upload desktop file |
| `/api/files/[id]` | GET | Get full file content by ID |
| `/api/profile` | GET/POST | Get/update user profile |
| `/api/cron/resync` | GET | Background sync for all users |
| `/api/connectors/drive\|gmail\|notion` | GET | Browse source APIs directly |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

```env
# Auth
AUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://qyntra-app.vercel.app

# OAuth (optional - email-only works without these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=

# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
GROQ_API_KEY=
NVIDIA_API_KEY=
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

---

## Deploy

### App
```bash
vercel --prod
```

### Presentation (separate link)
Deploy the `presentation/` folder as a new Vercel project for the pitch deck.

---

## File Structure

```
qyntra-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/              # Protected routes (ask, files, home, etc.)
│   │   ├── api/                # API routes (auth, ingest, chat, files)
│   │   ├── signin/             # Auth pages
│   │   └── onboarding/         # First-time setup flow
│   ├── components/             # React components (shell, chat, 3D map, etc.)
│   └── lib/                    # Business logic
│       ├── auth.ts             # Auth.js configuration
│       ├── ingest.ts           # Ingestion engine for all sources
│       ├── session-ingest.ts   # OAuth token management
│       ├── supabase.ts         # DB client + ensureProfile helper
│       └── token-refresh.ts    # Google token refresh
├── presentation/             # HTML pitch deck (deploy separately)
├── supabase/                 # Schema files
│   ├── schema.sql
│   ├── patch-001.sql
│   └── patch-002-passwords.sql
└── vercel.json               # Vercel deployment config
```

---

## Demo Flow (90 seconds)

1. **Sign in** — Email magic link (no passwords, no OAuth setup)
2. **Connect** — Pick a desktop folder, or OAuth with Google/GitHub/Notion
3. **Explore** — Files → Ask → Read → Galaxy. All your knowledge, alive.
<img width="1880" height="901" alt="image" src="https://github.com/user-attachments/assets/d9808b24-4937-4bba-8e4e-329455bf5f23" />


---

## License

MIT — Built for Wikithon '26

---

**Built with:** Next.js 16 · React 19 · TypeScript · Tailwind · Auth.js · Supabase · Groq Llama 3.3 70B · Three.js · Vercel

**AI pair programmers:** Claude Code · OpenCode · Gemini · Jules
