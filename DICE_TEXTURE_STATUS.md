# Dice Texture System - Current Status

**Date**: 2025-11-26
**Last Updated By**: Loomwright (shader implementation for engraved numbers)

## ✅ SOLUTION IMPLEMENTED: Engraved Number Detection

Loomwright solved the dice numbering problem by:

1. **Using STL models with engraved numbers** - The models in `public/models/dice/*.stl` have numbers physically carved into the geometry
2. **Geometric depth detection** - `DiceModelLoader.ts:107-139` analyzes vertex positions to detect engraved areas
3. **Custom shader** - `DiceModels.tsx:128-170` (D6 implementation) uses a custom shader to color engraved areas differently
4. **User-controlled colors** - Both dice color and number color come from settings, fully customizable

## Texture Atlas System

The texture atlas files in `public/models/dice/themes/` contain ALL numbers (1-20 plus percentile 00-90) in a single image:

- `diffuse-dark.png` - Light dice with dark numbers
- `diffuse-light.png` - Dark dice with light numbers
- `normal.png` - Normal map for 3D depth
- `specular.jpg` - Specular/reflectivity map

**How it should work**:
- D4 UVs should map to numbers 1-4 region of atlas
- D6 UVs should map to numbers 1-6 region of atlas
- D8 UVs should map to numbers 1-8 region of atlas
- D10 UVs should map to numbers 0-9 region of atlas
- D12 UVs should map to numbers 1-12 region of atlas
- D20 UVs should map to numbers 1-20 region of atlas
- D100 UVs should map to percentile numbers (00, 10, 20, etc.) region of atlas

## What Was Attempted

### 1. Texture Atlas with Auto-Generated UVs (Current State - NOT WORKING)
**Files modified**:
- `src/components/dice/DiceTextureLoader.ts` - Loads texture atlas files
- `src/components/dice/DiceModelLoader.ts` - Generates spherical UVs for STL models
- `src/components/dice/DiceModels.tsx` - Applies texture maps to all dice (D4, D8, D10, D12, D20, D100)

**Result**: Entire atlas wraps around each die, showing all numbers

### 2. Procedural Textures for D6 (Partially Working)
**Files modified**:
- `src/components/dice/DiceModels.tsx:117-149` - D6 uses `generateDiceTextures()` to create per-face textures

**Result**: D6 should have proper numbered faces using BoxGeometry's multi-material support

## Path Forward: Procedural Number Generation

**Decision**: Generate numbers procedurally instead of using texture atlas, which will allow:
- ✅ Custom fonts (user-configurable)
- ✅ Works with any geometry (no UV mapping required)
- ✅ Dynamic color changes
- ✅ Simpler implementation

### Implementation Plan

1. **Extend `DiceTextureGenerator.ts`** to support all dice types:
   - Currently only D6 is fully supported with per-face textures
   - Need to add support for D4, D8, D10, D12, D20, D100

2. **For simple geometries** (D6 using BoxGeometry):
   - Use multi-material approach (already working for D6)
   - Each face gets its own material with number texture

3. **For complex geometries** (D4, D8, D10, D12, D20, D100):
   - Two approaches possible:

     **Option A: Tri-planar mapping**
     - Project numbers from 3 axes (X, Y, Z)
     - Blend based on surface normal
     - Numbers appear on all faces but blended correctly

     **Option B: Dynamic texture atlas**
     - Generate custom atlas with only needed numbers
     - Use face-based UV unwrapping per die type
     - More complex but cleaner result

## Current File States

### DiceTextureLoader.ts
- Loads pre-made texture atlas files
- **STATUS**: Working but atlas approach abandoned
- **ACTION**: Can be deleted or repurposed

### DiceTextureGenerator.ts
- Generates procedural canvas-based textures
- Supports per-face number rendering
- **STATUS**: Working for D6
- **ACTION**: Needs extension for all dice types

### DiceModels.tsx
- **D6**: Uses procedural textures (line 117-149) ✅
- **D4, D8, D10, D12, D20, D100**: Use texture atlas (NOT WORKING) ❌
- **ACTION**: Update all dice to use procedural approach

### DiceModelLoader.ts
- Loads STL models
- Generates spherical UVs (line 14-37)
- **STATUS**: UV generation won't work for atlas
- **ACTION**: Keep STL loading, remove or repurpose UV generation

## Key Technical Details

### D6 Working Example (DiceModels.tsx:117-149)
```typescript
const materials = useMemo(() => {
    if (showNumbers) {
        const textures = generateDiceTextures(6, {
            numberColor,
            backgroundColor: color,
        });
        return createDiceMaterialsArray(textures, getDiceMaterial(material, color));
    }
    return undefined;
}, [material, color, numberColor, showNumbers]);

// Mesh uses materials array for multi-material support
<mesh ref={ref as any} castShadow receiveShadow geometry={geometry} material={materials || undefined}>
```

### Texture Generation (DiceTextureGenerator.ts:14-76)
- Creates 512x512 canvas per number
- Renders number with outline for visibility
- Returns THREE.CanvasTexture
- Supports custom font, colors, weights

## Next Steps

1. **Choose approach** for complex geometries (tri-planar vs dynamic atlas)
2. **Implement procedural textures** for D4, D8, D10, D12, D20, D100
3. **Add font customization** to DiceTextureGenerator
4. **Remove or repurpose** texture atlas code in DiceTextureLoader
5. **Test all dice types** with various colors and materials

## Files to Clean Up

- `public/models/dice/themes/*.png` - Can keep for reference or delete
- `src/components/dice/DiceTextureLoader.ts` - May not be needed
- `src/components/dice/DiceModelLoader.ts:14-37` - UV generation not needed for procedural approach

## Notes for Future Development

- D100 uses same D10 model (`DiceModelLoader.ts:119`)
- Font customization will require updating `generateFaceTexture()` parameters
- Consider adding font selection to `useDiceStore` settings
- May want to cache generated textures per font/color combination
