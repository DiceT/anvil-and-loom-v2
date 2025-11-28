const fs = require('fs');

const filePath = 'e:/Anvil and Loom/anvil-and-loom-v2/src/components/dice/DiceModels.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match  the problematic material props that reference DiceTextureLoader
const oldPattern = `const materialProps = useMemo(() => {
        const props = getDiceMaterial(material, color);
        if (showNumbers) {
            // Remove color property to prevent it from tinting the texture
            const { color: _, ...propsWithoutColor } = props;
            return {
                ...propsWithoutColor,
                map: DiceTextureLoader.getDiffuseMap(numberColor),
                normalMap: DiceTextureLoader.getNormalMap(),
            };
        }
        return props;
    }, [material, color, numberColor, showNumbers]);`;

const newPattern = `// For now, uses solid color. Numbers will be added later with proper UV mapping
    const materialProps = useMemo(() => getDiceMaterial(material, color), [material, color]);`;

// Replace all occurrences
content = content.split(oldPattern).join(newPattern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all DiceTextureLoader references!');
