export type NodeType = "page" | "doc" | "entity" | "claim";

export interface QNode {
  id: string;
  type: NodeType;
  label: string;
  size: "sm" | "md" | "lg";
  x: number;
  y: number;
  z?: number;
  summary: string;
  source?: string;
  sourceUrl?: string;
  lastSync?: string;
  preview?: string;
  tags?: string[];
  kind: string;
}

export interface QEdge {
  from: string;
  to: string;
  rel: string;
}

export interface QPrediction {
  to: string;
  conf: number;
  reason: string;
}

export interface QConnector {
  id: string;
  name: string;
  icon: string;
  count: number;
  on: boolean;
  color: string;
  provider?: "google" | "notion" | "github" | "local";
}

export const NODES: QNode[] = [
  { id: "rag", type: "page", label: "RAG Pipelines", size: "lg", x: 0.5, y: 0.5, z: 0, summary: "Retrieval-augmented generation patterns synthesizing your vector store, graph traversal and reranking.", source: "Notion", sourceUrl: "https://www.notion.so/RAG-Pipelines-001", lastSync: "2m ago", preview: "## What it is\nRAG is the architectural choice to let the model not know things. Instead of stuffing knowledge into weights, you keep it in a store…", tags: ["ai", "retrieval"], kind: "PAGE" },
  { id: "vec", type: "page", label: "Vector Databases", size: "md", x: 0.3, y: 0.36, z: 0.2, summary: "pgvector, Pinecone, Qdrant, Weaviate — when to pick which.", source: "Notion", sourceUrl: "https://www.notion.so/Vector-Databases-002", lastSync: "8m ago", preview: "pgvector beats Pinecone on cold-start latency below 10M vectors. Above that, Pinecone's hybrid index wins.", tags: ["db"], kind: "PAGE" },
  { id: "embed", type: "page", label: "Embedding Models", size: "md", x: 0.18, y: 0.54, z: -0.1, summary: "OpenAI v3-large vs Voyage 3 vs nomic — tradeoffs.", source: "arXiv", sourceUrl: "https://arxiv.org/abs/2404.embed", lastSync: "1h ago", preview: "Voyage 3 (1024d) beats text-embedding-3-large on legal+medical by 7.4 nDCG. Loses on general code retrieval.", tags: ["ai"], kind: "PAGE" },
  { id: "rerank", type: "page", label: "Cross-Encoder Reranking", size: "sm", x: 0.34, y: 0.66, z: 0.3, summary: "When BM25 + dense fails, rerank top-K with cross-encoder.", source: "Notion", sourceUrl: "https://www.notion.so/Cross-Encoder-Reranking-003", lastSync: "12m ago", tags: ["retrieval"], kind: "PAGE" },
  { id: "graphRag", type: "page", label: "GraphRAG", size: "md", x: 0.66, y: 0.36, z: -0.2, summary: "Microsoft research on knowledge-graph-guided generation.", source: "arXiv", sourceUrl: "https://arxiv.org/abs/2404.16130", lastSync: "30m ago", preview: "Microsoft's GraphRAG anchors retrieval on extracted entities & relations. Cuts unsupported claims 38% on community-level questions.", tags: ["ai"], kind: "PAGE" },
  { id: "agents", type: "page", label: "Agent Memory", size: "md", x: 0.78, y: 0.52, z: 0.15, summary: "Working, semantic, episodic memory split.", source: "Notion", sourceUrl: "https://www.notion.so/Agent-Memory-004", lastSync: "4m ago", tags: ["agents"], kind: "PAGE" },
  { id: "standup", type: "doc", label: "Standup Oct 24", size: "sm", x: 0.5, y: 0.18, z: 0.4, summary: "Daily standup notes.", source: "Drive", sourceUrl: "https://drive.google.com/file/d/standup-oct24", lastSync: "yesterday", preview: "Blockers: HydraDB auth flow, schema decisions on graph edges.", tags: ["standup"], kind: "DOC" },
  { id: "roadmap", type: "doc", label: "Q4 Roadmap", size: "md", x: 0.62, y: 0.2, z: -0.3, summary: "Themes: ingestion, reasoning, publishing.", source: "Drive", sourceUrl: "https://drive.google.com/file/d/q4-roadmap", lastSync: "2h ago", tags: ["planning"], kind: "DOC" },
  { id: "hackathon", type: "doc", label: "WikiThon Brief", size: "sm", x: 0.42, y: 0.08, z: 0.1, summary: "Build a personalized wiki on private data.", source: "Gmail", sourceUrl: "https://mail.google.com/mail/u/0/#inbox/wikithon", lastSync: "3d ago", tags: ["hackathon"], kind: "DOC" },
  { id: "resume", type: "doc", label: "Resume V. Lalwa", size: "sm", x: 0.86, y: 0.3, z: 0.25, summary: "Desktop-imported profile.", source: "Desktop", lastSync: "1w ago", tags: ["profile"], kind: "DOC" },
  { id: "inbox", type: "doc", label: "Inbox digest", size: "sm", x: 0.88, y: 0.74, z: -0.15, summary: "14 newsletters parsed.", source: "Gmail", sourceUrl: "https://mail.google.com/mail/u/0/", lastSync: "1h ago", tags: ["inbox"], kind: "DOC" },
  { id: "eVec", type: "entity", label: "pgvector", size: "sm", x: 0.16, y: 0.3, z: 0.35, summary: "Postgres extension for vector similarity.", kind: "ENTITY", tags: ["db"] },
  { id: "ePine", type: "entity", label: "Pinecone", size: "sm", x: 0.1, y: 0.46, z: -0.4, summary: "Managed vector DB.", kind: "ENTITY", tags: ["db"] },
  { id: "eOpen", type: "entity", label: "OpenAI text-embed-3", size: "sm", x: 0.06, y: 0.62, z: 0.2, summary: "OpenAI embeddings (1536/3072d).", kind: "ENTITY", tags: ["ai"] },
  { id: "eHyDE", type: "entity", label: "HyDE", size: "sm", x: 0.4, y: 0.78, z: -0.25, summary: "Hypothetical document embedding.", kind: "ENTITY", tags: ["retrieval"] },
  { id: "eMRR", type: "entity", label: "MRR / nDCG", size: "sm", x: 0.22, y: 0.78, z: 0.4, summary: "Eval metrics.", kind: "ENTITY", tags: ["eval"] },
  { id: "eMS", type: "entity", label: "Microsoft Research", size: "sm", x: 0.74, y: 0.22, z: 0.3, summary: "Published GraphRAG.", kind: "ENTITY", tags: ["org"] },
  { id: "cl1", type: "claim", label: "Hybrid retrieval beats dense-only by 18%", size: "sm", x: 0.5, y: 0.78, z: -0.1, summary: "Across 6 internal eval sets.", kind: "CLAIM", tags: ["eval"] },
  { id: "cl2", type: "claim", label: "Voyage 3 wins on legal text", size: "sm", x: 0.1, y: 0.78, z: 0.35, summary: "Voyage-3-large beat openai-3-large by 7.4 nDCG.", kind: "CLAIM", tags: ["embed"] },
  { id: "cl3", type: "claim", label: "GraphRAG cuts hallucinations", size: "sm", x: 0.66, y: 0.78, z: -0.35, summary: "38% fewer unsupported claims.", kind: "CLAIM", tags: ["safety"] },
];

export const EDGES: QEdge[] = [
  { from: "rag", to: "vec", rel: "uses" },
  { from: "rag", to: "embed", rel: "uses" },
  { from: "rag", to: "rerank", rel: "uses" },
  { from: "rag", to: "graphRag", rel: "related" },
  { from: "rag", to: "agents", rel: "related" },
  { from: "vec", to: "eVec", rel: "example" },
  { from: "vec", to: "ePine", rel: "example" },
  { from: "embed", to: "eOpen", rel: "example" },
  { from: "embed", to: "cl2", rel: "evidence" },
  { from: "rerank", to: "eHyDE", rel: "related" },
  { from: "rerank", to: "eMRR", rel: "evaluated_by" },
  { from: "rag", to: "cl1", rel: "evidence" },
  { from: "graphRag", to: "cl3", rel: "evidence" },
  { from: "graphRag", to: "eMS", rel: "published_by" },
  { from: "standup", to: "rag", rel: "mentions" },
  { from: "roadmap", to: "rag", rel: "plans" },
  { from: "hackathon", to: "roadmap", rel: "context" },
  { from: "resume", to: "rag", rel: "authored" },
  { from: "inbox", to: "embed", rel: "digest" },
  { from: "agents", to: "rerank", rel: "related" },
];

export const PREDICTIONS: Record<string, QPrediction[]> = {
  rag: [
    { to: "graphRag", conf: 0.92, reason: "3 papers opened this week" },
    { to: "rerank", conf: 0.81, reason: "Sequential reading thread" },
    { to: "cl1", conf: 0.74, reason: "Cited but not verified" },
  ],
  vec: [
    { to: "embed", conf: 0.88, reason: "Common downstream concept" },
    { to: "eVec", conf: 0.71, reason: "Bookmarked example" },
  ],
  embed: [
    { to: "cl2", conf: 0.86, reason: "Direct claim from this node" },
    { to: "eOpen", conf: 0.7, reason: "Most cited entity" },
  ],
  graphRag: [
    { to: "cl3", conf: 0.9, reason: "Backing evidence" },
    { to: "eMS", conf: 0.66, reason: "Source organization" },
    { to: "agents", conf: 0.62, reason: "Concept neighborhood" },
  ],
};

export const TYPE_COLOR: Record<NodeType, string> = {
  page: "#ff5b1f",
  doc: "#ffc15c",
  entity: "#a87bff",
  claim: "#4cd5c8",
};

export const CONNECTORS: QConnector[] = [
  { id: "drive", name: "Google Drive", icon: "drive", count: 142, on: true, color: "#4285F4", provider: "google" },
  { id: "notion", name: "Notion", icon: "notion", count: 88, on: true, color: "#ffffff", provider: "notion" },
  { id: "gmail", name: "Gmail", icon: "gmail", count: 312, on: true, color: "#EA4335", provider: "google" },
  { id: "desktop", name: "Desktop", icon: "desktop", count: 23, on: true, color: "#cdd0d8", provider: "local" },
  { id: "github", name: "GitHub", icon: "github", count: 41, on: true, color: "#ffffff", provider: "github" },
  { id: "arxiv", name: "arXiv", icon: "arxiv", count: 9, on: true, color: "#B31B1B" },
];

export const ACTIVITY = [
  { color: "ember", t: "2m ago", text: "Compiled RAG Pipelines from 7 sources — 23 new claims, 8 verified" },
  { color: "gold", t: "14m ago", text: "Contradiction flagged on Embedding Models — Voyage vs OpenAI" },
  { color: "teal", t: "1h ago", text: "Imported 42 GitHub issues and gists" },
  { color: "violet", t: "3h ago", text: "New entity linked: HyDE ⇄ Cross-Encoder Reranking" },
  { color: "ember", t: "yesterday", text: "Published draft of Agent Memory to private wiki" },
];

export const FILES_SEED = [
  { id: "rag", kind: "PAGE", title: "RAG Pipelines", sub: "Retrieval patterns synthesizing your store, graph and reranking.", tags: ["ai", "retrieval"], source: "Notion" },
  { id: "graphRag", kind: "PAGE", title: "GraphRAG", sub: "Microsoft research on knowledge-graph-guided generation.", tags: ["ai", "graph"], source: "arXiv" },
  { id: "vec", kind: "PAGE", title: "Vector Databases", sub: "pgvector, Pinecone, Qdrant, Weaviate — when to pick which.", tags: ["db"], source: "Notion" },
  { id: "roadmap", kind: "DOC", title: "Q4 Roadmap", sub: "Ingestion, reasoning, publishing, predictive nav.", tags: ["planning"], source: "Drive" },
  { id: "acme", kind: "EMAIL", title: "Customer call · Acme Corp", sub: "Q&A on hybrid retrieval rollout timeline.", tags: ["call", "sales"], source: "Gmail" },
  { id: "spec", kind: "DOC", title: "Spec · Predictive rail v2", sub: "Design doc for next-page prediction confidence.", tags: ["design"], source: "Notion" },
  { id: "deck", kind: "SLIDES", title: "Hackathon pitch deck", sub: "Slides for WikiThon final demo.", tags: ["hackathon"], source: "Drive" },
  { id: "resume", kind: "PROFILE", title: "Resume - V. Lalwa", sub: "Desktop-imported profile, regenerated weekly.", tags: ["profile"], source: "Desktop" },
  { id: "graphPdf", kind: "PDF", title: "arXiv · GraphRAG paper", sub: "Microsoft Research, 2404.xxxx", tags: ["paper"], source: "arXiv" },
  { id: "wikithon", kind: "ISSUE", title: "GitHub #wikithon", sub: "42 issues this week, 3 contradictions flagged.", tags: ["team"], source: "GitHub" },
  { id: "pgvector", kind: "ENTITY", title: "pgvector", sub: "Postgres extension for vector similarity.", tags: ["db"], source: "Wiki" },
  { id: "hybrid", kind: "CLAIM", title: "Hybrid retrieval beats dense-only by 18%", sub: "Across 6 internal eval sets.", tags: ["eval"], source: "Claim" },
];
