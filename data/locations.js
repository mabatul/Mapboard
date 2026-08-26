/**
 * The locations to show on the map.
 *
 * `postId` links a location to its comment thread in the comments API:
 *   GET https://dummyjson.com/comments/post/{postId}
 *
 * Coordinates are [longitude, latitude] (Mapbox order).
 */
export const LOCATIONS = [
  {
    id: 'obelisco',
    name: 'Obelisco',
    coordinates: [-58.3816, -34.6037],
    postId: 1,
  },
  {
    id: 'caminito',
    name: 'Caminito',
    coordinates: [-58.3628, -34.6393],
    postId: 12,
  },
  {
    id: 'puente-mujer',
    name: 'Puente de la Mujer',
    coordinates: [-58.3634, -34.6084],
    postId: 2,
  },
  {
    id: 'recoleta',
    name: 'Cementerio de la Recoleta',
    coordinates: [-58.3932, -34.5875],
    postId: 9,
  },
  {
    id: 'rosedal',
    name: 'El Rosedal',
    coordinates: [-58.4173, -34.5711],
    postId: 11,
  },
  {
    id: 'teatro-colon',
    name: 'Teatro Colón',
    coordinates: [-58.3831, -34.6011],
    postId: 5,
  },
];
