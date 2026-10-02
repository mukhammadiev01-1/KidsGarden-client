# Visual QA scripts

Headless-Chrome tooling for checking that a change did not move pixels. Both
scripts need Google Chrome at its default macOS location and a server to point
at (by default a production build served with `npx next start -p 3100`; set
`BASE_URL` to use another).

## Take screenshots

```sh
node scripts/qa/screenshot-routes.cjs <outDir> <desktop|mobile> <token|-> name=/path ...
```

- `desktop` renders at 1440 px with a Mac Chrome user agent; `mobile` at 390 px
  with an iPhone user agent, which is what switches the app into the
  `#mobile-wrap` layout (device detection is user-agent based).
- `token` is an access token written to `localStorage.accessToken` before the
  first route, or `-` for a signed-out session. Get one from the API's `login`
  mutation against the server the build talks to.
- Each route is captured full page (the phone layout scrolls inside
  `#mobile-wrap`, so the script grows the viewport to the tallest scroll
  container), with animations and the caret frozen. `report.json` records where
  each route actually landed and any console errors.

## Compare two runs

```sh
node scripts/qa/compare-screenshots.cjs <beforeDir> <afterDir> [diffDir]
```

Prints the share of differing pixels per image and exits 1 if any image moves
by more than `DIFF_THRESHOLD` (default 0.05 %). With `diffDir`, changed images
get a red-mask PNG there. `pngjs` is resolved from this project or, failing
that, from the mobile app's `node_modules`.

## Typical loop

1. Build and serve the current branch, capture `base-*`.
2. Apply the change, rebuild, restart the server, capture `after-*`.
3. Compare. Expected noise: carousels or relative timestamps that moved on
   their own; anything else is a regression.
