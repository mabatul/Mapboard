# Geo Comments — Solution

## Overview
Implementation of the `<geo-comments-app>` web component that integrates two
third-party widgets (an interactive map and a comments panel) with the
DummyJSON comments API. The host component owns all state and mediates
between the widgets, which never talk to each other directly.

## Project structure
- `index.html` — harness page: layout, mounts `<geo-comments-app>`
- `data/config.js` — Mapbox token + initial map view
- `data/locations.js` — location dataset `{ id, name, coordinates, postId }`
- `libs/` — third-party widgets (not modified)
- `src/main.js` — entry point, imports the component
- `src/components/geoCommentsApp.js` — host custom element
- `src/services/commentsApi.js` — API access (GET/POST)

## Running it
- Serve the folder with any static server: `npx serve .` or `python3 -m http.server 3000`
- Requires a valid Mapbox token in `data/config.js` (there is a placeholder by default)
- The DummyJSON API is used directly; `mock-api/` is an optional local fallback

## Goals

### Goal 1 — The map renders
- [x] `<interact-map>` mounted and configured from `data/config.js`
- [x] Every location from `data/locations.js` shown as a pin with its name label
- [x] Comments panel mounted next to it in an empty state ("Select a location", input hidden)

### Goal 2 — Pin → comments
- [x] Clicking a pin selects it on the map and loads its comments via `GET /comments/post/{postId}`
- [x] Panel title shows the selected location's name
- [x] Loading state while fetching; a failed request logs the error, clears loading,
      and shows the empty state — the panel never stays stuck
- [x] Stale responses are discarded (monotonic `requestToken`)
- [x] Clicking the map background deselects: highlight clears and the panel
      returns to the empty state

### Goal 3 — Comments → map
- [x] Submitting a comment POSTs to `/comments/add` with the selected location's `postId`
- [x] On success the new comment appears at the top; on failure the error is logged
      and the list stays intact
- [x] The selected pin shows a badge with its comment count, updated on add
- Note: DummyJSON simulates writes (responds but does not persist). The badge is
      derived from our in-memory comment list (`panel.comments.length`), not a re-fetch.

## Design decisions
- Third-party widgets treated as black boxes: integrated strictly via their
  documented properties and events; widgets never talk to each other.
- The host owns all state (selected location, comments, request token) and
  mediates data flow: data in via properties, actions out via events.
- API access lives in its own module (`src/services/commentsApi.js`).
- "Junior-style" code: module-level `let` state and closures inside `initialize()`,
  plain `function` handlers with `async/await`, no `this`-based state on the element.
- No custom CSS added: styling is not evaluated; the harness provides the layout.
- Stale-response protection uses an incrementing `requestToken`; a response only
  applies if its token still matches the current one.
