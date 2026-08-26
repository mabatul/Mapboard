import { MAP_CONFIG } from '../../data/config.js';
import { LOCATIONS } from '../../data/locations.js';
import { fetchCommentsForLocation } from '../services/commentsApi.js';

let selectedLocation = null;
let requestToken = 0;
let map = null;
let panel = null;

let emptyPanelState = () => ({ title: 'Select a location', readOnly: true });

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

        map.addEventListener('marker-select', async function (event) {
            const markerId = event.detail.markerId;
            const location = LOCATIONS.find((l) => l.id === markerId);
            if (!location) return;

            selectedLocation = location;
            map.selectedMarkerId = markerId;
            panel.panelConfig = { title: location.name, readOnly: false };
            panel.loading = true;

            const token = ++requestToken;

            try {
                const comments = await fetchCommentsForLocation(location.postId);
                if (token !== requestToken) return;
                panel.comments = comments;
            } catch (error) {
                if (token !== requestToken) return;
                console.error('Error loading comments:', error);
                panel.comments = [];
            } finally {
                if (token === requestToken) panel.loading = false;
            }
        });

        map.addEventListener('map-click', function () {
            selectedLocation = null;
            requestToken++;
            map.selectedMarkerId = null;
            panel.comments = [];
            panel.panelConfig = emptyPanelState();
            panel.loading = false;
        });
    }
}
customElements.define('geo-comments-app', GeoCommentsApp);