import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceColors } from './DiceColors';
import type { DiceTheme } from './types';
import { DEFAULT_THEME } from './types';
import { LiquidShader, SingularityLiquidShader, FlameCoreShader, VortexLiquidShader, NebulaLiquidShader, CausticLiquidShader } from './core/shaders';

export class DiceForge {

    private diceColors: DiceColors;
    private geometryCache: Record<string, THREE.Geometry> = {};

    // Standard Dice Maps
    // D2 (Coin)
    private static readonly D2_LABELS = ['1', '2'];
    // D100: Matches D10 geometry pattern
    private static readonly D100_LABELS = ['10', '20', '50', '40', '70', '60', '30', '80', '90', '00'];

    private static readonly D4_LABELS = ['1', '2', '3', '4'];
    private static readonly D6_LABELS = ['1', '2', '3', '4', '5', '6'];
    private static readonly D8_LABELS = ['1', '7', '5', '3', '6', '4', '2', '8'];

    // D10: Swapped 3<->5<->7 to fix order (1,5,7,3,9 -> 1,7,3,5,9)
    private static readonly D10_LABELS = ['1', '2', '5', '4', '7', '6', '3', '8', '9', '0'];
    private static readonly D12_LABELS = ['1', '11', '7', '9', '10', '5', '8', '3', '4', '6', '2', '12'];
    // D20: Manual User Map (Corrected: 17 at Slot 17, then 16 14 18)
    private static readonly D20_LABELS = [
        '1', '13', '11', '9', '19', '5', '7', '3', '6', '4',
        '12', '10', '8', '20', '2', '15', '17', '16', '14', '18'
    ];

    // River Pebble d6: d12 geometry, faces mapped 1->6 twice.
    // 1(6), 11(5), 7(1), 9(3), 10(4), 5(2), 8(2), 3(4), 4(3), 6(1), 2(5), 12(6)
    // Based on standard order: [1, 11, 7, 9, 10, 5, 8, 3, 4, 6, 2, 12]
    private static readonly DRIVER_LABELS = ['6', '5', '1', '3', '4', '2', '2', '4', '3', '1', '5', '6'];

    constructor() {
        this.diceColors = new DiceColors();
    }

    public createdice(type: string, theme: DiceTheme = DEFAULT_THEME): THREE.Mesh {
        let geometry: THREE.Geometry;
        let baseLabels: string[] = [];

        // Apply Scale from Theme
        const scale = theme.scale || 1.0;

        switch (type) {
            case 'd2':
                geometry = this.getGeometry('d2', 1.0 * scale);
                baseLabels = DiceForge.D2_LABELS;
                break;
            case 'd4':
                geometry = this.getGeometry('d4', 1.0 * scale);
                baseLabels = DiceForge.D4_LABELS;
                break;
            case 'd6':
                geometry = this.getGeometry('d6', 1.0 * scale);
                baseLabels = DiceForge.D6_LABELS;
                break;
            case 'd8':
                geometry = this.getGeometry('d8', 1.0 * scale);
                baseLabels = DiceForge.D8_LABELS;
                break;
            case 'd10':
                geometry = this.getGeometry('d10', 1.0 * scale);
                baseLabels = DiceForge.D10_LABELS;
                break;
            case 'd12':
                geometry = this.getGeometry('d12', 0.9 * scale);
                baseLabels = DiceForge.D12_LABELS;
                break;
            case 'driver':
                geometry = this.getGeometry('d12', 0.9 * scale);
                baseLabels = DiceForge.DRIVER_LABELS;
                break;
            case 'd20':
                geometry = this.getGeometry('d20', 1.0 * scale);
                baseLabels = DiceForge.D20_LABELS;
                break;
            case 'd100':
                geometry = this.getGeometry('d100', 1.0 * scale);
                baseLabels = DiceForge.D100_LABELS;
                break;
            default:
                throw new Error(`Unknown dice type: ${type}`);
        }

        if (!geometry) throw new Error("Geometry failed");

        const labels = this.calculateLabels(type, baseLabels);
        const materials = this.createMaterials(type, labels, theme);
        const mesh = new THREE.Mesh(geometry, materials);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).body_shape = (geometry as any).cannon_shape;

        // Set outer mesh to render after inner shader mesh (for transmission materials)
        mesh.renderOrder = 1;

        // --- LIQUID/SHADER CORE LOGIC ---
        // --- LIQUID/SHADER CORE LOGIC ---
        if (theme.shader && theme.shader !== 'none') {
            // Create Inner Mesh (Liquid/Effect)
            // Clone the main geometry (now has smooth normals!)
            const innerGeom = geometry.clone();
            innerGeom.scale(0.90, 0.90, 0.90);

            // Shader colors: shaderColor = base, shaderColorSecondary = liquid/secondary
            const baseCol = new THREE.Color(theme.shaderColor || theme.diceColor);
            const liquidCol = new THREE.Color(theme.shaderColorSecondary || theme.outlineColor);

            // Select shader based on shader type
            let selectedShader = LiquidShader;
            let extraUniforms: Record<string, { value: number }> = {};

            switch (theme.shader) {
                case 'singularity':
                    selectedShader = SingularityLiquidShader;
                    break;
                case 'flamecore':
                    selectedShader = FlameCoreShader;
                    extraUniforms = {
                        coreRadius: { value: 0.18 },
                        scale: { value: 2.5 },
                        speed: { value: 1.2 },
                        intensity: { value: 1.0 }
                    };
                    break;
                case 'vortex':
                    selectedShader = VortexLiquidShader;
                    extraUniforms = {
                        scale: { value: 2.5 },
                        swirl: { value: 2.0 },
                        speed: { value: 0.8 },
                        intensity: { value: 1.0 }
                    };
                    break;
                case 'nebula':
                    selectedShader = NebulaLiquidShader;
                    extraUniforms = {
                        scale: { value: 2.2 },
                        speed: { value: 0.5 },
                        intensity: { value: 1.0 }
                    };
                    break;
                case 'caustic':
                    selectedShader = CausticLiquidShader;
                    extraUniforms = {
                        scale: { value: 1.0 },
                        speed: { value: 1.0 },
                        intensity: { value: 1.0 }
                    };
                    break;
                case 'liquid':
                default:
                    // liquid uses LiquidShader
                    break;
            }

            // Material settings - Hybrid Transparency
            // transparent: true (allows alpha blending)
            // depthWrite: true (ensures transmission sees it)
            let materialSide: THREE.Side = THREE.FrontSide;
            let materialTransparent = true;
            let materialDepthWrite = true;

            const liquidMaterial = new THREE.ShaderMaterial({
                vertexShader: selectedShader.vertexShader,
                fragmentShader: selectedShader.fragmentShader,
                uniforms: {
                    time: { value: 0.0 },
                    baseColor: { value: baseCol },
                    liquidColor: { value: liquidCol },
                    ...extraUniforms
                },
                side: materialSide,
                transparent: materialTransparent,
                depthWrite: materialDepthWrite,
                toneMapped: false  // CRITICAL: Bypass Three.js tone mapping to preserve vibrant colors
            });

            const innerMesh = new THREE.Mesh(innerGeom, liquidMaterial);
            innerMesh.renderOrder = -1; // Render slightly before outer shell
            mesh.add(innerMesh);

            // FLAMECORE SPECIAL: Add a second, smaller core mesh for the Primary color
            if (theme.shader === 'flamecore') {
                const coreGeom = innerGeom.clone();
                coreGeom.scale(0.4, 0.4, 0.4); // 40% of the flame mesh size

                // Simple glowing material for the core (Primary color)
                const coreMaterial = new THREE.MeshBasicMaterial({
                    color: baseCol,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });

                const coreMesh = new THREE.Mesh(coreGeom, coreMaterial);
                coreMesh.renderOrder = -2; // Render before the flame layer
                mesh.add(coreMesh);

                // Store reference for animation if needed
                mesh.userData.coreMesh = coreMesh;
            }

            // Mark for Animation
            mesh.userData.isLiquid = true;
            mesh.userData.liquidMesh = innerMesh;
        }

        // Store Face Normals and Values for Result Detection
        mesh.userData.faceValues = [];
        for (const face of geometry.faces) {
            // Check bounds just in case
            if (face.materialIndex >= 0 && face.materialIndex < labels.length) {
                const value = labels[face.materialIndex];

                // Skip materials representing edges (empty labels)
                if (!value || (Array.isArray(value) && value.length === 0)) continue;

                // For D4, the label is an array of numbers. We store the array.
                // For others, it's a primitive (string/number).

                // Store local normal and value
                mesh.userData.faceValues.push({
                    normal: face.normal.clone(),
                    value: value
                });
            }
        }

        return mesh;
    }

    private calculateLabels(type: string, baseLabels: string[]): any[] {
        if (type === 'd2') {
            // Edge (0), Face1 (1), Face2 (2)
            return ['', baseLabels[0], baseLabels[1]];
        }
        if (type === 'd4') {
            const a = baseLabels[0];
            const b = baseLabels[1];
            const c = baseLabels[2];
            const d = baseLabels[3];
            return [[], [], [b, d, c], [a, c, d], [b, a, d], [a, b, c]];
        }
        const labels = [...baseLabels];
        if (type === 'd10' || type === 'd100') { labels.unshift(''); }
        else { labels.unshift(''); labels.unshift(''); }
        return labels;
    }

    private getGeometry(type: string, radius: number): THREE.Geometry {
        const cacheKey = `${type}_${radius}`;
        if (this.geometryCache[cacheKey]) return this.geometryCache[cacheKey];

        let geom: THREE.Geometry | null = null;
        switch (type) {
            case 'd2': geom = this.create_d2_geometry(radius); break;
            case 'd4': geom = this.create_d4_geometry(radius); break;
            case 'd6': geom = this.create_d6_geometry(radius); break;
            case 'd8': geom = this.create_d8_geometry(radius); break;
            case 'd10': geom = this.create_d10_geometry(radius); break;
            case 'd100': geom = this.create_d10_geometry(radius); break; // Reuse D10 geometry
            case 'd12': geom = this.create_d12_geometry(radius); break;
            case 'd20': geom = this.create_d20_geometry(radius); break;
        }
        if (geom) { this.geometryCache[cacheKey] = geom; return geom; }
        throw new Error(`Failed to create geometry for ${type}`);
    }

    private createMaterials(type: string, labels: any[], theme: DiceTheme): THREE.Material[] {
        const materials: THREE.Material[] = [];

        // Theme Colors
        const labelColor = theme.labelColor || '#000000';
        const textureDef = this.diceColors.getImage(theme.texture);

        // If texture is used, default base color to white so texture isn't darkened
        // If no texture, keep grey default
        const defaultBase = (textureDef && textureDef.texture) ? '#ffffff' : '#dddddd';
        const diceColor = theme.diceColor || defaultBase;

        const outlineColor = theme.outlineColor || '#000000';
        const fontName = theme.font || 'Arial';

        // Material Props
        let roughness = 0.5;
        let metalness = 0.1;
        let emissiveColor = new THREE.Color(0x000000);
        let emissiveIntensity = 0.0;
        let envMapIntensity = 1.0;

        // Material Mapping (including Master materials)
        switch (theme.material) {
            case 'glass':
                roughness = 0.1;
                metalness = 0.1;
                break;

            // MASTER MATERIALS
            case 'stone_master':
                roughness = 0.85;
                metalness = 0.0;
                envMapIntensity = 0.2; // Low environmental reflection
                break;
            case 'metal_master':
                roughness = 0.5;
                metalness = 0.7;
                envMapIntensity = 0.8;
                break;
            case 'arcane_master':
                roughness = 0.5;
                metalness = 0.15;
                // Emission Matches Label Color, but slightly dimmed base
                emissiveColor = new THREE.Color(labelColor);
                emissiveIntensity = 4.0; // Strong glow
                break;



            case 'plastic':
            default:
                roughness = 0.5;
                metalness = 0.1;
                break;
        }

        for (let i = 0; i < labels.length; i++) {
            const labelText = labels[i];
            let isEdge = false;
            if (!labelText || (Array.isArray(labelText) && labelText.length === 0)) isEdge = true;

            if (isEdge) {
                materials.push(new THREE.MeshStandardMaterial({
                    color: diceColor, roughness, metalness, side: THREE.DoubleSide
                }));
                continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d')!;

            // 1. Background Color
            ctx.fillStyle = diceColor; ctx.fillRect(0, 0, 256, 256);

            // 2. Texture Overlay
            if (textureDef && textureDef.texture) {
                ctx.globalCompositeOperation = 'multiply';

                // Apply Contrast
                const contrast = theme.textureContrast !== undefined ? theme.textureContrast : 1.0;
                ctx.filter = `contrast(${contrast})`;

                ctx.drawImage(textureDef.texture, 0, 0, 256, 256);

                ctx.filter = 'none'; // Reset filter
                ctx.globalCompositeOperation = 'source-over';
            }

            // 3. Text (Color Map)
            ctx.fillStyle = labelColor;
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 8;

            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.save(); ctx.translate(128, 128);

            // Font Scaling based on Family
            let fontScale = 1.0;
            if (fontName.includes('Orbitron')) {
                fontScale = 0.85;
            }

            // Draw Text Function (Reused for Bump)
            const drawText = (context: CanvasRenderingContext2D) => {
                if (type === 'd4' && Array.isArray(labelText)) {
                    const fSize = Math.round(36 * fontScale);
                    context.font = `bold ${fSize}px ${fontName}`;
                    const ts = 256;
                    for (let k = 0; k < labelText.length; k++) {
                        if (!['glass', 'arcane_resin', 'void_glass', 'liquid_core', 'liquid_singularity', 'liquid_flamecore', 'liquid_vortex', 'liquid_nebula'].includes(theme.material)) context.strokeText(labelText[k], 0, -ts * 0.3);
                        context.fillText(labelText[k], 0, -ts * 0.3);
                        context.rotate(Math.PI * 2 / 3);
                    }
                } else {
                    const fSize = Math.round(72 * fontScale);
                    context.font = `bold ${fSize}px ${fontName}`;
                    let angleDeg = 0;
                    if (type === 'd8') angleDeg = (i % 2 === 0) ? -7.5 : -127.5;
                    else if (type === 'd10') angleDeg = -6;
                    else if (type === 'd12') angleDeg = 5;
                    else if (type === 'd20') angleDeg = -7.5;

                    if (angleDeg !== 0) context.rotate(angleDeg * Math.PI / 180);

                    let textStr = String(labelText);
                    if ((textStr === '6' || textStr === '9') && type !== 'd6' && type !== 'd8' && type !== 'driver') textStr += '.';

                    if (!['glass', 'arcane_resin', 'void_glass', 'liquid_core', 'liquid_singularity', 'liquid_flamecore', 'liquid_vortex', 'liquid_nebula'].includes(theme.material)) context.strokeText(textStr, 0, 0);
                    context.fillText(textStr, 0, 0);
                }
            };

            drawText(ctx);
            ctx.restore();

            const tex = new THREE.CanvasTexture(canvas);
            // ⚠️ DO NOT TOUCH - This encoding is CRITICAL for correct colors across Electron and Web!
            tex.encoding = THREE.sRGBEncoding;
            tex.needsUpdate = true;

            // --- Bump Map Generation ---
            let bumpTex = tex; // Default to color map if no specific bump
            if (textureDef && textureDef.bump) {
                const canvasBump = document.createElement('canvas');
                canvasBump.width = 256; canvasBump.height = 256;
                const ctxBump = canvasBump.getContext('2d')!;

                // 1. Background (White = High, unless texture says otherwise)
                ctxBump.fillStyle = '#ffffff';
                ctxBump.fillRect(0, 0, 256, 256);

                // 2. Bump Texture
                if (textureDef.bump) {
                    ctxBump.drawImage(textureDef.bump, 0, 0, 256, 256);
                }

                // 3. Text (Engraved = Black)
                ctxBump.fillStyle = '#000000';
                ctxBump.strokeStyle = '#000000';
                ctxBump.lineWidth = 8;
                ctxBump.textAlign = 'center'; ctxBump.textBaseline = 'middle';

                ctxBump.save(); ctxBump.translate(128, 128);
                drawText(ctxBump); // Re-run draw logic with black fill
                ctxBump.restore();

                bumpTex = new THREE.CanvasTexture(canvasBump);
                bumpTex.encoding = THREE.LinearEncoding; // Explicitly Linear for bump/data
                bumpTex.needsUpdate = true;
            }

            // --- Emissive Map Generation (for Glow effects) ---
            let emissiveTex: THREE.Texture | null = null;
            let alphaMaskTex: THREE.Texture | null = null;  // Alpha mask for isolating text
            if (theme.shader && theme.shader !== 'none') {
                const canvasEmit = document.createElement('canvas');
                canvasEmit.width = 256;
                canvasEmit.height = 256;
                const ctxEmit = canvasEmit.getContext('2d')!;

                // 1. Background = Black (No emission)
                ctxEmit.fillStyle = '#000000';
                ctxEmit.fillRect(0, 0, 256, 256);

                // 2. Text = Label Color (Emission source)
                ctxEmit.fillStyle = labelColor;
                ctxEmit.strokeStyle = outlineColor;
                ctxEmit.lineWidth = 8;
                ctxEmit.textAlign = 'center';
                ctxEmit.textBaseline = 'middle';

                ctxEmit.save();
                ctxEmit.translate(128, 128);
                drawText(ctxEmit);
                ctxEmit.restore();

                emissiveTex = new THREE.CanvasTexture(canvasEmit);
                emissiveTex.encoding = THREE.sRGBEncoding;
                emissiveTex.needsUpdate = true;

                // --- Alpha Mask (Ruins & Realms pattern): Gray background for partial transparency ---
                // Gray = ~25% opacity (glass areas), White = 100% opacity (text areas)
                const canvasAlpha = document.createElement('canvas');
                canvasAlpha.width = 256;
                canvasAlpha.height = 256;
                const ctxAlpha = canvasAlpha.getContext('2d')!;

                // Background = Near black (~4% opacity) for nearly invisible glass
                ctxAlpha.fillStyle = '#0a0a0a';
                ctxAlpha.fillRect(0, 0, 256, 256);

                // Text = White (100% opacity)
                ctxAlpha.fillStyle = '#ffffff';
                ctxAlpha.strokeStyle = '#ffffff';
                ctxAlpha.lineWidth = 8;
                ctxAlpha.textAlign = 'center';
                ctxAlpha.textBaseline = 'middle';

                ctxAlpha.save();
                ctxAlpha.translate(128, 128);
                drawText(ctxAlpha);
                ctxAlpha.restore();

                alphaMaskTex = new THREE.CanvasTexture(canvasAlpha);
                alphaMaskTex.needsUpdate = true;
            }

            // Use MeshPhysicalMaterial for advanced properties
            const isShaderActive = (theme.shader && theme.shader !== 'none');

            const materialParams: any = {
                map: tex,
                bumpMap: bumpTex,
                bumpScale: 0.08,
                roughness,
                metalness,
                emissive: isShaderActive ? 0xffffff : emissiveColor,
                emissiveMap: emissiveTex,
                emissiveIntensity: isShaderActive ? 1.5 : isEdge ? 0 : emissiveIntensity,
                alphaMap: null,
                envMapIntensity,
                flatShading: true
            };

            // ARCANE MASTER SPECIAL: Emissive Map for Text Only
            if (theme.material === 'arcane_master' && !isEdge) {
                materialParams.emissiveMap = tex;
                materialParams.emissive = new THREE.Color(0xffffff);
            }

            if (theme.material === 'glass') {
                // Pure Glass - AlphaMap controls per-pixel transparency
                // Gray areas (~25% opacity) = transparent glass, White areas = opaque numbers
                materialParams.transparent = true;
                materialParams.opacity = 1.0;
                materialParams.side = THREE.DoubleSide;
                materialParams.roughness = 0.05;
                materialParams.metalness = 0.0;
                // Use alphaMap for per-pixel transparency
                if (!isEdge && alphaMaskTex) {
                    materialParams.alphaMap = alphaMaskTex;
                }
                // Emissive numbers for visibility
                if (!isEdge && emissiveTex) {
                    materialParams.emissiveMap = emissiveTex;
                    materialParams.emissive = new THREE.Color(0xffffff);
                    materialParams.emissiveIntensity = 2.5;
                }
            } else if (theme.material === 'void_glass') {
                // Void Glass - Specific aesthetic
                materialParams.color = new THREE.Color(0x0a0b12); // Override color
                materialParams.roughness = 0.05;
                materialParams.metalness = 0.0;
                materialParams.transmission = 0.35;
                materialParams.thickness = 0.9;
                materialParams.ior = 1.48;
                materialParams.attenuationColor = new THREE.Color(0x221133);
                materialParams.attenuationDistance = 2.5;
                materialParams.clearcoat = 0.8;
                materialParams.clearcoatRoughness = 0.05;
                materialParams.transparent = true;
                materialParams.side = THREE.FrontSide;
                // Emissive numbers for visibility
                if (!isEdge && emissiveTex) {
                    materialParams.emissiveMap = emissiveTex;
                    materialParams.emissive = new THREE.Color(0xffffff);
                    materialParams.emissiveIntensity = 2.5;
                }
            } else if (theme.material === 'arcane_resin') {
                materialParams.color = new THREE.Color(0x141018);
                materialParams.roughness = 0.18;
                materialParams.bumpMap = null; // No normal per spec
                materialParams.metalness = 0.0;
                materialParams.transmission = 0.35;
                materialParams.thickness = 0.9;
                materialParams.ior = 1.45;
                materialParams.attenuationColor = new THREE.Color(0x3a1b4a);
                materialParams.attenuationDistance = 1.6;
                materialParams.clearcoat = 0.65;
                materialParams.clearcoatRoughness = 0.10;
                materialParams.transparent = true;
                materialParams.side = THREE.FrontSide;
                // Emissive numbers for visibility
                if (!isEdge && emissiveTex) {
                    materialParams.emissiveMap = emissiveTex;
                    materialParams.emissive = new THREE.Color(0xffffff);
                    materialParams.emissiveIntensity = 2.5;
                }
            } else if (theme.material === 'relic_stone') {
                materialParams.color = new THREE.Color(0x2a2a2a);
                materialParams.roughness = 0.82;
                materialParams.metalness = 0.0;
            }

            const mat = new THREE.MeshPhysicalMaterial(materialParams);
            materials.push(mat);
        }
        return materials;
    }

    private create_geom(vertices: any[], faces: any[], radius: number, tab: number, af: number): THREE.Geometry {
        return this.make_geom(vertices, faces, radius, tab, af);
    }

    private make_geom(vertices: any[], faces: number[][], radius: number, tab: number, af: number) {
        const geom = new THREE.Geometry();
        for (let i = 0; i < vertices.length; ++i) {
            // FIX: Normalize vertices before scaling to ensure consistent radius
            const vertex = (new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2])).normalize().multiplyScalar(radius);
            (vertex as any).index = geom.vertices.push(vertex) - 1;
        }
        for (let i = 0; i < faces.length; ++i) {
            const ii = faces[i], fl = ii.length - 1;
            const aa = Math.PI * 2 / fl;
            for (let j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], undefined, ii[fl] + 1));
                if (ii[fl] !== -1) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
                } else {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)
                    ]);
                }
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        if (CANNON) {
            const points = geom.vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z));
            const facesC = geom.faces.map(f => [f.a, f.b, f.c]);
            (geom as any).cannon_shape = new CANNON.ConvexPolyhedron({ vertices: points as any, faces: facesC as any });
        }
        return geom;
    }

    private make_d10_geom(vertices: THREE.Vector3[], faces: number[][], radius: number, tab: number, af: number) {
        const geom = new THREE.Geometry();
        for (let i = 0; i < vertices.length; ++i) {
            // D10 should NOT normalize - keep original proportions for tall shape
            const vertex = vertices[i].clone().multiplyScalar(radius);
            (vertex as any).index = geom.vertices.push(vertex) - 1;
        }
        for (let i = 0; i < faces.length; ++i) {
            const ii = faces[i], fl = ii.length - 1;
            const aa = Math.PI * 2 / fl;
            const w = 0.65;
            const h = 0.85;
            const v0 = 1 - 1 * h;
            const v1 = 1 - (0.895 / 1.105) * h;
            const v2 = 1;

            for (let j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], undefined, ii[fl] + 1));

                if (faces[i][faces[i].length - 1] == -1 || j >= 2) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
                } else if (j == 0) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0.5 - w / 2, v1),
                        new THREE.Vector2(0.5, v0),
                        new THREE.Vector2(0.5 + w / 2, v1)
                    ]);
                } else if (j == 1) {
                    geom.faceVertexUvs[0].push([
                        new THREE.Vector2(0.5 - w / 2, v1),
                        new THREE.Vector2(0.5 + w / 2, v1),
                        new THREE.Vector2(0.5, v2)
                    ]);
                }
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        if (CANNON) {
            const points = geom.vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z));
            const facesC = geom.faces.map(f => [f.a, f.b, f.c]);
            (geom as any).cannon_shape = new CANNON.ConvexPolyhedron({ vertices: points as any, faces: facesC as any });
        }
        return geom;
    }

    private create_d2_geometry(radius: number) {
        const segments = 24;
        const h = 0.1 * radius;
        const bevel = 0.05 * radius;
        const r_outer = radius;
        const r_inner = radius - bevel;
        const h_inner = h;
        const h_outer = h - bevel;

        const geom = new THREE.Geometry();

        let idx = 0;
        const pushVert = (x: number, y: number, z: number) => { geom.vertices.push(new THREE.Vector3(x, y, z)); return idx++; };

        const topCenter = pushVert(0, h, 0);
        const botCenter = pushVert(0, -h, 0);

        const topInnerStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_inner, h_inner, Math.sin(a) * r_inner);
        }
        const topOuterStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_outer, h_outer, Math.sin(a) * r_outer);
        }
        const botOuterStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_outer, -h_outer, Math.sin(a) * r_outer);
        }
        const botInnerStart = idx;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pushVert(Math.cos(a) * r_inner, -h_inner, Math.sin(a) * r_inner);
        }

        const centerUV = new THREE.Vector2(0.5, 0.5);

        const getUV_Top = (r_ratio: number, i: number) => {
            const ang = (i / segments) * Math.PI * 2;
            return new THREE.Vector2(0.5 - 0.5 * Math.cos(ang) * r_ratio, 0.5 + 0.5 * Math.sin(ang) * r_ratio);
        };
        const getUV_Bot = (r_ratio: number, i: number) => {
            const ang = (i / segments) * Math.PI * 2;
            return new THREE.Vector2(0.5 + 0.5 * Math.cos(ang) * r_ratio, 0.5 + 0.5 * Math.sin(ang) * r_ratio);
        };

        // Top Face
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const f = new THREE.Face3(topCenter, topInnerStart + next, topInnerStart + i);
            f.materialIndex = 1;
            geom.faces.push(f);
            geom.faceVertexUvs[0].push([centerUV, getUV_Top(0.9, next), getUV_Top(0.9, i)]);
        }

        // Top Chamfer
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const i1 = topInnerStart + i; const i2 = topInnerStart + next;
            const o1 = topOuterStart + i; const o2 = topOuterStart + next;

            const f1 = new THREE.Face3(i1, i2, o1);
            f1.materialIndex = 1;
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([getUV_Top(0.9, i), getUV_Top(0.9, next), getUV_Top(1.0, i)]);

            const f2 = new THREE.Face3(i2, o2, o1);
            f2.materialIndex = 1;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([getUV_Top(0.9, next), getUV_Top(1.0, next), getUV_Top(1.0, i)]);
        }

        // Side (Edge)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const t1 = topOuterStart + i; const t2 = topOuterStart + next;
            const b1 = botOuterStart + i; const b2 = botOuterStart + next;

            const f1 = new THREE.Face3(t1, b1, t2);
            f1.materialIndex = 0;
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)]);

            const f2 = new THREE.Face3(t2, b1, b2);
            f2.materialIndex = 0;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([new THREE.Vector2(1, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)]);
        }

        // Bot Chamfer
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const o1 = botOuterStart + i; const o2 = botOuterStart + next;
            const i1 = botInnerStart + i; const i2 = botInnerStart + next;

            const f1 = new THREE.Face3(i1, o1, i2);
            f1.materialIndex = 2;
            geom.faces.push(f1);
            geom.faceVertexUvs[0].push([getUV_Bot(0.9, i), getUV_Bot(1.0, i), getUV_Bot(0.9, next)]);

            const f2 = new THREE.Face3(o1, o2, i2);
            f2.materialIndex = 2;
            geom.faces.push(f2);
            geom.faceVertexUvs[0].push([getUV_Bot(1.0, i), getUV_Bot(1.0, next), getUV_Bot(0.9, next)]);
        }

        // Bot Face
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const f = new THREE.Face3(botCenter, i + botInnerStart, next + botInnerStart);
            f.materialIndex = 2;
            geom.faces.push(f);
            geom.faceVertexUvs[0].push([centerUV, getUV_Bot(0.9, i), getUV_Bot(0.9, next)]);
        }

        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);

        if (CANNON) {
            const points = geom.vertices.map(v => new CANNON.Vec3(v.x, v.y, v.z));
            const facesC = geom.faces.map(f => [f.a, f.b, f.c]);
            (geom as any).cannon_shape = new CANNON.ConvexPolyhedron({ vertices: points as any, faces: facesC as any });
        }
        return geom;
    }

    private create_d4_geometry(radius: number) {
        const vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        const faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return this.create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6);
    }

    private create_d6_geometry(radius: number) {
        const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        const faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return this.create_geom(vertices, faces, radius, 0.1, Math.PI / 4);
    }

    private create_d8_geometry(radius: number) {
        const vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        const faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
        [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return this.create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2);
    }

    private create_d10_geometry(radius: number) {
        const a = Math.PI * 2 / 10, h = 0.105;
        const vertices = [];
        for (let i = 0, b = 0; i < 10; ++i, b += a) {
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        }
        vertices.push([0, 0, -1.2]); vertices.push([0, 0, 1.2]);  // Taller tips for proper d10 proportions
        const faces = [
            [5, 6, 7, 11, 0], [4, 3, 2, 10, 1], [1, 2, 3, 11, 2], [0, 9, 8, 10, 3],
            [7, 8, 9, 11, 4], [8, 7, 6, 10, 5], [9, 0, 1, 11, 6], [2, 1, 0, 10, 7],
            [3, 4, 5, 11, 8], [6, 5, 4, 10, 9]
        ];
        return this.make_d10_geom(vertices.map(v => new THREE.Vector3(v[0], v[1], v[2])), faces, radius, 0.3, Math.PI);
    }

    private create_d12_geometry(radius: number) {
        const p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        const vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
        [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
        [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
        [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        const faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
        [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
        [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return this.create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2);
    }

    private create_d20_geometry(radius: number) {
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        const faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
        [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
        [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
        [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return this.create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2);
    }
}
