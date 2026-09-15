# Negle — build spec

A daily geography guessing game. Instead of showing the target country's
outline (like Worldle) or a scaled/rotated silhouette (like our earlier
Driftle prototype), Negle shows **only its land neighbors** — as dots at
their real relative positions, correctly labeled — with the target itself
left as a blank gap. You guess the missing country by reasoning about what
fits between its neighbors, not by recognizing a shape.

This avoids Worldle's core weakness (shape memorization solves it) because
no shape is ever shown.

## How it plays

- One **Daily** puzzle per day, same for everyone (seeded from the date).
- A **Practice** mode for unlimited random rounds.
- 6 guesses max, Wordle-style.
- Feedback per wrong guess: distance (km) + compass bearing to the real
  target, colour-coded hot/warm/cold.
- Progressive hints on wrong guesses:
  - Guess 1 → second-ring neighbors (neighbors-of-neighbors) fade in as
    small unlabeled context dots.
  - Guess 2 → letter-count / first-letter hint (`D _ _ . R _ _ . C _ _ _ _`).
  - Guess 3 → size comparison ("roughly the size of France").
- **Copy result** produces a shareable Wordle-style block: puzzle number,
  score, a row of colored squares, and a link.

## Current state

This folder is a working prototype, not a finished product. Everything
runs client-side from one static HTML file — no backend, no build step
needed to *play* it.

```
negle-build/
├── data/
│   ├── build-data.js      # regenerates negle-data.json from world-atlas
│   ├── negle-data.json    # pre-built: 175 countries, centroids, land-
│   │                        neighbor adjacency, area in km²
│   └── package.json       # deps for build-data.js (world-atlas, d3-geo,
│                             topojson-client)
└── web/
    ├── index.html          # the playable game, data already embedded
    └── index.template.html # same file with `__DATA__` as a placeholder,
                               so you can regenerate data and re-inject it
```

To rebuild the data (e.g. after tuning the country pool or adjacency
rules):

```
cd data && npm install && npm run build
# then inject data/negle-data.json in place of __DATA__ in
# web/index.template.html to produce a new web/index.html
```

## Design notes worth knowing before you touch the code

- **Country pool**: targets are limited to countries with 3–8 land
  neighbors (107 of 175). Fewer than 3 neighbors makes the puzzle
  trivially easy or impossible (islands have zero); more than 8 gets
  visually cluttered on a small board. This is a tunable filter in
  `build-data.js`, not a hard constraint of the concept.
- **Positioning**: neighbor dots are placed with a flat local
  approximation (equirectangular with a cos-latitude correction) centered
  on the target's own centroid, not a proper projection. Fine for a
  compact adjacency cluster; would distort noticeably for very large
  countries (Russia, Canada) or polar targets if those get added to the
  pool later.
- **Daily seed**: `dailyTargetName()` hashes `"negle-" + puzzleNumber`
  and indexes into `DATA.targets`. It's deterministic and simple, but not
  cryptographically distributed — fine for this use case, but note that
  changing the `targets` array (e.g. regenerating data with a different
  pool) will shift which country lands on which day.
- **No persistence**: nothing is saved between sessions. Refreshing
  resets Daily progress; there's no streak tracking, no "you already
  played today" gate, no history.

## Suggested next steps, roughly in priority order

1. **Persist daily progress** (localStorage): remember today's guesses so
   refreshing doesn't lose progress, and lock the board once solved/failed
   for the day like real Wordle does.
2. **Streak + stats** (localStorage): games played, win %, guess
   distribution, current/max streak — shown in a stats modal after each
   daily game, alongside the share button.
3. **Mobile polish**: the dot/label layout can get crowded on narrow
   screens for higher-degree countries; worth testing on an actual phone
   and adjusting label truncation / font scaling.
4. **Expand or re-tune the country pool**: right now it's whatever falls
   out of the 3–8 neighbor filter from `world-atlas`'s 110m resolution
   data. Consider hand-curating (exclude confusing micro-adjacencies,
   include popular islands via a fallback mechanic) rather than relying
   purely on the automated filter.
5. **Deploy**: static site, no backend — works as-is on GitHub Pages,
   Cloudflare Pages, or Vercel. Daily seed uses the client's local date
   right now; if you want the puzzle to change at a fixed UTC time for
   everyone rather than per-timezone, that's already how it's written
   (`dailyPuzzleNumber()` uses UTC), just worth confirming that's the
   behavior you want.
6. **Analytics** (optional): if this goes anywhere semi-public, knowing
   average guesses-to-solve per country would help tune the neighbor-pool
   and hint-timing difficulty.

## Attribution

Country boundaries, centroids, and adjacency are derived from
[Natural Earth](https://www.naturalearthdata.com/) via the
[`world-atlas`](https://github.com/topojson/world-atlas) npm package
(public domain data, no attribution legally required but nice to credit).
