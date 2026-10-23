#!/usr/bin/env python3
"""Builds ../index.html, the single self-contained page that gets published.

    python3 commerce-nav/src/build.py

Edit the files in this folder, never ../index.html:
  shell.template.html   review shell (version / variation switcher, notes, controls)
  desktop.html          desktop prototype
  (mobile page)         generated here from the menus in desktop.html
  css/, js/, assets/    inlined into the output
"""
import base64, json, pathlib, re

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent / "index.html"


def read(rel):
    return (SRC / rel).read_text()


def build_mobile(src):
    i = src.index('<div class="modal-root"')
    j = src.index('<script src="js/nav.js">')
    modal = src[i:j].rstrip()
    """Mobile page markup, generated from the menus in desktop.html so links and content match."""
    def menu_inner(menu_id):
        idx = src.index(f'id="{menu_id}"')
        start = src.rfind("<div", 0, idx)
        open_end = src.index(">", start) + 1
        depth, pos = 1, open_end
        for m in re.finditer(r"<div\b|</div>", src[open_end:]):
            depth += 1 if m.group(0) == "<div" else -1
            if depth == 0:
                pos = open_end + m.start()
                break
        inner = src[open_end:pos]
        inner = re.sub(r'\s+reveal"', '"', inner)           # no desktop entrance animation
        inner = re.sub(r'\s+style="--d:\d+"', "", inner)
        return inner.strip()

    sprite = re.search(r'<svg width="0".*?</svg>', src, re.S).group(0)
    chev = '<svg aria-hidden="true"><use href="#i-chevron"/></svg>'

    def view(vid, title, menu_id, section):
        return f'''
            <div class="m-view m-view--sub" id="{vid}" data-section="{section}" role="region" aria-label="{title}">
              <button class="m-back" type="button" data-back>{chev}<span>{title}</span></button>
              <div class="m-view__body">
    {menu_inner(menu_id)}
              </div>
            </div>'''

    def drill(vid, label):
        return f'<button class="m-row" type="button" data-drill="{vid}"><span class="m-row__label">{label}</span>{chev}</button>'

    def link(label):
        return f'<a class="m-row" href="#"><span class="m-row__label">{label}</span>{chev}</a>'

    commerce_menu = f'''
          <div class="m-menu" id="m-commerce-menu" data-section="commerce" data-owner="commerce">
            <div class="m-menu__inner">
              <div class="m-views">
                <div class="m-view m-view--root is-active" data-section="commerce">
                  {drill("v-solutions", "Solutions")}
                  {drill("v-learning", "Learning")}
                  {link("Customers")}
                  {link("Company")}
                  {link("Partners")}
                  <div class="m-actions"><a class="btn btn--primary" href="#" data-open-modal><span>Contact sales</span></a></div>
                </div>
    {view("v-solutions", "Solutions", "menu-solutions", "commerce")}
    {view("v-learning", "Learning", "menu-learning", "commerce")}
              </div>
            </div>
          </div>'''

    def product(brand, name, rows, subviews, actions):
        return f'''
        <div class="m-product" data-brand="{brand}">
          <button class="m-productbar" type="button" aria-expanded="false" aria-controls="m-{brand}-menu" data-product="{brand}">
            <span class="m-productbar__name"><span class="m-productbar__slash" aria-hidden="true">/</span>{name}</span>
            {chev}
          </button>
          <div class="m-menu" id="m-{brand}-menu" data-section="{brand}" data-owner="{brand}">
            <div class="m-menu__inner">
              <div class="m-views">
                <div class="m-view m-view--root is-active" data-section="{brand}">
                  {rows}
                  <div class="m-actions">{actions}</div>
                </div>
    {subviews}
              </div>
            </div>
          </div>
        </div>'''

    bc = product(
        "bigcommerce", "BigCommerce",
        "\n              ".join([drill("v-bc-features", "Product Features"), link("Services"), link("Integrations"), link("Pricing"), drill("v-bc-resources", "Resources")]),
        view("v-bc-features", "Product Features", "menu-bc-features", "bigcommerce") + view("v-bc-resources", "Resources", "menu-bc-resources", "bigcommerce"),
        '<a class="btn btn--text-row" href="#"><span>Login</span></a>\n'
        '              <a class="btn btn--secondary" href="#"><span>Free trial</span></a>\n'
        '              <a class="btn btn--primary" href="#"><span>Get a demo</span></a>')
    fdx = product(
        "feedonomics", "Feedonomics",
        "\n              ".join([drill("v-fdx-features", "Product Features"), drill("v-fdx-integrations", "Integrations"), link("Services"), link("Pricing"), drill("v-fdx-resources", "Resources")]),
        view("v-fdx-features", "Product Features", "menu-fdx-features", "feedonomics") + view("v-fdx-integrations", "Integrations", "menu-fdx-integrations", "feedonomics") + view("v-fdx-resources", "Resources", "menu-fdx-resources", "feedonomics"),
        '<a class="btn btn--text-row" href="#"><span>Login</span></a>\n'
        '              <a class="btn btn--primary" href="#"><span>Get a demo</span></a>')

    page = '''
        <main class="m-page" id="page">
          <h1 class="wf-title" data-page-title>Commerce</h1>
          <div class="wf-line" style="width:92%"></div>
          <div class="wf-line" style="width:78%"></div>
          <div class="wf-line" style="width:56%"></div>
          <div class="wf-btns"><div class="wf-btn"></div><div class="wf-btn ghost"></div></div>
          <div class="wf-img"></div>
          <div class="wf-logos m-logos"><div class="wf-logo"></div><div class="wf-logo"></div><div class="wf-logo"></div><div class="wf-logo"></div></div>
          <div class="m-cards">
            <div class="wf-card"><div class="wf-img sm"></div><div class="wf-line" style="width:70%"></div><div class="wf-line" style="width:90%"></div></div>
            <div class="wf-card"><div class="wf-img sm"></div><div class="wf-line" style="width:60%"></div><div class="wf-line" style="width:84%"></div></div>
            <div class="wf-card"><div class="wf-img sm"></div><div class="wf-line" style="width:76%"></div><div class="wf-line" style="width:48%"></div></div>
          </div>
          <div class="wf-footer m-footer"></div>
        </main>'''

    html = f'''<!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <title>Commerce · Mobile navigation prototype</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300..800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="css/styles.css">
      <link rel="stylesheet" href="css/mobile.css">
    </head>
    <body data-page="commerce" data-variant="1">
      <!-- Generated by tools/build-mobile.py from index.html. Edit that script, not this file. -->
      {sprite}

      <div class="m-app">
        <div class="m-scrim" data-scrim></div>

        <header class="m-head">
          <div class="m-commerce">
            <div class="m-bar">
              <a class="m-logo" href="#/commerce" data-route="commerce" aria-label="Commerce home"><img src="assets/commerce-black.svg" alt="Commerce" width="136" height="20"></a>
              <button class="m-toggle" type="button" aria-expanded="false" aria-controls="m-commerce-menu" aria-label="Menu" data-toggle="commerce"><span class="m-toggle__bars"><i></i><i></i></span></button>
            </div>
            <div class="m-slot" data-slot="inline">{commerce_menu}
            </div>
          </div>
    {bc}
    {fdx}
          <div class="m-anchor" data-slot="float"></div>
        </header>
    {page}

        <nav class="m-switch" aria-label="Prototype controls">
          <div class="m-switch__row" role="group" aria-label="Page">
            <a href="#/commerce" data-route="commerce">Commerce</a>
            <a href="#/bigcommerce" data-route="bigcommerce">BigCommerce</a>
            <a href="#/feedonomics" data-route="feedonomics">Feedonomics</a>
          </div>
          <div class="m-switch__row" role="group" aria-label="Menu option">
            <button type="button" data-variant="1">1 · Push down</button>
            <button type="button" data-variant="2">2 · Floating</button>
          </div>
        </nav>
      </div>

      {modal}
      <script src="js/mobile.js"></script>
      <script src="js/modal.js"></script>
      <script src="js/embed.js"></script>
    </body>
    </html>
    '''

    return html


def datauri(rel):
    return "data:image/svg+xml;base64," + base64.b64encode((SRC / rel).read_bytes()).decode()


def inline(html):
    """Inline stylesheets, scripts and svg images so the page needs nothing else."""
    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', lambda m: "<style>\n" + read(m[1]) + "\n</style>", html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: "<script>\n" + read(m[1]) + "\n</script>", html)
    html = re.sub(r'src="(assets/[^"]+\.svg)"', lambda m: 'src="' + datauri(m[1]) + '"', html)
    return html


def js_string(s):
    # JSON string that is safe to embed in a <script> block
    return json.dumps(s).replace("</", "<\\/").replace("<!--", "<\\!--")


def main():
    desktop = read("desktop.html")
    pages = {
        "desktop": inline(desktop),
        "mobile": inline(build_mobile(desktop)),
    }
    # The shell puts the starting page and option into each frame through this marker
    for k in pages:
        pages[k] = pages[k].replace("<head>", "<head>\n<!--BOOT-->", 1)

    shell = inline(read("shell.template.html"))
    pages_js = "<script>window.__PAGES = {" + ",".join(f'"{k}": {js_string(v)}' for k, v in pages.items()) + "};</script>"
    shell = shell.replace("<!--PAGES-->", pages_js, 1)
    OUT.write_text(shell)
    print(f"wrote {OUT.relative_to(SRC.parent.parent)}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
