/**
 * Web Speech API helper for /ask voice input.
 * - No deps. Falls back gracefully when browser lacks SpeechRecognition.
 * - Returns a tiny controller: start/stop/onResult/onState.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export function hasVoiceSupport(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export interface VoiceController {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

interface VoiceCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStateChange: (state: "idle" | "listening" | "error") => void;
  onError?: (err: string) => void;
  lang?: string;
}

export function createVoice(cb: VoiceCallbacks): VoiceController | null {
  if (!hasVoiceSupport()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as new () => SR;
  const r = new Ctor();
  r.continuous = false;
  r.interimResults = true;
  r.lang = cb.lang || "en-US";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onresult = (e: any) => {
    let interim = "";
    let finalText = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const t = res[0]?.transcript || "";
      if (res.isFinal) finalText += t;
      else interim += t;
    }
    if (finalText) cb.onTranscript(finalText.trim(), true);
    else if (interim) cb.onTranscript(interim.trim(), false);
  };
  r.onstart = () => cb.onStateChange("listening");
  r.onend = () => cb.onStateChange("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onerror = (e: any) => {
    cb.onStateChange("error");
    cb.onError?.(e?.error || "unknown");
  };

  return {
    start: () => {
      try {
        r.start();
      } catch (err) {
        cb.onError?.(String(err));
      }
    },
    stop: () => {
      try {
        r.stop();
      } catch {}
    },
    destroy: () => {
      try {
        r.abort();
      } catch {}
    },
  };
}
