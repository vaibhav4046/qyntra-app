"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  cycle?: boolean;
  cycleInterval?: number;
}

export function SplitText({ text, delay = 0, stagger = 30, className = "", cycle = false, cycleInterval = 6000 }: Props) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!cycle) return;
    const id = setInterval(() => setKey((k) => k + 1), cycleInterval);
    return () => clearInterval(id);
  }, [cycle, cycleInterval]);

  const words = text.split(" ");
  let charIdx = 0;

  return (
    <span key={key} className={className} style={{ display: "inline" }}>
      {words.map((word, wi) => {
        const chars = [...word];
        const wordStart = charIdx;
        charIdx += chars.length + 1;
        return (
          <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {chars.map((c, ci) => (
              <span
                key={ci}
                className="char"
                style={{ animationDelay: `${delay + (wordStart + ci) * stagger}ms` }}
              >
                {c}
              </span>
            ))}
            {wi < words.length - 1 && (
              <span
                className="char"
                style={{ animationDelay: `${delay + (wordStart + chars.length) * stagger}ms` }}
              >
                {"\u00A0"}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

interface CycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function CycleText({ words, interval = 2200, className = "" }: CycleProps) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-block ${className}`} style={{ minWidth: "8ch" }}>
      <SplitText key={idx} text={words[idx]} stagger={25} />
    </span>
  );
}
