import { MAP_CONFIG } from '../../data/config.js';
import { LOCATIONS } from '../../data/locations.js';

class GeoCommentsApp extends HTMLElement {
    connectedCallback() {
        this.initialize();
    }

    initialize() {
        const map = document.createElement('interact-map');
        map.mapConfig = MAP_CONFIG;
        map.markers = LOCATIONS.map(location => ({
            id: location.id,
            coordinates: location.coordinates,
            label: location.name,
        }));

        const panel = document.createElement('mock-comments-panel');
        panel.panelConfig = { title: 'Select a location', readOnly: true };
        panel.comments = [];

        this.append(map, panel);
    }
}
customElements.define('geo-comments-app', GeoCommentsApp);