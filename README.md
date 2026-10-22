# Commerce navigation prototype

Vanilla HTML and CSS, plus a small amount of plain JavaScript for menus and routing. No build step.

## Run it

Open `index.html` in a browser. It is the review shell: a faux browser bar, the prototype in a
frame, and a panel at the bottom left. Host Grotesk loads from Google Fonts, so you need to be
online for the font.

## Review shell

- **Version**: Desktop or Mobile. **Variation**: Desktop has 1; Mobile has 1 (push down) and
  2 (floating). **Page**: jump to Commerce, BigCommerce or Feedonomics.
- **Review** opens the open questions for the current version and variation (edit them in
  `js/shell.js`).
- The **gear** (bottom right) tunes animation timing, hover-focus dimming and placeholder content
  live. **Copy changes** copies what you changed; **Reset all** restores the defaults.
- The address bar and URL follow the page you are on. Links look like
  `index.html#mobile-2/bigcommerce/pricing` (version-variation/page), so you can share an exact
  state. Back and forward in the address bar step through pages inside the prototype.
- `desktop.html` and `mobile.html` still open on their own, with their own page switcher.

To host it, publish the folder with GitHub Pages (deploy from `main`, root). `index.html` is the entry point.

## Pages

Every nav and sub-nav item has its own page. The page heading and the browser tab
title are both the item's label (✦ and ™ are dropped).

Routes live in the URL hash: `#/<section>` for a home page and
`#/<section>/<item>` for everything else, for example `#/bigcommerce/pricing`,
`#/feedonomics/supported-platforms` or `#/commerce/manufacturing`.
Sections are `commerce`, `bigcommerce` and `feedonomics`, and a page opens with
the matching bar: the Commerce bar alone, or the Commerce bar plus that Solution's bar.

- Routes are generated in `js/nav.js` from the links in `desktop.html`, so adding a
  link to the markup gives it a page automatically.
- Items that appear in more than one menu share one page.
- Menu buttons (Solutions, Learning, Product Features, Integrations, Resources) open
  their menu when clicked. Their own pages exist, for example `#/commerce/learning`,
  but are only reachable by URL for now.
- The two AI Labs links share one page, titled "AI Labs".
- The nav item that owns the current page stays highlighted. Inside BigCommerce or
  Feedonomics, Solutions stays highlighted too.

## Behavior

- Menus open on click. Esc, clicking outside, or clicking the dimmed page closes them.
- The Commerce bar is sticky on Commerce pages. On BigCommerce and Feedonomics pages it
  sits at the top of the page and scrolls away; the Solution bar stays pinned.
- Menu links: on hover the text goes medium weight, nudges 4px right, and an arrow fades in.
  Product names (BigCommerce, Feedonomics) show only the arrow.
- Nav items reveal a Surface/Secondary fill on hover and while their menu is open, with 4px between items.
- Commerce bar menus open under their own nav item. On BigCommerce and Feedonomics pages the
  Solution bar's first item lines up with the Commerce bar's first item.
- Focus: hovering (or tabbing to) any menu item quickly dims the other items, then they fade back
  in after a short pause. A product's header stays lit while one of its features is hovered, and
  the group titles (Industries, Teams) dim like items. The section labels (Products, Capabilities)
  stay at full strength. Tune `--focus-dim`, `--focus-return-delay` and `--focus-return-time`.
- Cards (Surface, Integrations, the AI Labs strip) are one big link: the whole card is clickable,
  tints on hover, and gets a single focus outline. The strip's duplicate "Learn more" is skipped
  by keyboard. The Developers and Build blocks hold several links, so they are not whole-card links.
- Menus don't shift on hover: each link reserves its medium-weight width up front (`js/nav.js`).

## Mobile

Pick Mobile in the review shell, or open `mobile.html` on its own (on a desktop it shows a 390px
column, with a pill at the bottom to switch page and option; `?v=1` or `?v=2` picks the option).

- Option 1, push down: the Commerce menu expands under the Commerce bar and pushes the product
  bar down. Opening the product menu collapses the Commerce menu, and the other way round.
- Option 2, floating: the product bar stays under the Commerce bar and the Commerce menu opens as
  a floating card below it. Opening the product menu expands it in place and pushes the card down.
- Menu rows with a chevron drill into a panel with a Back row. Customers, Company and Partners
  go straight to their pages.
- The Commerce bar is sticky on Commerce pages; on BigCommerce and Feedonomics pages it scrolls
  away and the product bar stays pinned.
- `mobile.html` is generated from the menus in `desktop.html`, so links and content match desktop.
  After changing a desktop menu, run `python3 tools/build-mobile.py`.

## Files

- `index.html`, `css/shell.css`, `js/shell.js`: review shell (version and variation switcher, review notes, live controls)
- `js/embed.js`: lets the prototype pages talk to the shell
- `desktop.html`: markup for both bars, every menu, and the wireframe page
- `css/styles.css`: tokens (BC mode of the Multi-Brand design system), components, motion
- `js/nav.js`: menu state, routing, viewport fitting
- `mobile.html`, `css/mobile.css`, `js/mobile.js`: mobile prototype (generated by `tools/build-mobile.py`)
- `assets/`: Commerce logo and the eight Feedonomics platform logos

## Motion

All timing and easing live as variables at the top of `css/styles.css`
(`--ease`, `--ease-out`, `--ease-soft`, `--t-fill`, `--t-menu`, `--t-scrim`), plus the
focus timings above. Logo width and the logo-to-nav gap are `--logo-w` and `--nav-gap`.
`prefers-reduced-motion` turns animation off.
