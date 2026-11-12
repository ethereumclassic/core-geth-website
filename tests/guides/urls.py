"""Check that every web address a guide block fetches answers, so that a release file, a checksum, a list or an
installer that moved fails the run before a reader meets it.

    python3 tests/guides/urls.py <bundle directory>

An address holding a placeholder or a shell variable is left out. An apt source line names a repository, not
a file, so its `Release` file is checked in its place.
"""

import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

URL = re.compile(r"https://[^\s\"'`()<>]+")
APT = re.compile(r"deb \[[^\]]*\] (https://\S+) (\S+) ")


def addresses(bundle):
    """Each address, with the first block that names it."""
    found = {}
    for path in sorted(bundle.rglob("*.txt")):
        if path.name == "MANIFEST.txt":
            continue
        text = path.read_text()
        apt = {m.group(1): f"{m.group(1)}/dists/{m.group(2)}/Release" for m in APT.finditer(text)}
        for url in URL.findall(text):
            url = url.rstrip(".,;:")
            if "$" in url or "{" in url:
                continue
            found.setdefault(apt.get(url, url), path.relative_to(bundle).as_posix())
    return found


def status(url):
    """The HTTP status the address answers with after redirects, or why it could not be reached."""
    for method in ("HEAD", "GET"):
        request = urllib.request.Request(url, method=method, headers={"User-Agent": "core-geth-website guide check"})
        if method == "GET":
            request.add_header("Range", "bytes=0-0")
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.status
        except urllib.error.HTTPError as error:
            if method == "HEAD" and error.code in (403, 405):
                continue
            return error.code
        except OSError as error:
            return f"unreachable: {error}"
    return "unreachable"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    failed = 0
    found = addresses(Path(sys.argv[1]))
    for url, block in sorted(found.items()):
        code = status(url)
        ok = isinstance(code, int) and code < 400
        print(f"{'ok  ' if ok else 'FAIL'} {code} {url}" + ("" if ok else f"  (in {block})"))
        failed += not ok
    print(f"{len(found)} addresses, {failed} failed")
    sys.exit(1 if failed else 0)
