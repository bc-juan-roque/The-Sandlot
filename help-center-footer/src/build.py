#!/usr/bin/env python3
"""Inline every assets/*.svg referenced by footer.html as a data URI -> ../index.html (self-contained)."""
import base64, pathlib, re

here = pathlib.Path(__file__).parent
html = (here / "footer.html").read_text()

def inline(m):
    data = (here / m.group(1)).read_bytes()
    return 'src="data:image/svg+xml;base64,' + base64.b64encode(data).decode() + '"'

out = re.sub(r'src="(assets/[^"]+\.svg)"', inline, html)
(here.parent / "index.html").write_text(out)
print("wrote", here.parent / "index.html", f"({len(out):,} bytes)")
