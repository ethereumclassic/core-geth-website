// Presentation for the mirrored audit and release report pages under src/pages/security/.
//
// Those pages are the documentation's markdown, re-synced from ethereumclassic/core-geth, so their
// words never change here, apart from the release labels in the section an operator acts on,
// which take the census's words (below). `SecurityDoc.astro` passes the rendered report through `designReport`, which changes
// only how the markdown's own structures render: it recognizes each by its shape and gives it the
// site's design, so a re-sync keeps the design with nobody editing a page.
//
//   - a list whose every item opens with a bold label ("**Severity:** High") becomes a grid of
//     facts, a label column and a value column, and a repository fact naming
//     `etclabscore/core-geth` carries a Deprecated chip;
//   - a paragraph that opens with a bold label ("**Impact:**") carries the label as an eyebrow;
//   - each h2 and what follows it becomes a section, and a few kinds of section, recognized by
//     their heading, take a shape of their own;
//   - each finding (an h3 under "Vulnerability Details", or an h3 naming a CVE) becomes a card,
//     with its severity, and whether it was exploited, as chips;
//   - a table of dates and events becomes the site's timeline rail, a release timeline newest
//     first; any other table scrolls in its own box, and a status or severity cell carries a chip,
//     red for a vulnerable state and green for a fixed one, the meanings those colors already carry
//     on the site, yellow for a mitigation, and a severity below High in its own color, Medium
//     orange and Low yellow;
//   - in the section an operator acts on, each release's entry becomes a row per label, its chip
//     beside its clause, and the releases run newest first;
//   - a code block takes the copy button `/downloads/` uses.
//
// The HTML comes from Astro's own markdown processor, so it is well formed; the reader below
// handles exactly that, and `designReport` throws rather than guess if it cannot read it back as
// it was. Text is never decoded or rewritten, and heading ids, which other pages link to, are kept.

import { caseRuns } from "./keep-case";

interface Element {
  type: "element";
  tagName: string;
  attrs: [string, string | null][];
  children: Node[];
}
interface Text {
  type: "text";
  /** Raw HTML text, entities as written. */
  value: string;
}
type Node = Element | Text;

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const TOKEN =
  /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>|[^<]+|</g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parse(html: string): Element {
  const root: Element = { type: "element", tagName: "#root", attrs: [], children: [] };
  const stack: Element[] = [root];
  for (const m of html.matchAll(TOKEN)) {
    const [token, close, open, attrText] = m;
    const top = stack[stack.length - 1]!;
    if (close) {
      const name = close.toLowerCase();
      const at = stack.findLastIndex((e) => e.tagName === name);
      if (at < 1) throw new Error(`report HTML: a stray </${name}>`);
      stack.length = at;
    } else if (open) {
      const name = open.toLowerCase();
      if (name === "script" || name === "style")
        throw new Error(`report HTML: an unexpected <${name}>`);
      const attrs = [...(attrText ?? "").matchAll(ATTR)].map((a): [string, string | null] => [
        a[1]!,
        a[2] ?? a[3] ?? a[4] ?? null,
      ]);
      const node: Element = { type: "element", tagName: name, attrs, children: [] };
      top.children.push(node);
      if (!VOID.has(name) && !token.endsWith("/>")) stack.push(node);
    } else {
      top.children.push({ type: "text", value: token });
    }
  }
  if (stack.length !== 1)
    throw new Error(`report HTML: <${stack[stack.length - 1]!.tagName}> is not closed`);
  return root;
}

function serialize(node: Node): string {
  if (node.type === "text") return node.value;
  const inner = node.children.map(serialize).join("");
  if (node.tagName === "#root") return inner;
  const attrs = node.attrs
    .map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${v.replaceAll('"', "&quot;")}"`))
    .join("");
  return VOID.has(node.tagName)
    ? `<${node.tagName}${attrs}>`
    : `<${node.tagName}${attrs}>${inner}</${node.tagName}>`;
}

// ---- helpers -------------------------------------------------------------------------------

const isEl = (node: Node | undefined, tag?: string): node is Element =>
  node?.type === "element" && (tag === undefined || node.tagName === tag);
const isBlank = (node: Node | undefined) => node?.type === "text" && !node.value.trim();
const decode = (s: string) =>
  s
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
/** The text a reader sees, for matching only. */
const textOf = (node: Node | undefined): string =>
  !node ? "" : node.type === "text" ? decode(node.value) : node.children.map(textOf).join("");
const txt = (value: string): Text => ({ type: "text", value });
const el = (
  tagName: string,
  className: string | string[] | null,
  children: Node[] = [],
  attrs: [string, string][] = [],
): Element => ({
  type: "element",
  tagName,
  attrs: [
    ...(className ? [["class", [className].flat().join(" ")] as [string, string]] : []),
    ...attrs,
  ],
  children,
});
const attr = (node: Element, name: string) => node.attrs.find(([k]) => k === name)?.[1] ?? null;
function addClass(node: Element, ...names: string[]) {
  const at = node.attrs.findIndex(([k]) => k === "class");
  if (at < 0) node.attrs.push(["class", names.join(" ")]);
  else node.attrs[at] = ["class", `${node.attrs[at]![1] ?? ""} ${names.join(" ")}`.trim()];
}
const meaningful = (children: Node[]) => children.filter((c) => !isBlank(c));

function trimStart(nodes: Node[]): Node[] {
  while (nodes.length && isBlank(nodes[0])) nodes.shift();
  const first = nodes[0];
  if (first?.type === "text") nodes[0] = txt(first.value.replace(/^\s+/, ""));
  return nodes;
}

/** The bold label a list item or paragraph opens with, if it is one: `**Label:**`. */
function openingLabel(container: Element) {
  const first = meaningful(container.children)[0];
  if (!isEl(first, "strong")) return null;
  const label = textOf(first).trim();
  return /^[^:]{1,60}:$/.test(label) ? { strong: first, label: label.slice(0, -1) } : null;
}

// ---- facts: a list of labeled items --------------------------------------------------------

function facts(list: Element): Element | null {
  const items = list.children.filter((c): c is Element => isEl(c, "li"));
  if (items.length < 2) return null;
  const parts = items.map((li) => {
    const kids = meaningful(li.children);
    const host = isEl(kids[0], "p") ? kids[0] : li;
    const found = openingLabel(host);
    return found ? { li, host, ...found } : null;
  });
  if (parts.some((p) => !p)) return null;
  const rows = parts.map((part) => {
    const { li, host, strong, label } = part!;
    const value = trimStart(host.children.slice(host.children.indexOf(strong) + 1));
    const rest = host === li ? [] : li.children.slice(li.children.indexOf(host) + 1);
    return el("div", "facts__row", [
      el("dt", null, [txt(label)]),
      el("dd", null, [...value, ...rest]),
    ]);
  });
  return el("dl", "facts", rows);
}

/**
 * Opening facts a document writes as labeled paragraphs ("**Baseline:** ..."), not as a list, in
 * the facts grid the March audit's list became, consecutive ones in one grid, so every report
 * opens the same way.
 */
function labeledFacts(front: Node[]): Node[] {
  const out: Node[] = [];
  let grid: Element | null = null;
  for (const node of front) {
    const labeled = isEl(node, "p") && (attr(node, "class") ?? "").split(" ").includes("labeled");
    const label = labeled ? node.children.find((c): c is Element => isEl(c, "strong")) : undefined;
    if (!labeled || !label) {
      if (!isBlank(node)) grid = null;
      out.push(node);
      continue;
    }
    const value = trimStart(node.children.slice(node.children.indexOf(label) + 1));
    const row = el("div", "facts__row", [el("dt", null, label.children), el("dd", null, value)]);
    if (grid) grid.children.push(row);
    else out.push((grid = el("dl", "facts", [row])));
  }
  return out;
}

/**
 * The repository a document's opening facts name is marked by what it is now (maintainer,
 * 2026-11-03): `etclabscore/core-geth` as Deprecated, the source to stop using, and
 * `ethereumclassic/core-geth` as Current. That holds for any opening fact whose value starts with
 * the repository, "Repository audited" as much as "Subject", and the chip goes straight after the
 * repository so it cannot be read as the status of a release named after it. The body's own
 * mentions carry the namespace tones instead. An opening fact is a row of the facts list or a
 * labeled paragraph ("**As of:** ...") before the first section.
 */
function repositoryChips(front: Node[]) {
  const values = front.flatMap((n): [Element, number][] => {
    if (!isEl(n)) return [];
    if (n.tagName === "dl")
      return n.children.flatMap((row) =>
        isEl(row) ? elements(row, "dd").map((dd): [Element, number] => [dd, 0]) : [],
      );
    if (n.tagName === "p" && (attr(n, "class") ?? "").split(" ").includes("labeled"))
      return [[n, n.children.findIndex((c) => isEl(c, "strong")) + 1]];
    return [];
  });
  for (const [host, start] of values) {
    releaseRepository(host, start);
    const at = host.children.findIndex((c, i) => i >= start && !isBlank(c));
    const repo = textOf(host.children[at])
      .trim()
      .match(/^(?:github\.com\/)?(etclabscore|ethereumclassic)\/core-geth$/)?.[1];
    if (!repo) continue;
    const status =
      repo === "etclabscore"
        ? chip("Deprecated", "chip--vulnerable")
        : chip("Current", "chip--fixed");
    // What the fact says after the repository, a release and its date, goes on the line under it,
    // as a release sits under its chip in a status table.
    const after = host.children.slice(at + 1);
    host.children = after.every(isBlank)
      ? [...host.children, txt(" "), status]
      : [
          ...host.children.slice(0, at + 1),
          txt(" "),
          status,
          el("span", "facts__line", trimStart(after)),
        ];
  }
}

/**
 * An opening fact naming a release, "the `v1.13.0` release, September 14, 2026", opens with the
 * repository that published it instead, the `v1.13` line's `ethereumclassic/core-geth` or the
 * `v1.12` line's `etclabscore/core-geth`, and reads as a "Subject" fact does (maintainer,
 * 2026-11-03): the repository and its chip, then "`v1.13.0`, released September 14, 2026" on the
 * line under them.
 */
function releaseRepository(host: Element, start: number) {
  const at = host.children.findIndex((c, i) => i >= start && !isBlank(c));
  const [the, code, rest] = host.children.slice(at, at + 3);
  const version = isEl(code, "code") ? textOf(code).match(/^v(\d+)\.(\d+)\.\d+$/) : null;
  if (
    the?.type !== "text" ||
    !/^\s*the\s+$/.test(the.value) ||
    !version ||
    rest?.type !== "text" ||
    !/^\s+release,\s+/.test(rest.value)
  )
    return;
  const current = Number(version[1]) > 1 || Number(version[2]) >= 13;
  const repo = el("code", current ? "namespace--current" : "namespace--previous", [
    txt(`${current ? "ethereumclassic" : "etclabscore"}/core-geth`),
  ]);
  // The release is plain text, as a "Subject" fact writes it: a code box would part it from its
  // comma and set it apart from the release in the row above.
  const line = `${version[0]}${rest.value.replace(/^\s+release,\s+/, ", released ")}`;
  host.children.splice(at, 3, txt(" "), repo, txt(" "), txt(line));
}

// ---- chips ---------------------------------------------------------------------------------

// The words a status cell opens with, in any case: the March audit writes "Patched", the August
// follow-up "fixed". A regression "introduced" or "present" is red, like an open finding.
const VULNERABLE =
  /^(Critical|High|Open|Unpatched|Not addressed|Not fixed|Vulnerable|Introduced|Present)\b/i;
const FIXED = /^(Patched|Fixed|Closed|Resolved)\b/i;
// Severity below High has a color of its own (maintainer, 2026-11-03): Medium orange, Low yellow.
// A mitigation is yellow too, and a CVE `etclabscore/core-geth` declared not applicable to
// Ethereum Classic shows as what it was, not addressed, keeping its footnote.
const MEDIUM = /^(Medium|Moderate)\b/i;
const LOW = /^Low\b/i;
const MITIGATED = /^(Mitigated(?: in v[\d.]+)?|Partially mitigated|Partial)\b/i;
const DECLARED_NA = /^Declared N\/A to ETC/i;
const NEUTRAL = /^(Not present|Backported in v[\d.]+|Not applicable|N\/A)/i;

function chipFor(value: string): { word: string; tone: string | null; label?: string } | null {
  for (const [rx, tone, label] of [
    [VULNERABLE, "chip--vulnerable"],
    [FIXED, "chip--fixed"],
    [MEDIUM, "chip--medium"],
    [LOW, "chip--low"],
    [MITIGATED, "chip--mitigated"],
    [DECLARED_NA, "chip--vulnerable", "Not addressed"],
    [NEUTRAL, null],
  ] as const) {
    const m = value.match(rx);
    if (m) return { word: m[0], tone, ...(label ? { label } : {}) };
  }
  return null;
}

const chip = (word: string, tone: string | null) =>
  el("span", ["chip", ...(tone ? [tone] : [])], [txt(word)]);

/** Wraps the status word a cell opens with in a chip. The cell's text does not change. */
/** What follows a chip: a parenthetical note, "(peer disconnect on invalid proof)", sits on a line
 *  of its own under the chip. */
function afterChip(rest: string): Node[] {
  const note = rest.replace(/^\s+/, "");
  if (!note) return [];
  return note.startsWith("(") ? [el("span", "cell-note", [txt(note)])] : [txt(rest)];
}

function chipCell(cell: Element) {
  const first = cell.children.find((c) => !isBlank(c));
  if (first?.type !== "text") return;
  const lead = first.value.replace(/^\s+/, "");
  const at = cell.children.indexOf(first);
  // "Backported in v1.12.22" shows the state as a chip, Backported in green or Mitigated in
  // yellow, with its release on the line under it (maintainer, 2026-11-03).
  const inRelease = decode(lead).match(/^(Backported|Mitigated) in (v\d+\.\d+\.\d+)([¹²³⁴⁵⁶⁷⁸⁹]*)/);
  if (inRelease) {
    const [all, word, version, marker] = inRelease;
    const tone = word === "Backported" ? "chip--fixed" : "chip--mitigated";
    cell.children.splice(
      at,
      1,
      chip(word! + marker!, tone),
      releaseLine(version!),
      ...afterChip(lead.slice(all.length)),
    );
    return;
  }
  const found = chipFor(decode(lead));
  if (!found || !lead.startsWith(found.word)) return;
  // A footnote marker belongs to the chip; a letter or digit means the word goes on, so no chip.
  const marker = lead.slice(found.word.length).match(/^[¹²³⁴⁵⁶⁷⁸⁹]+/)?.[0] ?? "";
  const rest = lead.slice(found.word.length + marker.length);
  if (/^[\p{L}\p{N}]/u.test(rest)) return;
  const shown = (found.label ?? found.word) + marker;
  cell.children.splice(at, 1, chip(shown, found.tone), ...afterChip(rest));
}

/** The release a chip's state belongs to, on the line under the chip. */
const releaseLine = (version: string) => el("span", "cell-release", [txt(version)]);

/** The column of the release that patched everything, headed "v1.13.0 (ethereumclassic)": the
 *  header names the repository in its tone, as the column beside it names the previous one, and
 *  each "Patched" cell is a green chip with its release, `v1.13.0`, on the line under it
 *  (maintainer, 2026-11-03). */
function patchedColumn(table: Element) {
  headerCells(table).forEach((th, i) => {
    const version = textOf(th)
      .trim()
      .match(/^(v\d+\.\d+\.\d+) \(ethereumclassic\)$/)?.[1];
    if (!version) return;
    th.children = [el("code", "namespace--current", [txt("ethereumclassic/core-geth")])];
    for (const tr of bodyRows(table)) {
      const td = elements(tr, "td")[i];
      const first = td?.children.find((c) => !isBlank(c));
      if (!td || first?.type !== "text") continue;
      const lead = first.value.replace(/^\s+/, "");
      const word = lead.match(/^Patched\b/i)?.[0];
      if (!word) continue;
      td.children = [
        chip(word, "chip--fixed"),
        releaseLine(version),
        ...afterChip(lead.slice(word.length)),
        ...td.children.slice(td.children.indexOf(first) + 1),
      ];
    }
  });
}

// ---- tables --------------------------------------------------------------------------------

const elements = (node: Element | undefined, tag: string) =>
  (node?.children ?? []).filter((c): c is Element => isEl(c, tag));
const headerCells = (table: Element) =>
  elements(elements(elements(table, "thead")[0], "tr")[0], "th");
const bodyRows = (table: Element) => elements(table, "tbody").flatMap((b) => elements(b, "tr"));

const MONTHS =
  "January February March April May June July August September October November December";

/** A sortable date, from "2024-06-10" or "August 2024"; null for anything else. */
function dateKey(text: string): number | null {
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return Number(iso[1]) * 10000 + Number(iso[2]) * 100 + Number(iso[3]);
  const named = text.match(/^([A-Z][a-z]+) (\d{4})$/);
  const month = named ? MONTHS.split(" ").indexOf(named[1]!) + 1 : 0;
  return named && month ? Number(named[2]) * 10000 + month * 100 : null;
}

/** Dates and events as the site's timeline rail. A release timeline runs newest first, like every
 *  list of releases on the site; a timeline of events keeps the order it happened in. */
function rail(table: Element, releases: boolean): Element {
  const rows = bodyRows(table).map((tr) => elements(tr, "td"));
  const keys = rows.map(([date]) => dateKey(textOf(date).trim()));
  if (releases && keys.every((k) => k !== null)) {
    const order = rows.map((_, i) => i).reverse();
    order.sort((a, b) => keys[b]! - keys[a]!);
    rows.splice(0, rows.length, ...order.map((i) => rows[i]!));
  }
  const items = rows.map(([date, second, third]) => {
    const body = releases ? third : second;
    return el("li", "report-rail__item", [
      el("p", "report-rail__date", date?.children ?? []),
      // A row with no release, written "-" in the source, has no title line.
      ...(releases && textOf(second).trim() !== "-"
        ? [el("p", "report-rail__title", releaseTitle(second, third))]
        : []),
      el("div", "report-rail__body", body?.children ?? []),
    ]);
  });
  return el("ol", "report-rail", items);
}

// Where each repository's releases live, for the links below.
const CURRENT_RELEASES = "https://github.com/ethereumclassic/core-geth/releases/tag/";
const PREVIOUS_RELEASES = "https://github.com/etclabscore/core-geth/releases/tag/";

/** A release timeline's title. A bare release name links to its tag in `ethereumclassic/core-geth`
 *  where its own row says it was released from there, as every other row links its tag
 *  (maintainer, 2026-11-03). */
function releaseTitle(title: Element | undefined, notes: Element | undefined): Node[] {
  const name = textOf(title).trim();
  const bare = /^v\d+\.\d+\.\d+$/.test(name) && !title?.children.some((c) => isEl(c, "a"));
  if (!bare || !textOf(notes).includes("ethereumclassic/core-geth")) return title?.children ?? [];
  return [el("a", null, [txt(name)], [["href", CURRENT_RELEASES + name]])];
}

/** A link to a release takes the tone of the repository that published it, as every mention of
 *  either repository does: red for `etclabscore/core-geth`, green for `ethereumclassic/core-geth`. */
function toneReleaseLinks(node: Node) {
  if (!isEl(node)) return;
  const href = node.tagName === "a" ? (attr(node, "href") ?? "") : "";
  if (href.startsWith(PREVIOUS_RELEASES)) addClass(node, "namespace--previous");
  if (href.startsWith(CURRENT_RELEASES)) addClass(node, "namespace--current");
  node.children.forEach(toneReleaseLinks);
}

/** A release column's sort key: "v1.12.23", or "v1.13 line" for a whole line, after its releases. */
function releaseColumnKey(head: string): number[] | null {
  const m = head.match(/^v(\d+)\.(\d+)(?:\.(\d+)| line)$/);
  return m ? [Number(m[1]), Number(m[2]), m[3] === undefined ? 1e9 : Number(m[3])] : null;
}

/** A table with two or more release columns runs them newest first, like every list of releases on
 *  the site; its other columns keep their places, and a row with merged cells keeps its order. A
 *  header that is more than a version, such as "v1.13.0 (ethereumclassic)", is not one of them. */
function newestColumnsFirst(table: Element) {
  const keys = headerCells(table).map((th) => releaseColumnKey(textOf(th).trim()));
  const at = keys.flatMap((k, i) => (k ? [i] : []));
  if (at.length < 2) return;
  const sorted = [...at].sort((a, b) => {
    const [x, y] = [keys[a]!, keys[b]!];
    return y[0]! - x[0]! || y[1]! - x[1]! || y[2]! - x[2]!;
  });
  let next = 0;
  const order = keys.map((k, i) => (k ? sorted[next++]! : i));
  for (const tr of [...elements(elements(table, "thead")[0], "tr"), ...bodyRows(table)]) {
    const cells = tr.children.filter((c): c is Element => isEl(c, "th") || isEl(c, "td"));
    if (cells.length === keys.length) tr.children = order.map((i) => cells[i]!);
  }
}

/** A table whose every row opens with a release, such as `v1.12.20` or `core-geth-linux-v1.12.20.zip`,
 *  runs newest first; rows of the same release keep their order. */
function newestRowsFirst(table: Element) {
  const rows = bodyRows(table);
  const keys = rows.map((tr) => textOf(elements(tr, "td")[0]).match(/v(\d+)\.(\d+)\.(\d+)/));
  if (rows.length < 2 || keys.some((k) => !k)) return;
  const key = (i: number) => keys[i]!.slice(1).map(Number);
  const order = rows.map((_, i) => i);
  order.sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    // Rows of one release keep newest first too: a list written oldest first has the later row last.
    return y[0]! - x[0]! || y[1]! - x[1]! || y[2]! - x[2]! || b - a;
  });
  for (const body of elements(table, "tbody")) {
    const mine = elements(body, "tr");
    const sorted = order.map((i) => rows[i]!).filter((tr) => mine.includes(tr));
    body.children = sorted;
  }
}

/** In a table of the Go toolchain each archive was built with, a cell naming one exact Go release is
 *  green while Go supports its major and red once it does not. Go supports a major until there are
 *  two newer majors, so the table's newest major and the one before it are the supported ones. */
function toolchainChips(table: Element, heads: string[]) {
  if (!heads.includes("linux")) return;
  const cells = bodyRows(table).flatMap((tr) => elements(tr, "td"));
  const minor = (c: Element) =>
    Number(
      textOf(c)
        .trim()
        .match(/^go1\.(\d+)\.\d+$/)?.[1] ?? NaN,
    );
  const newest = Math.max(...cells.map(minor).filter((m) => !Number.isNaN(m)));
  for (const cell of cells) {
    const m = minor(cell);
    if (Number.isNaN(m)) continue;
    cell.children = [
      chip(textOf(cell).trim(), m >= newest - 1 ? "chip--fixed" : "chip--vulnerable"),
    ];
  }
}

/** How far into a binary an advisory reaches: "symbol", the flawed code is in it, is red. */
function levelChip(cell: Element) {
  const word = textOf(cell).trim();
  if (["symbol", "package", "module"].includes(word))
    cell.children = [chip(word, word === "symbol" ? "chip--vulnerable" : null)];
}

/** In a row about toolchain support, "yes" and "no" are states too. */
function supportChip(cell: Element) {
  const word = textOf(cell).trim();
  if (word === "yes" || word === "no")
    cell.children = [chip(word, word === "yes" ? "chip--fixed" : "chip--vulnerable")];
}

/** A table of changes, "Before | After" or "Removed | Successor": the old value and the new one take
 *  classes of their own, so a reader scans what moved. The headers still say which is which. */
function deltaTable(table: Element, heads: string[]) {
  const before = heads.findIndex((h) => /^(Before|Removed)$/.test(h));
  const after = heads.findIndex((h) => /^(After|Successor)$/.test(h));
  if (before < 0 || after !== before + 1) return;
  addClass(table, "delta-table", ...(heads[before] === "Removed" ? ["delta-table--renames"] : []));
  for (const tr of bodyRows(table)) {
    const cells = elements(tr, "td");
    if (cells[before]) addClass(cells[before], "delta__before");
    if (cells[after]) addClass(cells[after], "delta__after");
  }
}

/** A cell naming one issue by all its identifiers, "CVE-2026-26313 · GHSA-689v-6xwf-5jf3 ·
 *  GO-2026-4508": one a line, the first as written and its aliases under it in the code face. The
 *  identifiers do not change; the dots that strung them on one line go. */
function identifierCell(cell: Element) {
  const id = "(?:CVE|GHSA|GO)-[\\w-]+";
  if (!new RegExp(`^${id}(?: · ${id})+$`).test(textOf(cell).trim())) return;
  const lines: Node[][] = [[]];
  for (const child of cell.children) {
    if (child.type !== "text") {
      lines[lines.length - 1]!.push(child);
      continue;
    }
    child.value.split(" · ").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part.trim()) lines[lines.length - 1]!.push(txt(part.trim()));
    });
  }
  cell.children = [
    el(
      "span",
      "ids",
      lines.map((nodes, i) => el("span", i ? "ids__alias" : "ids__first", nodes)),
    ),
  ];
}

/** An advisory identifier or a date in a cell is read whole: squeezed, a column broke "GO-2024-2687"
 *  and "2026-08-14" at their hyphens. Code is left alone; it keeps itself whole on a desktop. */
const WHOLE = /((?:GO|CVE|GHSA)-[0-9A-Za-z]+(?:-[0-9A-Za-z]+)+|\d{4}-\d{2}-\d{2})/;
function wholeTokens(table: Element) {
  const wrap = (node: Element) => {
    node.children = node.children.flatMap((child): Node[] => {
      if (child.type === "element") {
        if (child.tagName !== "code") wrap(child);
        return [child];
      }
      if (!WHOLE.test(child.value)) return [child];
      return child.value
        .split(WHOLE)
        .filter(Boolean)
        .map((part) =>
          new RegExp(`^${WHOLE.source}$`).test(part)
            ? el("span", "nowrap", [txt(part)])
            : txt(part),
        );
    });
  };
  for (const td of bodyRows(table).flatMap((tr) => elements(tr, "td"))) wrap(td);
}

/**
 * A table of what the network runs ("Running | Nodes | Share | ...") in the census's tones, as the
 * security page draws its own: a release on the recommended line green, every other release red,
 * each as a bar, a tint and a chip naming its state, so the row reads in greyscale too. A build the
 * row itself says is not a release stays plain, as the site's census leaves it out of its rows.
 */
function networkTable(table: Element, heads: string[]) {
  if (heads[0] !== "Running" || !heads.includes("Nodes")) return;
  for (const tr of bodyRows(table)) {
    const first = elements(tr, "td")[0];
    const version = textOf(first).match(/v(\d+)\.(\d+)\.\d+/);
    if (!first || !version || /\bnot a release\b/.test(textOf(tr))) continue;
    const current = Number(version[1]) > 1 || Number(version[2]) >= 13;
    addClass(tr, current ? "network-row--recommended" : "network-row--vulnerable");
    const state = current
      ? chip("Recommended", "chip--fixed")
      : chip("Vulnerable", "chip--vulnerable");
    first.children.push(el("span", "cell-state", [state]));
  }
}

function table(node: Element): Element {
  const first = headerCells(node).map((th) => textOf(th).trim());
  const key = first.join("|");
  if (key === "Date|Event") return rail(node, false);
  // Eight columns or more, the advisory lists: denser type, so the table fits a desktop column.
  if (first.length >= 8) addClass(node, "table--dense");
  if (key === "Date|Release|Notes") return rail(node, true);
  newestColumnsFirst(node);
  newestRowsFirst(node);
  const heads = headerCells(node).map((th) => textOf(th).trim());
  networkTable(node, heads);
  deltaTable(node, heads);
  toolchainChips(node, heads);
  patchedColumn(node);
  const statusColumns = heads.map(
    (h, i) =>
      i > 0 && (/^severity$/i.test(h) || /core-geth|^v\d|\bline\b|status|^mitigation$/i.test(h)),
  );
  for (const tr of bodyRows(node)) {
    const cells = elements(tr, "td");
    const supportRow = /\bin support\b/i.test(textOf(cells[0]));
    cells.forEach(identifierCell);
    cells.forEach((td, i) => {
      if (/^Highest level$/i.test(heads[i] ?? "")) return levelChip(td);
      if (/\bsupported\b/i.test(heads[i] ?? "")) return supportChip(td);
      if (!statusColumns[i]) return;
      if (supportRow) supportChip(td);
      else if (textOf(td).trim().length <= 60) chipCell(td);
    });
  }
  wholeTokens(node);
  const dense = first.length >= 8;
  return el(
    "div",
    ["table-wrap", ...(dense ? ["table-wrap--dense"] : [])],
    [node],
    [
      ["role", "region"],
      ["tabindex", "0"],
      // Named by its first column only: a later header can be a repository name, and an
      // attribute cannot carry the tone every repository mention on the site carries.
      ["aria-label", `Table: ${heads[0] ?? ""}`.replaceAll('"', "")],
    ],
  );
}

// ---- paragraphs ----------------------------------------------------------------------------

/** A run-in heading: a paragraph opening with one or two bold words and a period, "**Consequence.**"
 *  or "**Upstream backports.**". A longer bold opening is a sentence, and stays one. */
function runInLabel(p: Element) {
  const first = meaningful(p.children)[0];
  if (!isEl(first, "strong")) return null;
  const label = textOf(first).trim();
  return /^[^:.]{1,40}\.$/.test(label) && label.split(/\s+/).length <= 2
    ? { strong: first, label: label.slice(0, -1) }
    : null;
}

/**
 * A paragraph that ends in a run of pull requests, "`#34787` (stop serving on unavailable
 * responses), `#34745` (...)", with the run as a list under it, one change a row, as a commit table
 * reads. The words do not change; the commas and parentheses that held the run in a sentence go.
 */
function seriesList(p: Element): Node[] | null {
  const kids = p.children;
  const isPull = (n: Node | undefined): n is Element => isEl(n, "code") && /^#\d+$/.test(textOf(n));
  const start = kids.findIndex(isPull);
  const intro = kids[start - 1];
  if (start < 1 || intro?.type !== "text" || !/:\s*$/.test(intro.value)) return null;
  const rows: Element[] = [];
  for (let i = start; i < kids.length; i += 2) {
    const code = kids[i];
    const after = kids[i + 1];
    const last = i + 2 >= kids.length;
    const m =
      after?.type === "text"
        ? after.value.match(last ? /^\s*\(([^()]+)\)\.\s*$/ : /^\s*\(([^()]+)\),\s*$/)
        : null;
    if (!isPull(code) || !m) return null;
    rows.push(el("li", null, [code, txt(" "), el("span", null, [txt(m[1]!)])]));
  }
  if (rows.length < 3) return null;
  p.children = [...kids.slice(0, start - 1), txt(intro.value.replace(/\s+$/, ""))];
  return [p, el("ul", "series", rows)];
}

/** "Legend: fixed means the fix is present; open means ..." under a status table, each word in the
 *  chip the table gives it, with its meaning beside it. The words do not change. */
function legendList(p: Element): Element | null {
  if (p.children.some((c) => c.type !== "text")) return null;
  const m = textOf(p).match(/^\s*Legend:\s*([\s\S]+?)\.?\s*$/);
  const clauses = m ? m[1]!.split(/;\s*/).map((c) => c.match(/^(\S+) (means [\s\S]+)$/)) : [];
  if (clauses.length < 2 || clauses.some((c) => !c)) return null;
  return el("div", "legend", [
    el("p", "legend__label", [txt("Legend")]),
    el(
      "ul",
      "legend__list",
      clauses.map((c) => {
        const [, word, meaning] = c!;
        return el("li", null, [chip(word!, chipFor(word!)?.tone ?? null), txt(` ${meaning}`)]);
      }),
    ),
  ]);
}

/**
 * A paragraph that is a run of module version changes, "`cespare/xxhash/v2` v2.2.0 to v2.3.0 ·
 * ...", as the Module | Before | After table the document gives its direct dependencies, those
 * three header words being that table's. The modules and versions do not change.
 */
function versionTable(p: Element): Element | null {
  const kids = meaningful(p.children);
  if (kids.length < 6 || kids.length % 2) return null;
  const rows: Element[] = [];
  for (let i = 0; i < kids.length; i += 2) {
    const [code, change] = [kids[i], kids[i + 1]];
    const shape =
      i + 2 >= kids.length
        ? /^\s+(v[\w.+-]+)\s+to\s+(v[\w.+-]+)\s*$/
        : /^\s+(v[\w.+-]+)\s+to\s+(v[\w.+-]+)\s+·\s*$/;
    const m = isEl(code, "code") && change?.type === "text" ? change.value.match(shape) : null;
    if (!m) return null;
    rows.push(
      el(
        "tr",
        null,
        [code, txt(m[1]!), txt(m[2]!)].map((n) => el("td", null, [n])),
      ),
    );
  }
  const head = el(
    "tr",
    null,
    ["Module", "Before", "After"].map((h) => el("th", null, [txt(h)])),
  );
  return table(el("table", null, [el("thead", null, [head]), el("tbody", null, rows)]));
}

/**
 * A paragraph ending in a run of module paths, "`consensys/bavard` · `mmcloughlin/addchain` · ..."
 * or "`a`, `b` and `c`.", with the run as a list under it, as many to a row as fit. The paths do
 * not change; the dots, commas and "and" that strung them into a sentence go.
 */
function moduleList(p: Element): Node[] | null {
  const kids = p.children;
  // An item is a module path or a commit hash, written as code or as a link's code text.
  const item = (n: Node | undefined): n is Element => {
    const code = isEl(n, "a") && n.children.length === 1 ? n.children[0] : n;
    const t = textOf(code);
    return isEl(code, "code") && (t.includes("/") || /^[0-9a-f]{7,40}$/.test(t));
  };
  const first = kids.findIndex(item);
  const intro = kids[first - 1];
  if (first < 1 || intro?.type !== "text" || !/:\s*$/.test(intro.value)) return null;
  const items: Element[] = [];
  for (const n of kids.slice(first)) {
    if (item(n)) items.push(n);
    else if (n.type !== "text" || !/^\s*(?:·|,|,?\s*and)?\s*\.?\s*$/.test(n.value)) return null;
  }
  if (items.length < 5) return null;
  p.children = [...kids.slice(0, first - 1), txt(intro.value.replace(/\s+$/, ""))];
  // Modules the sentence says were added, or arrived, read as an After column does.
  const added = /\b(?:added|arrived)\b/i.test(textOf(p));
  return [
    p,
    el(
      "ul",
      ["modules", ...(added ? ["modules--added"] : [])],
      items.map((c) => el("li", null, [c])),
    ),
  ];
}

/**
 * A list whose every item opens with a short run-in label ("**Snap sync.** A response cap ...") as
 * the label cards Methodology's labeled paragraphs become, three or more to a grid. The words do
 * not change; the label drops the period that ran it into its text.
 */
const BLOCKS = new Set(["p", "ul", "ol", "div", "pre", "table", "blockquote", "details"]);

/**
 * The last pass over a section: a list nothing else has given a shape becomes label cards or bold-led
 * cards. It runs after the release tabs, the lineage rail and the credits, so a list one of those
 * takes is never a card first, and it leaves alone any list that already carries a class.
 */
const SHAPED =
  /\b(report-tabs|report-rail|facts|labeled-grid|claims|credits|label-lists|series|modules)\b/;
function cardLists(node: Element) {
  node.children = node.children.map((child) => {
    if (!isEl(child) || SHAPED.test(attr(child, "class") ?? "")) return child;
    if ((child.tagName === "ul" || child.tagName === "ol") && !attr(child, "class"))
      return labeledList(child) ?? claimCards(child) ?? child;
    cardLists(child);
    return child;
  });
}

/** An item's opening bold, and what holds it: the item in a tight list, or its first paragraph in a
 *  loose one, where Markdown wraps every item in <p> because one of them holds a block. */
function itemLead(li: Element): { strong: Element; host: Element } | null {
  const first = meaningful(li.children)[0];
  const host = isEl(first, "p") ? first : li;
  const strong = meaningful(host.children)[0];
  return isEl(strong, "strong") ? { strong, host } : null;
}

/**
 * A list whose every item opens with a short run-in label ("**Snap sync.** A response cap ...") as
 * the label cards Methodology's labeled paragraphs become, three or more to a grid. The words do
 * not change; the label drops the period that ran it into its text.
 */
function labeledList(list: Element): Element | null {
  const items = list.children.filter((c): c is Element => isEl(c, "li"));
  const label = (li: Element) => {
    const lead = itemLead(li);
    const text = lead ? textOf(lead.strong).trim() : "";
    return /^[^:]{1,60}\.$/.test(text) && text.split(/\s+/).length <= 6 ? lead : null;
  };
  if (items.length < 3 || !items.every(label)) return null;
  return el(
    "div",
    "labeled-grid",
    items.map((li) => {
      const { strong, host } = label(li)!;
      const last = strong.children[strong.children.length - 1];
      if (last?.type === "text") last.value = last.value.replace(/\.\s*$/, "");
      addClass(strong, "labeled__label");
      // The label and the text it runs into open the card; a code block or a list follows it.
      const rest = host === li ? li.children : li.children.slice(li.children.indexOf(host) + 1);
      const at = host === li ? rest.findIndex((c) => isEl(c) && BLOCKS.has(c.tagName)) : 0;
      const inline = host === li ? (at < 0 ? rest : rest.slice(0, at)) : host.children;
      const blocks = (host === li ? (at < 0 ? [] : rest.slice(at)) : rest).flatMap(block);
      return el("div", "labeled", [el("p", null, inline), ...blocks]);
    }),
  );
}

/**
 * A list whose every item opens in bold, as a stack of cards. A bold sentence ("**Nodes discover
 * peers through this project's DNS trees only.**") heads its card on a line of its own; a bold
 * subject or label ("**Accounts** use ...", "**Data directory:** ...") stays in its sentence. The
 * words do not change.
 */
function claimCards(list: Element): Element | null {
  const items = list.children.filter((c): c is Element => isEl(c, "li"));
  if (items.length < 2 || !items.every(itemLead)) return null;
  return el(
    "div",
    "claims",
    items.map((li) => {
      const { strong, host } = itemLead(li)!;
      const sentence = /\.$/.test(textOf(strong).trim());
      addClass(strong, "claim__lead", ...(sentence ? ["claim__lead--block"] : []));
      return el(
        "div",
        "claim",
        li.children.flatMap((c) =>
          c !== host && isEl(c) && BLOCKS.has(c.tagName) ? block(c) : [c],
        ),
      );
    }),
  );
}

function paragraph(p: Element): Node | Node[] {
  const kids = meaningful(p.children);
  const legend = legendList(p);
  if (legend) return legend;
  const versions = versionTable(p);
  if (versions) return versions;
  const modules = moduleList(p);
  if (modules) return modules;
  const found = openingLabel(p) ?? runInLabel(p);
  if (found) {
    addClass(p, "labeled");
    addClass(found.strong, "labeled__label");
    // The label sits on a line of its own now, so it drops the colon or period that joined it to
    // the text.
    const last = found.strong.children[found.strong.children.length - 1];
    if (last?.type === "text") last.value = last.value.replace(/[:.]\s*$/, "");
    return seriesList(p) ?? p;
  }
  if (kids.length === 1 && isEl(kids[0], "strong") && textOf(kids[0]).trim().length <= 40) {
    addClass(p, "report-kicker");
    return p;
  }
  if (/^[¹²³⁴⁵⁶⁷⁸⁹]/.test(textOf(p).trim())) addClass(p, "footnote");
  return p;
}

// ---- blocks, recursively -------------------------------------------------------------------

function block(node: Node): Node | Node[] {
  if (!isEl(node)) return node;
  const tag = node.tagName;
  if (tag === "ul" || tag === "ol") {
    const grid = facts(node);
    if (grid) return grid;
  }
  if (tag === "table") return table(node);
  if (tag === "pre") return el("div", "shell-wrap", [node]);
  if (tag === "p") return paragraph(node);
  if (["li", "blockquote", "details", "div", "dd"].includes(tag)) {
    node.children = node.children.flatMap(block);
  }
  return node;
}

// ---- sections and finding cards ------------------------------------------------------------

const SECTION_KINDS: [RegExp, string][] = [
  [
    /^(What operators need to do|What this means if you are upgrading|Upgrade Path|Recommendations|Status of v1\.13\.0|Upgrading|Reporting problems|Check a release yourself)$/i,
    "report-section--action",
  ],
  [/^(In short|Executive Summary|At a glance|Summary)$/i, "report-section--summary"],
  [/^References$/i, "report-section--references"],
  [/^Supporting this work$/i, "report-section--support"],
  [/^Finding:/i, "report-section--finding"],
  [/^Methodology$/i, "report-section--method"],
  [/^Acknowledg(e)?ments$/i, "report-section--credits"],
  // A finding that is not a CVE, and a release's known issues, drawn as the CVE cards are.
  [
    /^(Go Toolchain End-of-Life|Known issues|Why the article.s advice reduces security|Disposition of the build finding.*)$/i,
    "report-section--card",
  ],
  [/^Where Core-Geth is maintained$/i, "report-section--lineage"],
];

/**
 * A bold label line the markdown folded into the list item above it: "**In scope:**" written under a
 * list with no blank line between joins the last item, and the items after it join the same list.
 * The label heads a list of its own again; the words do not change.
 */
function swallowedLabel(node: Node): Node[] {
  if (!isEl(node) || (node.tagName !== "ul" && node.tagName !== "ol")) return [node];
  const items = node.children.filter((c): c is Element => isEl(c, "li"));
  const at = items.findIndex((li) => {
    const kids = meaningful(li.children);
    const last = kids[kids.length - 1];
    return kids.length > 1 && isEl(last, "strong") && /^[^:]{1,40}:$/.test(textOf(last).trim());
  });
  if (at < 0) return [node];
  const li = items[at]!;
  const label = meaningful(li.children).pop() as Element;
  li.children = trimEnd(li.children.slice(0, li.children.indexOf(label)));
  const after = items.slice(at + 1);
  return [
    el(node.tagName, null, items.slice(0, at + 1)),
    el("p", null, [label]),
    ...(after.length ? [el(node.tagName, null, after)] : []),
  ];
}

const isList = (n: Node | undefined) => isEl(n, "ul") || isEl(n, "ol");
const labeledP = (n: Node | undefined): n is Element =>
  isEl(n, "p") && (attr(n, "class") ?? "").split(" ").includes("labeled");
const labelOnly = (n: Node | undefined) => labeledP(n) && meaningful(n.children).length === 1;

/** A label over a list, twice or more in a row, such as what an audit covered and what it left out:
 *  each pair becomes a card, side by side on a wide screen, an "Out of" list the muted one. */
function labelLists(nodes: Node[]): Node[] {
  const out: Node[] = [];
  for (let i = 0; i < nodes.length;) {
    const pairs: Element[] = [];
    for (let j = i; labelOnly(nodes[j]) && isList(nodes[j + 1]); j += 2) {
      const muted = /^Out of\b/i.test(textOf(nodes[j]).trim());
      pairs.push(
        el(
          "div",
          ["label-list", ...(muted ? ["label-list--out"] : [])],
          [nodes[j]!, nodes[j + 1]!],
        ),
      );
    }
    if (pairs.length >= 2) {
      out.push(el("div", "label-lists", pairs));
      i += pairs.length * 2;
    } else {
      out.push(nodes[i]!);
      i += 1;
    }
  }
  return out;
}

/** Three or more labeled paragraphs in a row, a method each, as cards side by side. */
function labeledGrid(nodes: Node[]): Node[] {
  const out: Node[] = [];
  let run: Element[] = [];
  const flush = () => {
    if (run.length >= 3) out.push(el("div", "labeled-grid", run));
    else out.push(...run);
    run = [];
  };
  for (const n of nodes) {
    if (labeledP(n) && !labelOnly(n)) run.push(n);
    else {
      flush();
      out.push(n);
    }
  }
  flush();
  return out;
}

/** Handles a report credits whose GitHub account is gone, so a profile link would be a 404. The
 *  item's own link to the work carries the credit. `tornadocontrib`: pull request #683 in
 *  `etclabscore/core-geth` shows its author as `ghost`, GitHub's name for a deleted account. */
const GONE_ACCOUNTS = new Set(["tornadocontrib"]);

/** A list of contributors, each item opening with a handle ("**@name**"), as cards. */
function credits(nodes: Node[]) {
  for (const list of nodes.filter((n): n is Element => isList(n))) {
    const items = list.children.filter((c): c is Element => isEl(c, "li"));
    const handle = (li: Element) => meaningful(li.children)[0];
    if (items.length < 2 || !items.every((li) => /^@/.test(textOf(handle(li)).trim()))) continue;
    addClass(list, "credits");
    for (const li of items) {
      addClass(li, "credit");
      const h = handle(li);
      if (!isEl(h, "strong")) continue;
      addClass(h, "credit__handle");
      // The handle links to its GitHub profile, unless the report already links it.
      const name = textOf(h)
        .trim()
        .match(/^@([A-Za-z0-9-]+)$/)?.[1];
      if (name && !GONE_ACCOUNTS.has(name) && !h.children.some((c) => isEl(c, "a")))
        h.children = [el("a", null, h.children, [["href", `https://github.com/${name}`]])];
    }
  }
}

/** Under each reference, where it goes: its host and the first two parts of its path, in the tone of
 *  the repository it points into, as every mention of either repository is. */
function referenceHosts(nodes: Node[]) {
  for (const list of nodes.filter((n): n is Element => isList(n))) {
    for (const li of list.children.filter((c): c is Element => isEl(c, "li"))) {
      const kids = meaningful(li.children);
      if (kids.length !== 1 || !isEl(kids[0], "a")) continue;
      const href = attr(kids[0], "href") ?? "";
      const m = href.match(/^https?:\/\/([^/?#]+)((?:\/[^/?#]+){0,2})/);
      if (!m) continue;
      const tone = /\/etclabscore\//.test(href)
        ? "namespace--previous"
        : /\/ethereumclassic\//.test(href)
          ? "namespace--current"
          : null;
      li.children.push(el("span", ["ref-host", ...(tone ? [tone] : [])], [txt(m[1]! + m[2]!)]));
    }
  }
}

/** A section's own content, arranged by what its kind is. */
function arrange(nodes: Node[], kind: string | undefined): Node[] {
  let out = labelLists(nodes.filter((n) => !isBlank(n)));
  if (kind === "report-section--method") out = labeledGrid(out);
  if (kind === "report-section--credits") credits(out);
  if (kind === "report-section--references") referenceHosts(out);
  if (kind === "report-section--lineage") out = out.map(lineage);
  return out;
}

/** A section's list of who held the work in turn, each item opening with a bold name ("**ETC Labs**
 *  developed ..."), as the timeline rail, the name as each stage's title. It keeps the order it
 *  happened in: a history that is not a list of releases is never reversed. */
function lineage(node: Node): Node {
  if (!isList(node)) return node;
  const items = (node as Element).children.filter((c): c is Element => isEl(c, "li"));
  if (items.length < 2 || !items.every((li) => isEl(meaningful(li.children)[0], "strong")))
    return node;
  return el(
    "ol",
    "report-rail",
    items.map((li) => {
      const name = meaningful(li.children)[0] as Element;
      const rest = trimStart(li.children.slice(li.children.indexOf(name) + 1));
      return el("li", "report-rail__item", [
        el("p", "report-rail__title", name.children),
        el("div", "report-rail__body", rest),
      ]);
    }),
  );
}

/** Splits `nodes` at each element matching `starts`; returns [lead, ...groups]. */
function split(nodes: Node[], starts: (n: Node) => boolean): Node[][] {
  const groups: Node[][] = [[]];
  for (const n of nodes) {
    if (starts(n)) groups.push([n]);
    else groups[groups.length - 1]!.push(n);
  }
  return groups;
}

function dropRules(nodes: Node[]): Node[] {
  const kept = nodes.filter((n) => !isEl(n, "hr"));
  while (kept.length && isBlank(kept[kept.length - 1])) kept.pop();
  return kept;
}

function findingCard(group: Node[]): Element {
  const body = group.flatMap(block);
  const chips: Element[] = [];
  const grid = body.find((n): n is Element => isEl(n, "dl"));
  const severity = grid?.children
    .filter((row): row is Element => isEl(row))
    .map((row) => elements(row, "dt").concat(elements(row, "dd")))
    .find(([dt]) => textOf(dt).trim() === "Severity");
  if (severity) {
    const found = chipFor(textOf(severity[1]).trim());
    if (found) chips.push(chip(`${found.word} severity`, found.tone));
  }
  const exploited = body.some(
    (n) => isEl(n, "p") && /^Observed Attack/i.test(textOf(meaningful(n.children)[0]).trim()),
  );
  if (exploited) chips.push(chip("Exploited", "chip--vulnerable"));
  const [heading, ...rest] = body;
  return el("article", "finding", [
    heading!,
    ...(chips.length ? [el("p", "finding__chips", chips)] : []),
    ...rest,
  ]);
}

// In the section an operator acts on, each release's entry names what it fixed, left open and
// introduced, and the toolchain it was built with, as bold labels inside one paragraph. Each label
// becomes a row of its own, its chip beside its clause, the same rows the census on /security/
// draws, and the releases run newest first, so the release to run leads and the most exposed one
// closes the list (maintainer, 2026-11-03). The chips use the census's words for what each label
// means to an operator: "Fixed" is Issues fixed, "Open" and "Left open" are Unaddressed issues,
// "Introduced" is Added regressions, red unless the release introduced nothing, and "Toolchain"
// is Unsupported toolchain, red, where its clause says the toolchain is past its end of life.
// "Resolution", the one label of the release that fixes everything, is Remediation, the security
// term for what that entry describes (maintainer, 2026-11-03).
const RELEASE_LABEL = /^(Open|Left open|Fixed|Resolution|Introduced|Toolchain)[:.]?$/;
const releaseVersion = (node: Node | undefined) =>
  textOf(node)
    .match(/^\s*v(\d+)\.(\d+)\.(\d+)/)
    ?.slice(1)
    .map(Number) ?? null;

function releaseChip(label: string, clause: string): Element {
  if (label === "Open" || label === "Left open")
    return chip("Unaddressed issues", "chip--vulnerable");
  if (label === "Fixed") return chip("Issues fixed", "chip--fixed");
  if (label === "Resolution") return chip("Remediation", "chip--fixed");
  if (label === "Introduced")
    return chip("Added regressions", /^nothing\b/i.test(clause) ? null : "chip--vulnerable");
  // The markdown wraps lines, so a phrase can break across one.
  return /end[\s-]+of[\s-]+life|out\s+of\s+support/i.test(clause)
    ? chip("Unsupported toolchain", "chip--vulnerable")
    : chip(label, null);
}

function trimEnd(nodes: Node[]): Node[] {
  while (nodes.length && isBlank(nodes[nodes.length - 1])) nodes.pop();
  const last = nodes[nodes.length - 1];
  if (last?.type === "text") nodes[nodes.length - 1] = txt(last.value.replace(/\s+$/, ""));
  return nodes;
}

/** The release's name and the labels in its entry, or null if the item is not a release. */
function releaseParts(li: Element) {
  const name = meaningful(li.children)[0];
  const labels = li.children.filter(
    (c): c is Element => isEl(c, "strong") && RELEASE_LABEL.test(textOf(c).trim()),
  );
  if (!isEl(name, "strong") || !releaseVersion(name) || !labels.length) return null;
  return { name, labels };
}

function releaseEntry(li: Element, { name, labels }: { name: Element; labels: Element[] }) {
  addClass(li, "release");
  addClass(name, "release-name");
  const [head = [], ...groups] = split(li.children, (n) => isEl(n) && labels.includes(n));
  const rows = groups.map(([strong, ...clause]) => {
    const value = trimEnd(trimStart(clause));
    const label = textOf(strong).trim().replace(/[:.]$/, "");
    return el("div", "release-facts__row", [
      el("dt", null, [releaseChip(label, value.map(textOf).join(""))]),
      el("dd", null, value),
    ]);
  });
  li.children = [el("p", "release__head", trimEnd(head)), el("dl", "release-facts", rows)];
}

/**
 * A list holding a run of releases, as that run in a list of its own, newest first, with any
 * other items before or after it kept in lists of their own, in place. Null if the node is not a
 * list, holds fewer than two releases, or interleaves them with other items.
 */
function releaseList(node: Node): Node[] | null {
  if (!isEl(node) || (node.tagName !== "ul" && node.tagName !== "ol")) return null;
  const items = node.children.filter((c): c is Element => isEl(c, "li"));
  const parts = items.map(releaseParts);
  const first = parts.findIndex(Boolean);
  const end = parts.findLastIndex(Boolean) + 1;
  if (end - first < 2 || parts.slice(first, end).some((p) => !p)) return null;
  const releases = items.slice(first, end);
  releases.forEach((li, i) => releaseEntry(li, parts[first + i]!));
  const key = (li: Element) => releaseVersion(meaningful(li.children)[0])!;
  releases.sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    return y[0]! - x[0]! || y[1]! - x[1]! || y[2]! - x[2]!;
  });
  const list = (lis: Element[], className: string | null) =>
    lis.length ? [el(node.tagName, className, lis)] : [];
  return [
    ...list(items.slice(0, first), null),
    releaseTabs(releases),
    ...list(items.slice(end), null),
  ];
}

function releaseLists(node: Node) {
  if (!isEl(node)) return;
  node.children = node.children.flatMap((child) => releaseList(child) ?? [child]);
  node.children.forEach(releaseLists);
}

function section(group: Node[]): Element {
  const [heading, ...rest] = dropRules(group);
  const title = textOf(heading).trim();
  const kind = SECTION_KINDS.find(([rx]) => rx.test(title))?.[1];
  const cards = /^Vulnerability Details$/i.test(title);
  const [lead = [], ...subs] = split(rest.flatMap(swallowedLabel), (n) => isEl(n, "h3"));
  const body = subs.flatMap((g) => {
    if (cards || /^(CVE-\d{4}-\d+|Finding\b)/.test(textOf(g[0]).trim()))
      return [findingCard(dropRules(g))];
    const nodes = dropRules(g).flatMap(block);
    // Modules under a heading that says they were removed read as a Removed column does.
    if (/\bremoved\b/i.test(textOf(g[0])))
      for (const n of nodes)
        if (isEl(n, "ul") && attr(n, "class") === "modules") addClass(n, "modules--removed");
    return nodes;
  });
  const built = el(
    "section",
    // The sponsor note sits in the site's corner brackets, as the support band does.
    [
      "report-section",
      ...(kind ? [kind] : []),
      ...(kind === "report-section--support" ? ["bracketed"] : []),
    ],
    [
      heading!,
      ...arrange(lead.flatMap(block), kind),
      ...(cards ? [findingTabs(body as Element[])] : body),
    ],
  );
  if (kind === "report-section--action") releaseLists(built);
  cardLists(built);
  return built;
}

/**
 * The findings of "Vulnerability Details" as tabs, one finding at a time, so the page does not run
 * every card end to end (maintainer, 2026-11-03). There is no script: each tab is a link to its
 * finding's own heading, and CSS shows the panel holding the link target, the first one when none
 * is targeted. So a link to a finding, from this page or another, opens its tab, and a browser
 * without `:has()`, a reader with CSS off and a crawler get every card, stacked, as before.
 */
function findingTabs(cards: Element[]): Element {
  const tabs = cards.map((card) => {
    const h3 = card.children.find((c): c is Element => isEl(c, "h3"));
    // The card's chips, its severity as the word alone ("High"), and "Exploited" where it was.
    const chips = elements(
      card.children.find(
        (c): c is Element => isEl(c, "p") && attr(c, "class") === "finding__chips",
      ),
      "span",
    ).map((c) =>
      el("span", (attr(c, "class") ?? "chip").split(" "), [
        txt(textOf(c).replace(/ severity$/, "")),
      ]),
    );
    return {
      id: (h3 && attr(h3, "id")) ?? "",
      name: textOf(h3).trim().split(":")[0]!.trim(),
      chips,
      panel: [card],
    };
  });
  return reportTabs(tabs, "report-tabs--findings");
}

/**
 * Tabs with no script, for the findings and for the releases an operator picks from: each tab is
 * a link to an anchor in its panel, and CSS shows the panel holding the link target, the first one
 * when none is targeted. A link to a panel's anchor, from this page or another, opens its tab, and
 * a browser without `:has()`, a reader with CSS off and a crawler get every panel, stacked.
 */
function reportTabs(
  tabs: { id: string; name: string; chips: Element[]; panel: Node[] }[],
  kind: string,
): Element {
  return el(
    "div",
    ["report-tabs", kind],
    tabs.map((tab) =>
      el("div", "report-tab", [
        el(
          "a",
          "report-tab__label",
          [
            el("span", "report-tab__name", [txt(tab.name)]),
            ...(tab.chips.length ? [el("span", "report-tab__chips", tab.chips)] : []),
          ],
          [["href", `#${tab.id}`]],
        ),
        el("div", "report-tab__panel", tab.panel),
      ]),
    ),
  );
}

/**
 * The releases in "What operators need to do" as tabs, newest first, so the release to run is the
 * one that shows (maintainer, 2026-11-03). Each panel is anchored by its version, and each tab says
 * in the census's words whether its release is the one to run or still vulnerable: a release with an
 * unaddressed issue is vulnerable, one whose entry is a remediation is recommended.
 */
function releaseTabs(releases: Element[]): Element {
  const tabs = releases.map((li) => {
    const head = li.children.find((c): c is Element => isEl(c, "p"));
    const version = releaseVersion(head) ?? [];
    const id = `release-v${version.join("-")}`;
    if (head) head.attrs.push(["id", id]);
    const states = [...serialize(li).matchAll(/class="chip[^"]*">([^<]+)</g)].map((m) => m[1]);
    const status = states.includes("Unaddressed issues")
      ? chip("Vulnerable", "chip--vulnerable")
      : states.includes("Remediation")
        ? chip("Recommended", "chip--fixed")
        : null;
    const name = textOf(head?.children.find((c) => isEl(c, "strong"))).trim();
    return {
      id,
      name,
      chips: status ? [status] : [],
      panel: [el("div", "release", li.children)],
    };
  });
  return reportTabs(tabs, "report-tabs--releases");
}

/** The report's sections, for the contents list. */
export interface ReportHeading {
  slug: string;
  text: string;
}

/**
 * Gives the rendered report the site's design. Returns the HTML and the h2s, in order, for the
 * contents list. Throws if the HTML does not read back exactly as it was given, so a change in the
 * markdown processor's output fails the build instead of rendering something unchecked.
 */
export function designReport(html: string): { html: string; contents: ReportHeading[] } {
  const tree = parse(html);
  if (serialize(tree) !== html)
    throw new Error("report HTML: it does not read back as it was given");
  const [lead = [], ...groups] = split(tree.children, (n) => isEl(n, "h2"));
  const contents = groups.map((g) => {
    const h2 = g[0] as Element;
    return { slug: attr(h2, "id") ?? "", text: textOf(h2).trim() };
  });
  const front = labeledFacts(dropRules(lead).flatMap(block));
  repositoryChips(front);
  tree.children = [
    ...(meaningful(front).length ? [el("div", "report-front", front)] : []),
    ...groups.map(section),
  ];
  toneReleaseLinks(tree);
  keepCase(tree);
  return { html: serialize(tree), contents };
}

/** A fact's name, a table head and a label are set in capitals, which would change a version or
 *  an identifier in one, so each such token keeps its case (`src/lib/keep-case.ts`). */
function keepCase(node: Element, inLabel = false) {
  const label =
    inLabel ||
    node.tagName === "dt" ||
    node.tagName === "th" ||
    (attr(node, "class") ?? "").split(/\s+/).includes("labeled__label");
  node.children = node.children.flatMap((child): Node[] => {
    if (child.type === "element") {
      if (child.tagName !== "code") keepCase(child, label);
      return [child];
    }
    if (!label) return [child];
    return caseRuns(child.value).map((run) =>
      run.keep ? el("span", "keep-case", [txt(run.text)]) : txt(run.text),
    );
  });
}
