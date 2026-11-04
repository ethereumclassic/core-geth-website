// A label the site sets in capitals would change a token whose case is part of what it says:
// `v1.13.0` is not `V1.13.0`, nor is `go1.22` `GO1.22`. These are the tokens such a label holds.
// Each is wrapped in `.keep-case`, which global.css sets back to the case it was written in.
export const CASE_SENSITIVE =
  /\bv\d+(?:\.(?:\d+|x))+|\bgo\d+\.\d+(?:\.\d+)?|--[a-z][a-z0-9-]*|\b[a-z][a-z0-9]*_[a-z0-9_]+\b/g;

/** `text` in runs, each marked with whether it must keep its case. */
export function caseRuns(text: string): { text: string; keep: boolean }[] {
  const runs: { text: string; keep: boolean }[] = [];
  let at = 0;
  for (const m of text.matchAll(CASE_SENSITIVE)) {
    if (m.index > at) runs.push({ text: text.slice(at, m.index), keep: false });
    runs.push({ text: m[0], keep: true });
    at = m.index + m[0].length;
  }
  if (at < text.length) runs.push({ text: text.slice(at), keep: false });
  return runs;
}
