"""Write every command block on the guide pages to a file, as its copy button copies it, so the guide
workflows run exactly what a reader pastes.

    python3 tests/guides/blocks.py <dist directory> <bundle directory>

A block lands at <bundle>/<page>/<panel id>/<step>/<n>.txt, or <bundle>/<page>/<panel id>/<step>/<way>/<n>.txt
for a block inside one of a step's tabs. <page> is `install`, `migrate`, `discovery` or `downloads`; the
panel id is the one the page gives the tab's panel, such as `panel-linux` or `move-source-panel-macos`; the
step and the way are their titles and labels, in lowercase with every run of other characters as one `-`
and a version number written as `x`, so a step such as "Install Go 1.26.8" keeps its path when the pin
moves; <n> counts a step's or a way's blocks from 0. A panel's steps are its own: the steps of a set nested
in it are under that set's panels. MANIFEST.txt lists every path. A scenario names the path it runs, so a
step renamed on the page fails the scenario instead of being skipped.
"""

import html
import re
import sys
from pathlib import Path

PAGES = {
    "install": "guides/install/index.html",
    "migrate": "guides/migrate/index.html",
    "discovery": "guides/discovery/index.html",
    "downloads": "downloads/index.html",
}

CODE = re.compile(r'<pre class="shell"[^>]*><code[^>]*>(.*?)</code></pre>', re.S)
STEP = re.compile(r'<(h[45]) class="panel__step"[^>]*>(.*?)</\1>', re.S)


def slug(text):
    text = html.unescape(re.sub(r"<[^>]+>", "", text)).lower().replace("'", "").replace("’", "")
    text = re.sub(r"\d+(?:\.\d+)+", "x", text)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def element(text, at):
    """The element whose opening tag starts at `at`, through its matching closing tag."""
    tag = re.match(r"<(\w+)", text[at:]).group(1)
    depth = 0
    for t in re.finditer(rf"<(/?){tag}\b[^>]*>", text[at:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return text[at : at + t.end()]
    raise SystemExit(f"an unclosed <{tag}> at {at}")


def blocks(text):
    return [html.unescape(b) for b in CODE.findall(text)]


PANEL = re.compile(r'<div class="panel" id="([^"]+)"')


def panels(page):
    """Each tab panel on the page: its id and its own HTML, without the panels of a set nested in it."""
    for m in PANEL.finditer(page):
        panel = element(page, m.start())
        while nested := PANEL.search(panel, 1):
            panel = panel[: nested.start()] + panel[nested.start() + len(element(panel, nested.start())) :]
        yield m.group(1), panel


def steps(panel):
    """Each step of a panel: its title, its own blocks, and each way's label and blocks."""
    heads = list(STEP.finditer(panel))
    for i, h in enumerate(heads):
        body = panel[h.end() : heads[i + 1].start() if i + 1 < len(heads) else len(panel)]
        # A nested set's panel ends the body: its steps are that panel's.
        nested = re.search(r'<fieldset class="tabs', body)
        if nested:
            body = body[: nested.start()]
        ways = []
        choice = re.search(r'<div class="choice"', body)
        own = body
        if choice:
            group = element(body, choice.start())
            own = body.replace(group, "")
            labels = [html.unescape(re.sub(r"<[^>]+>", "", x)).strip()
                      for x in re.findall(r'<label class="choice__label"[^>]*>(.*?)</label>', group, re.S)]
            parts = [element(group, m.start()) for m in re.finditer(r'<div class="choice__panel"', group)]
            ways = list(zip(labels, (blocks(p) for p in parts)))
        yield h.group(2), blocks(own), ways


def bundle(dist, out):
    paths = []
    for name, rel in PAGES.items():
        page = (dist / rel).read_text()
        for pid, panel in panels(page):
            seen = set()
            for title, own, ways in steps(panel):
                key = slug(title)
                while key in seen:
                    key += "-again"
                seen.add(key)
                for n, code in enumerate(own):
                    paths.append((Path(name, pid, key, f"{n}.txt"), code))
                for label, codes in ways:
                    for n, code in enumerate(codes):
                        paths.append((Path(name, pid, key, slug(label), f"{n}.txt"), code))
    for path, code in paths:
        (out / path).parent.mkdir(parents=True, exist_ok=True)
        (out / path).write_text(code if code.endswith("\n") else code + "\n")
    (out / "MANIFEST.txt").write_text("".join(f"{p.as_posix()}\n" for p, _ in paths))
    return len(paths)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    count = bundle(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"{count} blocks written to {sys.argv[2]}")
