const fs = require('fs');

const content = `import { useConvexPolyhedron, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useMemo } from 'react';
import { getDiceMaterial, MaterialPreset } from './DiceMaterials';
import { generateDiceTextures, createDiceMaterialsArray } from './DiceTextureGenerator';
import { useDiceModel } from './useDiceModel';

// Robust helper to create convex hull from Three.js geometry
function createConvexHull(geometry: THREE.BufferGeometry) {
    const geo = geometry.index ? geometry.toNonIndexed() : geometry;
    const pos = geo.attributes.position;
    const vertices: number[][] = [];
    const faces: number[][] = [];
    
    const tolerance = 1e-4;
    const map = new Map();
    
    const getKey = (x, y, z) => \`\${Math.round(x / tolerance)},\${Math.round(y / tolerance)},\${Math.round(z / tolerance)}\`;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const key = getKey(x, y, z);
        
        if (!map.has(key)) {
            map.set(key, vertices.length);
            vertices.push([x, y, z]);
        }
    }
    
    for (let i = 0; i < pos.count; i += 3) {
        const a = map.get(getKey(pos.getX(i), pos.getY(i), pos.getZ(i)));
        const b = map.get(getKey(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)));
        const c = map.get(getKey(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2)));
        
        if (a !== b && b !== c && c !== a) {
            faces.push([a, b, c]);
        }
    }
    
    return { vertices, faces };
}

interface DieProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    color?: string;
    material?: MaterialPreset;
    numberColor?: string;
    showNumbers?: boolean;
}

export function D4({ position = [0, 5, 0], rotation = [0, 0, 0], color = '#8b5cf6', material = 'plastic' }: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.TetrahedronGeometry(1), []);
    const loadedGeometry = useDiceModel('d4', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const { vertices, faces } = useMemo(() => createConvexHull(fallbackGeometry), [fallbackGeometry]);

    const [ref] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        rotation,
        args: [vertices, faces, []] as any,
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshPhysicalMaterial {...materialProps} />
        </mesh>
    );
}

export function D6({
    position = [0, 5, 0],
    rotation = [0, 0, 0],
    color = '#8b5cf6',
    material = 'plastic',
    numberColor = '#ffffff',
    showNumbers = true
}: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.BoxGeometry(1.5, 1.5, 1.5), []);
    const loadedGeometry = useDiceModel('d6', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const materials = useMemo(() => {
        if (!showNumbers) return new THREE.MeshStandardMaterial(materialProps);
        const textures = generateDiceTextures(6, { numberColor, backgroundColor: 'transparent' });
        return createDiceMaterialsArray(textures, materialProps);
    }, [showNumbers, numberColor, materialProps]);

    const [ref] = useBox(() => ({
        mass: 1,
        position,
        rotation,
        args: [1.5, 1.5, 1.5],
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry} material={materials} />
    );
}

export function D8({ position = [0, 5, 0], rotation = [0, 0, 0], color = '#8b5cf6', material = 'plastic' }: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.OctahedronGeometry(1), []);
    const loadedGeometry = useDiceModel('d8', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const { vertices, faces } = useMemo(() => createConvexHull(fallbackGeometry), [fallbackGeometry]);

    const [ref] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        rotation,
        args: [vertices, faces, []] as any,
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshPhysicalMaterial {...materialProps} />
        </mesh>
    );
}

export function D10({ position = [0, 5, 0], rotation = [0, 0, 0], color = '#8b5cf6', material = 'plastic' }: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.CylinderGeometry(0.7, 0.7, 1.4, 7, 1), []);
    const loadedGeometry = useDiceModel('d10', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const { vertices, faces } = useMemo(() => createConvexHull(fallbackGeometry), [fallbackGeometry]);

    const [ref] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        rotation,
        args: [vertices, faces, []] as any,
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshPhysicalMaterial {...materialProps} />
        </mesh>
    );
}

export function D12({ position = [0, 5, 0], rotation = [0, 0, 0], color = '#8b5cf6', material = 'plastic' }: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.DodecahedronGeometry(1), []);
    const loadedGeometry = useDiceModel('d12', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const { vertices, faces } = useMemo(() => createConvexHull(fallbackGeometry), [fallbackGeometry]);

    const [ref] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        rotation,
        args: [vertices, faces, []] as any,
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshPhysicalMaterial {...materialProps} />
        </mesh>
    );
}

export function D20({ position = [0, 5, 0], rotation = [0, 0, 0], color = '#8b5cf6', material = 'plastic' }: DieProps) {
    const fallbackGeometry = useMemo(() => new THREE.IcosahedronGeometry(1), []);
    const loadedGeometry = useDiceModel('d20', fallbackGeometry);
    const geometry = loadedGeometry || fallbackGeometry;
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);

    const { vertices, faces } = useMemo(() => createConvexHull(fallbackGeometry), [fallbackGeometry]);

    const [ref] = useConvexPolyhedron(() => ({
        mass: 1,
        position,
        rotation,
        args: [vertices, faces, []] as any,
    }));

    if (!geometry) return null;

    return (
        <mesh ref={ref as any} castShadow receiveShadow geometry={geometry}>
            <meshPhysicalMaterial {...materialProps} />
        </mesh>
    );
}
`;

fs.writeFileSync('e:/Anvil and Loom/anvil-and-loom-v2/src/components/dice/DiceModels.tsx', content, 'utf8');
console.log('File restored!');
