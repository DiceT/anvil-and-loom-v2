const fs = require('fs');

const filePath = 'e:/Anvil and Loom/anvil-and-loom-v2/src/components/dice/DiceModels.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match (simple string replacement)
const oldPattern = `const unsubscribe = api.velocity.subscribe((v) => {
            const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
            if (speed > 0.5) {
                import('./DiceAudio').then(({ diceAudio }) => diceAudio.playCollision(material, speed));
            }
        });
        return unsubscribe;
    }, [api, material]);`;

const newPattern = `let lastVelocity = [0, 0, 0];
        
        const unsubscribe = api.velocity.subscribe((v) => {
            // Calculate velocity change (acceleration)
            const deltaV = Math.sqrt(
                (v[0] - lastVelocity[0]) ** 2 +
                (v[1] - lastVelocity[1]) ** 2 +
                (v[2] - lastVelocity[2]) ** 2
            );
            
            // Only trigger on sudden velocity changes (impacts), not smooth falling
            if (deltaV > 2) {
                const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
                import('./DiceAudio').then(({ diceAudio }) => diceAudio.playCollision(material, speed));
            }
            
            lastVelocity = [v[0], v[1], v[2]];
        });
        
        return unsubscribe;
    }, [api, material]);`;

// Replace all occurrences
content = content.split(oldPattern).join(newPattern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully!');
