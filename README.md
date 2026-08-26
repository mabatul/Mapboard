# Geo Comments — starter scaffold

Starter project for the technical test. The task itself is described in the candidate brief you received.

## Run

No build step, no `npm install`. Serve this folder with any static file server:

```sh
npx serve .
# or
python3 -m http.server 3000
```

Then open the printed URL (e.g. <http://localhost:3000>).

## Setup (before the session)

1. Put a valid Mapbox access token in [`data/config.js`](data/config.js). The default public token of a free Mapbox account works: <https://account.mapbox.com/access-tokens/>
2. Check that `https://dummyjson.com/comments/post/1` responds from this network.
3. **Fallback:** if DummyJSON is unreachable, run `node mock-api/server.js` and use `http://localhost:4010` as the API base URL instead of `https://dummyjson.com`. The endpoints and response shapes are identical.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Harness page — mounts `<geo-comments-app>`, provides the layout CSS and a detach/re-attach helper |
| `data/` | Map config (token, initial view) and the locations dataset |
| `libs/interact-map/` | Third-party map widget — **do not modify**, integrate via its README |
| `libs/comments-panel/` | Third-party comments widget — **do not modify**, integrate via its README |
| `src/` | **Your code goes here** (entry point: `src/main.js`) |
| `mock-api/` | Optional zero-dependency fallback for the comments API |
