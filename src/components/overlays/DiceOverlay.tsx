import { useEffect, useRef } from 'react';
import { diceEngine } from '../../integrations/anvil-dice-app';

export function DiceOverlay() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Lifecycle Management
    useEffect(() => {
        if (containerRef.current) {
            console.log('[DiceOverlay] Mounting and initializing...');
            diceEngine.initialize(containerRef.current);

            // Handlers
            let hideTimeout: NodeJS.Timeout;

            const onRollStart = () => {
                if (hideTimeout) clearTimeout(hideTimeout);
                if (containerRef.current) {
                    containerRef.current.style.visibility = 'visible';
                    containerRef.current.style.opacity = '1';
                    diceEngine.resize();
                }
            };

            const onRollComplete = (results: any) => {
                console.log('[DiceOverlay] Event: rollComplete', results);

                // Dynamic import to avoid cycles
                Promise.all([
                    import('../../stores/useSessionStore'),
                    import('../../stores/useDifficultyStore'),
                    import('../../stores/useSettingsStore'),
                    import('../../utils/threadCardFactory')
                ]).then(([
                    sessionStoreModule,
                    difficultyStoreModule,
                    settingsStoreModule,
                    threadCardFactoryModule
                ]) => {
                    const { useSessionStore } = sessionStoreModule;
                    const { useDifficultyStore } = difficultyStoreModule;
                    const { useSettingsStore } = settingsStoreModule;
                    const { createDiceCard } = threadCardFactoryModule;

                    const { activeSessionId, addCard } = useSessionStore.getState();
                    const diffState = useDifficultyStore.getState();
                    const settingsState = useSettingsStore.getState();

                    if (!activeSessionId) return;

                    // Check for Suppression
                    if (results.meta?.suppressLogging) {
                        console.log('[DiceOverlay] Logging suppressed by meta flag.');
                        return;
                    }

                    try {
                        const expression = results.notation || 'Custom Roll';
                        const total = results.total;

                        // Check for Difficulty / Challenge Context
                        let dc = results.meta?.dc;
                        let success = results.meta?.success;
                        let outcome: string | undefined;
                        let formattedResult: string | undefined;

                        // Implicitly apply global check if enabled and not already defined
                        if (results.meta?.resolution === 'action-roll') {
                            // Action Roll Logic
                            const actionBonus = results.meta.actionBonus || 0;
                            const breakdown = results.breakdown || [];

                            // Safe processing of dice results
                            // We need RAW values for the display string: "d6 + bonus vs d10 | d10"
                            let d6Raw: number | undefined;
                            let d10_1: number | undefined;
                            let d10_2: number | undefined;

                            // Helper to extract value regardless of format
                            const getValue = (item: any): number => {
                                if (typeof item === 'number') return item;
                                return item ? (item.value || item.result || 0) : 0;
                            };

                            // Debug the raw breakdown for tracing
                            // console.log('[DiceOverlay] Breakdown Trace:', JSON.stringify(breakdown));

                            // Robust Identification Strategy:
                            // 1. Try to find all D10s (sides=10) and D6s (sides=6) explicitly
                            let foundD10s = Array.isArray(breakdown) ? breakdown.filter((d: any) =>
                                (typeof d === 'object' && (d.type === 'd10' || d.sides === 10))
                            ) : [];

                            let foundD6s = Array.isArray(breakdown) ? breakdown.filter((d: any) =>
                                (typeof d === 'object' && (d.type === 'd6' || d.sides === 6))
                            ) : [];

                            // 2. If explicit identification fails (e.g. Missing sides property), use Sorting Fallback
                            // We assume Action Roll is ALWAYS 1d6 + 2d10.
                            // If we just have 3 identifiable objects/numbers, we can sort them.
                            // BUT sorting by value is dangerous (d6 can be higher than d10).
                            // IF we have objects with 'sides', use that.

                            if (foundD10s.length === 2 && foundD6s.length === 1) {
                                // Perfect match
                                d6Raw = getValue(foundD6s[0]);
                                d10_1 = getValue(foundD10s[0]);
                                d10_2 = getValue(foundD10s[1]);
                            } else {
                                // Fallback: If we have 3 items, try to deduce based on what we DID find
                                // Or assume standard order if metadata missing.
                                // BUT user report suggests standard order is unreliable or sides missing.

                                // Last Resort: If we have objects with sides, sort by sides (6 < 10)
                                if (Array.isArray(breakdown) && breakdown.length >= 3 && typeof breakdown[0] === 'object' && breakdown[0].sides) {
                                    const sorted = [...breakdown].sort((a: any, b: any) => (a.sides || 0) - (b.sides || 0));
                                    // Expect [d6, d10, d10]
                                    d6Raw = getValue(sorted[0]);
                                    d10_1 = getValue(sorted[1]);
                                    d10_2 = getValue(sorted[2]);
                                } else if (Array.isArray(breakdown) && breakdown.length >= 3) {
                                    // Absolute fallback (index). 
                                    // User reports this might be failing (d6 not first?).
                                    // Let's assume standard engine output: d6, d10, d10.
                                    // If this fails, the engine output is non-deterministic or user input was '2d10+1d6'.
                                    d6Raw = getValue(breakdown[0]);
                                    d10_1 = getValue(breakdown[1]);
                                    d10_2 = getValue(breakdown[2]);
                                    console.warn('[DiceOverlay] Used index fallback for identification');
                                }
                            }

                            if (d6Raw !== undefined && d10_1 !== undefined && d10_2 !== undefined) {
                                const d6Total = d6Raw + actionBonus;
                                const isMatch = d10_1 === d10_2;

                                if (d6Total > d10_1 && d6Total > d10_2) {
                                    outcome = isMatch ? 'Strong Hit + Boon' : 'Strong Hit';
                                    success = true;
                                } else if (d6Total > d10_1 || d6Total > d10_2) {
                                    outcome = 'Weak Hit';
                                    success = true;
                                } else {
                                    if (isMatch) {
                                        outcome = 'Weak Hit + Bane'; // Corrected rule
                                        success = true;
                                    } else {
                                        outcome = 'Miss';
                                        success = false;
                                    }
                                }

                                // Set formatted result string using RAW value
                                formattedResult = `${d6Raw} + ${actionBonus} vs ${d10_1} | ${d10_2} → ${outcome}`;
                            } else {
                                console.warn('[DiceOverlay] Failed to parse Action Roll breakdown', results);
                                outcome = 'Error: Invalid Roll Data';
                            }
                        } else if (dc === undefined && diffState.isEnabled) {
                            dc = diffState.targetNumber;
                            const method = settingsState.settings.mechanics.resolutionMethod;

                            if (method === 'dc-3') {
                                const diff = diffState.tierDifferential;
                                const secondaryTarget = dc + diff;

                                if (total >= dc) {
                                    success = true;
                                } else if (total >= secondaryTarget) {
                                    success = false;
                                    outcome = "Success with Consequence";
                                } else {
                                    success = false;
                                }
                            } else {
                                success = total >= dc;
                            }
                        }

                        // Parse rolls safely for display
                        const safeRolls = Array.isArray(results.breakdown)
                            ? results.breakdown.map((b: any) => typeof b === 'number' ? b : (b.value || 0))
                            : [total];

                        const card = createDiceCard(activeSessionId, {
                            expression,
                            rolls: safeRolls,
                            modifier: results.modifier || 0,
                            total,
                            dc,
                            success,
                            outcome,
                            formattedResult
                        });

                        if (results.meta) {
                            card.meta = { ...card.meta, ...results.meta };
                        }

                        // Guarded check for addCard
                        if (addCard) {
                            addCard(card);
                        } else {
                            console.error('[DiceOverlay] addCard function missing from session store');
                        }

                    } catch (innerError) {
                        console.error('[DiceOverlay] Critical error processing roll:', innerError, results);
                        // Attempt fallback logging
                        try {
                            const fallbackCard = createDiceCard(activeSessionId, {
                                expression: results.notation || 'Error Roll',
                                rolls: [results.total || 0],
                                total: results.total || 0,
                                outcome: 'Processing Error'
                            });
                            addCard(fallbackCard);
                        } catch (fallbackError) {
                            console.error('[DiceOverlay] Fallback logging failed:', fallbackError);
                        }
                    }
                }).catch(err => console.error('Failed to log dice roll:', err));

                hideTimeout = setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.style.visibility = 'hidden';
                    }
                }, 30000);
            };

            const handleResize = () => diceEngine.resize();
            window.addEventListener('resize', handleResize);
            diceEngine.on('rollStart', onRollStart);
            diceEngine.on('rollComplete', onRollComplete);

            return () => {
                window.removeEventListener('resize', handleResize);
                diceEngine.off('rollStart', onRollStart);
                diceEngine.off('rollComplete', onRollComplete);
            };
        }
    }, []);

    return (
        <div
            id="dice-overlay"
            ref={containerRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ background: 'transparent', visibility: 'hidden', opacity: 0 }}
        />
    );
}
