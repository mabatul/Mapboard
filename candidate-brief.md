# Technical Test — Map + Comments Integration

**Duration:** 1 hour, live pairing session (you share your screen).
**Stack:** Vanilla JavaScript + Web Components. No frameworks, no runtime npm dependencies.
**AI policy:** You may use AI assistants (Copilot, ChatGPT, Claude, etc.) and read any documentation online. You own every line you ship — we will ask you to explain your decisions.

---

## Scenario

Most of our daily work is **integration**: our products host UI widgets built by other teams and wire them together and to backend services. This test reproduces that in miniature.

You are building a small **location feedback board**: a map with location pins, and a comments sidebar. Clicking a pin shows that location's comment thread; submitting a comment attaches it to the selected location.

The starter repo looks like this:

```
geo-comments-test/
├── index.html                  # harness page: mounts your component, provides the layout CSS
├── data/
│   ├── config.js               # Mapbox access token + initial map view (provided, ready to use)
│   └── locations.js            # the locations dataset: { id, name, coordinates, postId }
├── libs/
│   ├── interact-map/           # third-party map widget (Mapbox GL under the hood) — do not modify
│   │   ├── interact-map.js
│   │   └── README.md           # its integration contract — read this
│   └── comments-panel/         # third-party comments widget — do not modify
│       ├── mock-comments-panel.js
│       └── README.md           # its integration contract — read this
└── src/
    └── (your code goes here)
```

- **`<interact-map>`** renders a Mapbox map with pins. It is a **black box**: you configure it and listen to its events through the documented contract. You never touch Mapbox GL directly — the access token in `data/config.js` is just passed through.
- **`<mock-comments-panel>`** renders a comment list and a comment input. Also a black box.
- **The two widgets do not know each other.** Connecting them is your job.
- **The backend** is the public DummyJSON API: <https://dummyjson.com/docs/comments>. Each location in `data/locations.js` carries a `postId` — that is the key that links a map pin to its comment thread.

## Your task

Build a `<geo-comments-app>` web component so the harness page can do this:

```html
<geo-comments-app></geo-comments-app>
```

It should create and manage both widgets inside itself, load the locations onto the map, and coordinate everything between them.

Suggested (not mandatory) structure:

```
src/
├── components/geoCommentsApp.js    # the host custom element
└── services/commentsApi.js         # fetch logic, separated from the component
```

Styling is **not** evaluated — the harness page already provides a map-left / sidebar-right layout.

---

## Goals

Work through the goals in order. **You are not required to finish everything to pass** — we prefer solid, explained code over rushed complete code.

### Goal 1 — The map renders (~12 min)

- [ ] `<interact-map>` is mounted and displays, configured from `data/config.js`
- [ ] Every location from `data/locations.js` appears as a pin with its name as label
- [ ] The comments sidebar is mounted next to it in an "empty" state (e.g. *"Select a location"*, input hidden)

### Goal 2 — Pin → comments (~20 min)

Clicking a pin loads that location's thread.

- [ ] Clicking a pin visibly selects it on the map **and** loads its comments from `GET /comments/post/{postId}` into the panel
- [ ] The panel title shows the selected location's name
- [ ] While loading, the panel shows its loading state; a failed request shows a visible error and never leaves the panel stuck
- [ ] Switching pins quickly never displays comments belonging to the wrong location (stale responses are discarded)
- [ ] Clicking the map background (not a pin) deselects: pin highlight clears and the panel returns to the empty state

### Goal 3 — Comments → map (~15 min)

The write path, and the map reflecting it.

- [ ] Submitting a comment in the panel POSTs it to `/comments/add` with the **selected location's** `postId`
- [ ] On success, the new comment appears at the top of the list; on failure, an error is surfaced and the list stays intact
- [ ] The selected pin shows a **badge** with its comment count, and the badge updates when a comment is added
- Heads-up: DummyJSON **simulates** writes — it responds as if the comment was created, but does not persist it. Think about what that means for how you update the UI.

### Stretch goals (only if time remains)

- **S1 — All badges upfront:** on startup, load the comment count for *every* location (the `total` field of the list response helps) and show all badges from the beginning.
- **S2 — Cache:** in-memory per-location cache so re-selecting a visited pin is instant — and still consistent after adding a comment.
- **S3 — Lifecycle safety:** detaching and re-attaching `<geo-comments-app>` works: no duplicate event handling, no orphaned requests, no console errors.

---

## Objectives — how we evaluate

| # | Objective | Weight | What good looks like |
|---|-----------|--------|----------------------|
| O1 | **Third-party integration** | 30% | You follow both widgets' documented contracts: config and data passed the way their READMEs say, events consumed correctly, widgets treated as black boxes. |
| O2 | **Component architecture** | 30% | The host owns the state (selected location, loaded comments) and mediates — the widgets never talk to each other directly. Data flows one way: data in via properties, actions out via events. API access lives in its own module. |
| O3 | **JavaScript practices** | 25% | Modern async with real error handling, clear naming, no globals, no leaks, small functions with one job. |
| O4 | **Process & communication** | 15% | You think out loud, read docs before guessing, verify behavior in the browser, and use AI deliberately — reviewing its output instead of pasting blindly. |

## Rules

1. Do **not** modify anything in `libs/`.
2. Do **not** use Mapbox GL directly — everything goes through `<interact-map>`.
3. Vanilla JS + Web Components only. No frameworks or runtime libraries.
4. AI and online docs are allowed at any time. Be ready to explain any line we point at.
5. Talk while you work — the reasoning is part of the evaluation.

---

## Reference — `<interact-map>` contract (summary)

The full contract lives in `libs/interact-map/README.md`. Summary:

**Properties** (set as JS properties on the element instance):

| Property | Type | Behavior |
|----------|------|----------|
| `mapConfig` | `{ accessToken: string, center: [lng, lat], zoom: number }` | Required before anything renders. Values come from `data/config.js`. |
| `markers` | `MarkerItem[]` | The pins to show. Assigning a **new array** re-renders. |
| `selectedMarkerId` | `string \| null` | Which pin is highlighted (the map also pans to it). `null` clears the highlight. |

```ts
MarkerItem = {
  id: string,
  coordinates: [lng, lat],
  label: string,
  badge?: number      // optional count bubble on the pin
}
```

**Events** (CustomEvent, `bubbles: true`, `composed: true`):

| Event | `detail` | Fired when |
|-------|----------|------------|
| `marker-select` | `{ markerId: string }` | User clicks a pin |
| `map-click` | `{ coordinates: [lng, lat] }` | User clicks the map background (not a pin) |
| `map-ready` | `{}` | The map finished initializing |

**Notes from the README:**

- **The map never changes its own selection.** Clicking a pin only emits `marker-select` — the host decides, and confirms by setting `selectedMarkerId`.
- Object/array props must be assigned as **JS properties**. HTML attributes are ignored for non-string props.
- Properties assigned before `map-ready` are queued and applied once the map is ready.
- Mutating an array you already passed does nothing; assign a new one.

## Reference — `<mock-comments-panel>` contract (summary)

The full contract lives in `libs/comments-panel/README.md`. Summary:

**Properties** (set as JS properties on the element instance):

| Property | Type | Behavior |
|----------|------|----------|
| `comments` | `CommentItem[]` | The full list to render. Assigning a **new array** re-renders. |
| `panelConfig` | `{ title?: string, readOnly?: boolean }` | `readOnly: true` hides the input — use it for the "no location selected" state. |
| `loading` | `boolean` | `true` shows the skeleton state. |

```ts
CommentItem = {
  id: number | string,
  body: string,
  likes?: number,
  user: { username: string, fullName?: string }
}
```

**Events** (CustomEvent, `bubbles: true`, `composed: true`):

| Event | `detail` | Fired when |
|-------|----------|------------|
| `panel-submit` | `{ body: string }` | User presses Send in the panel's input |
| `panel-refresh` | `{}` | User clicks the refresh icon |

**Notes from the README:**

- Same property rules as the map: JS properties, new arrays, no attribute serialization.
- The panel never fetches anything itself — it renders exactly what it is given.

## Reference — API endpoints

Docs: <https://dummyjson.com/docs/comments>

```
GET https://dummyjson.com/comments/post/{postId}
→ { "comments": [ { id, body, postId, likes, user: { id, username, fullName } } ], "total", "skip", "limit" }

POST https://dummyjson.com/comments/add
Content-Type: application/json
{ "body": "Great spot!", "postId": 3, "userId": 5 }
→ responds with the created comment object (simulated — not persisted)
```

## Suggested timeline

| Time | Activity |
|------|----------|
| 0:00 – 0:08 | Read this brief and both widget READMEs, explore the scaffold |
| 0:08 – 0:20 | Goal 1 |
| 0:20 – 0:40 | Goal 2 |
| 0:40 – 0:55 | Goal 3 |
| 0:55 – 1:00 | Walk us through what you built and what you'd do next |

Good luck — build it the way you'd want to maintain it.
