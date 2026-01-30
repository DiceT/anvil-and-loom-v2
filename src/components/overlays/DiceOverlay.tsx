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

            // Handle Visibility
            let hideTimeout: NodeJS.Timeout;

            const onRollStart = () => {
                if (hideTimeout) clearTimeout(hideTimeout);
                if (containerRef.current) {
                    containerRef.current.style.visibility = 'visible';
                    containerRef.current.style.opacity = '1';
                    // Force resize just in case
                    diceEngine.resize();
                }
            };

            const onRollComplete = (results: any) => {
                // Log to session
                try {
                    // Dynamic import to avoid cycles or context issues
                    import('../../stores/useSessionStore').then(({ useSessionStore }) => {
                        import('../../utils/threadCardFactory').then(({ createDiceCard }) => {
                            const { activeSessionId, addCard } = useSessionStore.getState();
                            if (activeSessionId) {
                                // Map results to card format
                                // results: { total, notation, breakdown: number[], modifier }
                                // If notation is missing, infer it?
                                const expression = results.notation || 'Custom Roll';

                                const card = createDiceCard(activeSessionId, {
                                    expression,
                                    rolls: results.breakdown || [results.total],
                                    modifier: results.modifier || 0,
                                    total: results.total,
                                    // Check if success/failure is in metadata
                                    // dc: results.meta?.dc,
                                    // success: results.meta?.success
                                });
                                addCard(card);
                            }
                        });
                    });
                } catch (e) {
                    console.error('Failed to log dice roll:', e);
                }

                // Delay hiding
                hideTimeout = setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.style.visibility = 'hidden';
                    }
                }, 30000);
            };

            diceEngine.on('rollStart', onRollStart);
            diceEngine.on('rollComplete', onRollComplete);

            return () => {
                window.removeEventListener('resize', handleResize);
                diceEngine.off('rollStart', onRollStart);
                diceEngine.off('rollComplete', onRollComplete);
            };
        }
    }, []);

    // Default hidden but with dimensions
    return (
        <div
            id="dice-overlay"
            ref={containerRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ background: 'transparent', visibility: 'hidden', opacity: 0 }}
        />
    );
}
