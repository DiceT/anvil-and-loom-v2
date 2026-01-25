export interface ImageEntry {
    texture?: HTMLImageElement;
    bump?: HTMLImageElement;
    // PBR maps (optional)
    normal?: HTMLImageElement;
    roughness?: HTMLImageElement;
    metalness?: HTMLImageElement;
    displacement?: HTMLImageElement;
}

export interface TextureDefinition {
    name: string;
    composite: string;
    source?: string;
    bump?: string;
    material?: string;
    // PBR maps (optional)
    normal?: string;
    roughness?: string;
    metalness?: string;
    displacement?: string;
    isPBR?: boolean;  // Flag to use PBR rendering path
}

export interface ColorSet {
    id: string;
    name: string;
    description?: string;
    foreground: string; // Label color
    background: string | string[]; // Dice body color
    outline: string; // Label outline
    texture: string | TextureDefinition; // Texture reference name
    edge?: string; // Optional edge color
    material?: string; // 'metal', 'wood', 'plastic' etc
}
