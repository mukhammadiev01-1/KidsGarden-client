# Route stylesheets

Until 2026-10-02 every page downloaded one 925 KB (100 KB gzipped) stylesheet:
`scss/pc/*` and `scss/mobile/main.scss`, imported from `pages/_app.tsx`. The
same rules now live here, split by the pages that can reach them:

| file | imported from | contains |
| --- | --- | --- |
| `core.scss` | `pages/_app.tsx` | shared cards and the AI assistant widget — the first styles in the cascade |
| `<group>.route.scss` | the page(s) of that group (`LayoutAdmin` for the admin pages) | every rule a page of that group may need: the shared rules **and** the group's own, in the original source order |
| `global.route.scss` | pages with no styles of their own (`/messages`, `/store`) | the shared rules alone |

The shared rules (layout chrome, chat panel, notification popover, keyframes;
about 90 KB raw) are repeated in each route file on purpose. Loading them once
from `_app` would put them *before* every route rule, but in the original
stylesheets they interleaved with the route rules, and several same-specificity
pairs depended on that order — the first attempt shifted the phone Help Center
by 4 px. A route file is simply the original cascade with the other routes'
rules removed, so each page sees exactly what it saw before.

`next.config.js` adds a webpack rule so `*.route.scss` files go through Next's
global-CSS pipeline (no CSS-module renaming) while webpack still chunks them per
page. Next swaps page CSS on client-side navigation, so only the current
route's file is in the document at any time.

## Editing

Edit the route file of the page you are changing. A rule that must apply on
every page goes into `global.route.scss` **and** every `*.route.scss` (keep its
position relative to its neighbours), or — when its position does not matter —
into `core.scss`. The split was mechanical; `scripts/qa/` has the
screenshot-and-compare tooling used to verify it, which is the right check for
any larger reshuffle here.
