# Commerce navigation prototype

Vanilla HTML and CSS, plus a small amount of plain JavaScript for menus and routing. No build step.

## Run it

Open `index.html` in a browser. Host Grotesk loads from Google Fonts, so you need to be online for the font.

Use the small pill at the bottom left to jump to the three home pages
(Commerce, BigCommerce, Feedonomics).

## Pages

Every nav and sub-nav item has its own page. The page heading and the browser tab
title are both the item's label (✦ and ™ are dropped).

Routes live in the URL hash: `#/<section>` for a home page and
`#/<section>/<item>` for everything else, for example `#/bigcommerce/pricing`,
`#/feedonomics/supported-platforms` or `#/commerce/manufacturing`.
Sections are `commerce`, `bigcommerce` and `feedonomics`, and a page opens with
the matching bar: the Commerce bar alone, or the Commerce bar plus that Solution's bar.

- Routes are generated in `js/nav.js` from the links in `index.html`, so adding a
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

## Files

- `index.html`: markup for both bars, every menu, and the wireframe page
- `css/styles.css`: tokens (BC mode of the Multi-Brand design system), components, motion
- `js/nav.js`: menu state, routing, viewport fitting
- `assets/`: Commerce logo and the eight Feedonomics platform logos

## Motion

All timing and easing live as variables at the top of `css/styles.css`
(`--ease`, `--ease-out`, `--ease-soft`, `--t-fill`, `--t-menu`, `--t-scrim`), plus the
focus timings above. Logo width and the logo-to-nav gap are `--logo-w` and `--nav-gap`.
`prefers-reduced-motion` turns animation off.
