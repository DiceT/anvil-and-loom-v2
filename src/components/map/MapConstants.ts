export const MapZLayers = {
    BASE: { min: 0, max: 9, name: 'base' },          // Grid, Background
    SURFACE: { min: 10, max: 29, name: 'surface' },  // Ink, Drawings
    OBJECTS: { min: 30, max: 59, name: 'objects' },  // Tokens, Assets
    MARKERS: { min: 60, max: 79, name: 'markers' },  // Pins, Notes
    ATMOSPHERE: { min: 90, max: 99, name: 'fog' },   // Fog of War, FX
    INTERFACE: { min: 100, max: 100, name: 'ui' }    // Cursors, Gizmos
} as const;

export const DEFAULT_DRAWING_Z = 10;
export const DEFAULT_TOKEN_Z = 30;
