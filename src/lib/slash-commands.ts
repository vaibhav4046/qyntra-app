/**
 * Slash commands for /ask composer.
 * - When input starts with `/`, we show a dropdown of matching commands.
 * - On selection, the command's preamble replaces the slash trigger and the
 *   user keeps typing the argument. The actual prompt is composed at send time.
 */

export interface SlashCommand {
  cmd: string;
  label: string;
  hint: string;
  /** Prompt prefix prepended to user-supplied argument when sending. */
  buildPrompt: (arg: string) => string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: "/summarize",
    label: "Summarize",
    hint: "Compress a topic or doc into a tight summary",
    buildPrompt: (arg) =>
      `Summarize the following from my wiki in 5-7 bullet points. Cite every claim inline with [n]. Be concise.\n\nTopic: ${arg || "(use the most recent files)"}`,
  },
  {
    cmd: "/todo",
    label: "Extract todos",
    hint: "Pull action items from a doc or thread",
    buildPrompt: (arg) =>
      `Extract action items / TODOs from my wiki on the topic below. Output as a markdown checklist. Cite each item with the source filename in brackets.\n\nTopic: ${arg || "(use the most recently mentioned doc)"}`,
  },
  {
    cmd: "/draft",
    label: "Draft a message",
    hint: "Draft an email / reply grounded in your wiki",
    buildPrompt: (arg) =>
      `Draft a short, well-structured message based on the brief below. Ground content in my wiki and cite the supporting source files inline.\n\nBrief: ${arg || "(use the last few messages as context)"}`,
  },
  {
    cmd: "/compare",
    label: "Compare two things",
    hint: "Side-by-side comparison with cited claims",
    buildPrompt: (arg) =>
      `Compare the two things below using only my wiki. Output as a markdown table (Aspect | A | B | Source). End with a one-line takeaway.\n\nInput: ${arg || "Voyage 3 vs text-embedding-3-large"}`,
  },
  {
    cmd: "/timeline",
    label: "Build a timeline",
    hint: "Chronological events grounded in your files",
    buildPrompt: (arg) =>
      `Build a chronological timeline from my wiki for the topic below. Output as a bullet list "YYYY-MM-DD — event [source]". If dates are uncertain, mark them with ~.\n\nTopic: ${arg || "my recent activity"}`,
  },
];

export function matchCommands(input: string): SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const head = input.split(/\s+/)[0].toLowerCase();
  if (head === "/") return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(head));
}

export function tryConsumeSlash(input: string): { command: SlashCommand | null; arg: string } {
  const m = input.match(/^(\/\w+)(?:\s+([\s\S]*))?$/);
  if (!m) return { command: null, arg: input };
  const cmd = SLASH_COMMANDS.find((c) => c.cmd === m[1].toLowerCase());
  if (!cmd) return { command: null, arg: input };
  return { command: cmd, arg: (m[2] || "").trim() };
}
