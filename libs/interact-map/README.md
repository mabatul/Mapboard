# `<interact-map>` — v1.0.0

A Web Component that renders an interactive map with labeled pins. Mapbox GL JS runs inside — it is loaded automatically from the official CDN the first time the component initializes. **Consumers never use the Mapbox API directly**: the entire integration surface is the properties and events documented here.

## Quick start

```html
<script type="module" src="./interact-map.js"></script>

<interact-map style="height: 400px"></interact-map>

<script type="module">
  const map = document.querySelector('interact-map');

  map.mapConfig = {
    accessToken: '<your Mapbox token>',
    center: [-58.385, -34.6], // [longitude, latitude]
    zoom: 12.5,
  };

  map.markers = [
    {
      id: 'obelisco',
      coordinates: [-58.3816, -34.6037],
      label: 'Obelisco',
      badge: 3,
    },
  ];

  map.addEventListener('marker-select', (event) => {
    // Selection is controlled by YOU — confirm it by assigning it back:
    map.selectedMarkerId = event.detail.markerId;
  });
</script>
```

## Properties

All of these are **JavaScript properties** assigned on the element instance. HTML attributes are **not** read — `<interact-map markers="...">` does nothing.

| Property           | Type             | Description                                                                                                                                    |
| ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `mapConfig`        | `MapConfig`      | **Required before the map renders.** Assigning it again later updates `center`/`zoom`; the `accessToken` is only read on first initialization. |
| `markers`          | `MarkerItem[]`   | The pins to show. Assigning a **new array** replaces and re-renders all pins. Mutating a previously assigned array has no effect.              |
| `selectedMarkerId` | `string \| null` | The highlighted pin. The map gently pans to it. Assign `null` to clear the highlight.                                                          |

```ts
MapConfig = {
  accessToken: string,        // Mapbox access token
  center: [number, number],   // [longitude, latitude]
  zoom: number,
}

MarkerItem = {
  id: string,
  coordinates: [number, number],  // [longitude, latitude]
  label: string,
  badge?: number,                 // optional count bubble on the pin
}
```

## Events

All events are `CustomEvent`s dispatched with `bubbles: true, composed: true`.

| Event           | `detail`                            | Fired when                                     |
| --------------- | ----------------------------------- | ---------------------------------------------- |
| `marker-select` | `{ markerId: string }`              | The user clicks a pin                          |
| `map-click`     | `{ coordinates: [number, number] }` | The user clicks the map background (not a pin) |
| `map-ready`     | `{}`                                | The map finished initializing                  |

## Behavior notes

- **The map never selects its own pins.** Clicking a pin only emits `marker-select`; nothing highlights until the host assigns `selectedMarkerId`. This keeps selection state in exactly one place — your code.
- Properties assigned before `map-ready` are queued and applied once the map is ready. You do not need to wait for the event before assigning.
- `map-ready` fires every time the map finishes initializing — including again after the element is detached and re-attached to the DOM. Assigned properties survive re-attachment; the map itself is rebuilt.
- **Sizing:** the component is a block element that fills its container. Give it (or its container) a height; it handles window/container resizes itself.
- **Failure states** are rendered as an overlay inside the component: missing or placeholder token, CDN unreachable, or token rejected by Mapbox (HTTP 401/403).
