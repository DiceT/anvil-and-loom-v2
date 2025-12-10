import { useEffect, useRef } from 'react';
import { diceEngine } from '../../integrations/anvil-dice-app/engine/DiceEngine';

export function DiceOverlay() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            diceEngine.initialize(containerRef.current);

            // Handle resize
            const handleResize = () => {
                diceEngine.resize();
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                // We probably don't want to destroy the engine on unmount if we want to keep state,
                // but for now, let's keep it clean or rely on the singleton nature.
                // If we destroy, we lose the physics world. 
                // diceEngine.destroy(); 
            };
        }
    }, []);

    return (
        <div
            id="dice-overlay"
            ref={containerRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ background: 'transparent' }} // Ensure transparency
        />
    );
}
