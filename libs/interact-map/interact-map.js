/**
 * <interact-map> v1.0.0 — a small Web Component wrapper around Mapbox GL JS.
 *
 * Third-party library: integrate it through the contract documented in
 * README.md. Mapbox GL JS is loaded from the official CDN on first use;
 * consumers never touch the Mapbox API directly.
 */

const MAPBOX_VERSION = '3.6.0';
const MAPBOX_JS_URL = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;
const MAPBOX_CSS_URL = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const STYLE_ID = 'interact-map-styles';

let mapboxGlLoader = null;

function loadMapboxGl() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (mapboxGlLoader) return mapboxGlLoader;

  mapboxGlLoader = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${MAPBOX_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = MAPBOX_CSS_URL;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = MAPBOX_JS_URL;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => {
      mapboxGlLoader = null;
      reject(new Error('Failed to load Mapbox GL JS from the CDN'));
    };
    document.head.appendChild(script);
  });

  return mapboxGlLoader;
}

const CSS_TEXT = `
interact-map { display: block; position: relative; min-height: 240px; background: #eef1f4; }
interact-map .im-container { position: absolute; inset: 0; }
interact-map .im-status { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; padding: 24px; background: #eef1f4; color: #495057; font: 500 14px/1.5 system-ui, sans-serif; text-align: center; white-space: pre-line; }
interact-map .im-status--error { background: #fff5f5; color: #c92a2a; }
interact-map .im-pin { position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
interact-map .im-pin__dot { width: 16px; height: 16px; border-radius: 50%; background: #2f6fed; border: 2.5px solid #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .4); transition: transform .15s ease, background .15s ease; }
interact-map .im-pin__label { margin-top: 3px; padding: 2px 6px; border-radius: 4px; background: rgba(255, 255, 255, .92); color: #212529; font: 600 11px/1.2 system-ui, sans-serif; white-space: nowrap; box-shadow: 0 1px 2px rgba(0, 0, 0, .25); }
interact-map .im-pin__badge { display: none; position: absolute; top: -10px; left: calc(50% + 4px); z-index: 1; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #d6336c; color: #fff; font: 700 10px/16px system-ui, sans-serif; text-align: center; }
interact-map .im-pin--has-badge .im-pin__badge { display: block; }
interact-map .im-pin--selected .im-pin__dot { background: #e8590c; transform: scale(1.35); }
interact-map .im-pin--selected .im-pin__label { background: #e8590c; color: #fff; }
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  document.head.appendChild(style);
}

const UPGRADABLE_PROPS = ['mapConfig', 'markers', 'selectedMarkerId'];

class InteractMap extends HTMLElement {
  #mapConfig = null;
  #markers = [];
  #selectedMarkerId = null;

  #map = null;
  #ready = false;
  #initializing = false;
  #markerHandles = new Map(); // marker id -> { marker, element }
  #containerEl = null;
  #statusEl = null;
  #resizeObserver = null;

  // --- public contract (see README.md) ------------------------------------

  get mapConfig() {
    return this.#mapConfig;
  }

  set mapConfig(value) {
    this.#mapConfig = value ?? null;
    if (!this.#map) {
      this.#init();
    } else if (value) {
      // The token is only read on first initialization.
      if (Array.isArray(value.center)) this.#map.setCenter(value.center);
      if (typeof value.zoom === 'number') this.#map.setZoom(value.zoom);
    }
  }

  get markers() {
    return this.#markers;
  }

  set markers(value) {
    this.#markers = Array.isArray(value) ? value : [];
    if (this.#ready) this.#renderMarkers();
  }

  get selectedMarkerId() {
    return this.#selectedMarkerId;
  }

  set selectedMarkerId(value) {
    this.#selectedMarkerId = value == null ? null : String(value);
    if (this.#ready) this.#applySelection({ pan: true });
  }

  // --- lifecycle -----------------------------------------------------------

  connectedCallback() {
    injectStyles();
    // Absorb properties assigned before this element was upgraded.
    for (const prop of UPGRADABLE_PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }
    this.#renderShell();
    this.#init();
  }

  disconnectedCallback() {
    // Assigned state is kept; the map itself is torn down and rebuilt on the
    // next connection ('map-ready' fires again).
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    for (const handle of this.#markerHandles.values()) handle.marker.remove();
    this.#markerHandles.clear();
    this.#map?.remove();
    this.#map = null;
    this.#ready = false;
    this.#initializing = false;
    this.replaceChildren();
    this.#containerEl = null;
    this.#statusEl = null;
  }

  // --- internals -----------------------------------------------------------

  #renderShell() {
    this.replaceChildren();
    this.#containerEl = document.createElement('div');
    this.#containerEl.className = 'im-container';
    this.#statusEl = document.createElement('div');
    this.#statusEl.className = 'im-status';
    this.#statusEl.hidden = true;
    this.append(this.#containerEl, this.#statusEl);
  }

  async #init() {
    if (this.#map || this.#initializing || !this.isConnected) return;

    const config = this.#mapConfig;
    if (!config) {
      this.#showStatus('Waiting for mapConfig…');
      return;
    }

    const token = config.accessToken;
    if (typeof token !== 'string' || token.trim() === '' || token.includes('PASTE_')) {
      this.#showStatus(
        'Mapbox access token is missing or still a placeholder.\nPass a valid token in mapConfig.accessToken.',
        true,
      );
      return;
    }

    this.#initializing = true;
    this.#showStatus('Loading map…');

    let mapboxgl;
    try {
      mapboxgl = await loadMapboxGl();
    } catch {
      this.#initializing = false;
      this.#showStatus('Could not load Mapbox GL JS from the CDN.\nCheck the internet connection and reload.', true);
      return;
    }

    // The element may have been detached while the CDN script was loading.
    if (!this.isConnected || this.#map) {
      this.#initializing = false;
      return;
    }

    mapboxgl.accessToken = token;
    let map;
    try {
      map = new mapboxgl.Map({
        container: this.#containerEl,
        style: MAP_STYLE,
        center: Array.isArray(config.center) ? config.center : [0, 0],
        zoom: typeof config.zoom === 'number' ? config.zoom : 1,
      });
    } catch (err) {
      this.#initializing = false;
      this.#showStatus(`Could not initialize the map.\n${err?.message ?? err}`, true);
      return;
    }
    this.#map = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

    map.on('error', (event) => {
      const status = event?.error?.status;
      if (status === 401 || status === 403) {
        this.#ready = false;
        this.#showStatus(`Mapbox rejected the access token (HTTP ${status}).\nCheck mapConfig.accessToken.`, true);
      }
    });

    map.on('click', (event) => {
      this.#emit('map-click', { coordinates: [event.lngLat.lng, event.lngLat.lat] });
    });

    map.on('load', () => {
      this.#ready = true;
      this.#initializing = false;
      this.#hideStatus();
      this.#renderMarkers();
      this.#applySelection({ pan: false });
      this.#emit('map-ready', {});
    });

    this.#resizeObserver = new ResizeObserver(() => this.#map?.resize());
    this.#resizeObserver.observe(this);
  }

  #renderMarkers() {
    if (!this.#map || !window.mapboxgl) return;

    for (const handle of this.#markerHandles.values()) handle.marker.remove();
    this.#markerHandles.clear();

    for (const item of this.#markers) {
      if (!item || item.id == null || !Array.isArray(item.coordinates)) continue;

      const element = this.#createPinElement(item);
      const marker = new window.mapboxgl.Marker({ element, anchor: 'top', offset: [0, -9] })
        .setLngLat(item.coordinates)
        .addTo(this.#map);

      this.#markerHandles.set(String(item.id), { marker, element });
    }

    this.#applySelection({ pan: false });
  }

  #createPinElement(item) {
    const element = document.createElement('div');
    element.className = 'im-pin';

    const badge = document.createElement('span');
    badge.className = 'im-pin__badge';
    const dot = document.createElement('span');
    dot.className = 'im-pin__dot';
    const label = document.createElement('span');
    label.className = 'im-pin__label';
    label.textContent = item.label ?? String(item.id);
    element.append(badge, dot, label);

    if (typeof item.badge === 'number' || (typeof item.badge === 'string' && item.badge !== '')) {
      badge.textContent = String(item.badge);
      element.classList.add('im-pin--has-badge');
    }

    element.addEventListener('click', (event) => {
      // Selection is controlled by the host: only report the click.
      event.stopPropagation();
      this.#emit('marker-select', { markerId: String(item.id) });
    });

    return element;
  }

  #applySelection({ pan }) {
    if (!this.#map) return;

    for (const [id, handle] of this.#markerHandles) {
      handle.element.classList.toggle('im-pin--selected', id === this.#selectedMarkerId);
    }

    if (pan && this.#selectedMarkerId) {
      const selected = this.#markers.find((item) => item && String(item.id) === this.#selectedMarkerId);
      if (selected && Array.isArray(selected.coordinates)) {
        this.#map.easeTo({ center: selected.coordinates, duration: 600 });
      }
    }
  }

  #showStatus(message, isError = false) {
    if (!this.#statusEl) return;
    this.#statusEl.hidden = false;
    this.#statusEl.textContent = message;
    this.#statusEl.classList.toggle('im-status--error', isError);
  }

  #hideStatus() {
    if (this.#statusEl) this.#statusEl.hidden = true;
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

if (!window.customElements.get('interact-map')) {
  window.customElements.define('interact-map', InteractMap);
}

export { InteractMap };
