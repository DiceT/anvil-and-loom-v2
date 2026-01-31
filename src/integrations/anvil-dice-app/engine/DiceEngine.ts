import { EngineCore } from './core/EngineCore';
import type { DiceTheme, RollResult, DiceRollRequest, DiePositionRequest } from './types';
import { DiceColors } from './DiceColors';

export type RollEventHandler = (result: RollResult) => void;

export class DiceEngine {
    private engineCore: EngineCore | null = null;
    private container: HTMLElement | null = null;
    private listeners: { [key: string]: Function[] } = {};
    private _pendingRollResolve: ((results: RollResult) => void) | null = null;
    private _pendingOptions: { meta?: any; cachedSettings?: any } | undefined;

    constructor() {
        // Pre-load colors/textures if needed, or wait for initialize
        new DiceColors();
    }

    /**
     * Get the underlying EngineCore instance.
     */
    public getEngineCore(): EngineCore | null {
        return this.engineCore;
    }

    /**
     * Initialize the 3D Engine into the given container.
     */
    public initialize(container: HTMLElement) {
        if (this.engineCore) {
            // If already initialized, just update the container if it changed
            if (this.container !== container) {
                this.container = container;
                // Move the canvas to the new container
                if (this.engineCore.getRenderer().domElement.parentElement !== container) {
                    container.appendChild(this.engineCore.getRenderer().domElement);
                }
                // Trigger resize to fit new container
                this.engineCore.handleResize(container);
            }
            return;
        }
        this.container = container;
        this.engineCore = new EngineCore(container);

        // Hook internal events
        this.engineCore.rollController.onRollComplete = (results) => {
            // Attach pending options if any
            const augmentedResults = this._pendingOptions?.meta
                ? { ...results, meta: this._pendingOptions.meta }
                : results;

            this.emit('rollComplete', augmentedResults);

            if (this._pendingRollResolve) {
                this._pendingRollResolve(augmentedResults);
                this._pendingRollResolve = null;
            }
            // Retain cached settings, clear only roll options
            if (this._pendingOptions) {
                this._pendingOptions.meta = undefined;
            }
        };

        this.engineCore.start();

        // Apply any cached settings from pre-init
        if (this._pendingOptions && (this._pendingOptions as any).cachedSettings) {
            // console.log('[DiceEngine] Applying cached settings on init.');
            this.updateSettings((this._pendingOptions as any).cachedSettings);
        }
    }

    /**
     * Roll dice based on notation (e.g., "2d20", "4d6") or a list of roll requests.
     * Returns a Promise that resolves with the results when the roll settles.
     */
    public async roll(
        request: string | DiceRollRequest[],
        options?: { meta?: any }
    ): Promise<RollResult> {
        if (!this.engineCore) throw new Error("Engine not initialized");

        return new Promise((resolve) => {
            // Cancel previous pending if any
            if (this._pendingRollResolve) {
                this._pendingRollResolve({ total: 0, notation: 'Cancelled', breakdown: [], modifier: 0 });
            }
            this._pendingRollResolve = resolve;
            this._pendingOptions = options;

            // Pass options through event if needed
            this.emit('rollStart', { request, options });

            this.engineCore!.rollController.roll(request);
        });
    }

    /**
     * Reposition dice to specific world coordinates and rotations.
     * NOTE: Optimal rotation is currently only mapped for d8. Other dice will use current rotation.
     */
    public async repositionDice(targets: DiePositionRequest[], duration?: number) {
        if (this.engineCore) {
            await this.engineCore.rollController.repositionDice(targets, duration);
        }
    }

    /**
     * Clear all dice from the table.
     */
    public clear() {
        if (this.engineCore) {
            this.engineCore.rollController.clear();
        }
    }

    /**
     * Convert screen coordinates to world position on the dice table.
     */
    public getWorldPosition(
        screenX: number,
        screenY: number
    ): { x: number; y: number; z: number } | null {
        if (!this.engineCore || !this.container) return null;

        const rect = this.container.getBoundingClientRect();
        // Normalize coordinates to -1 to +1, with inverted Y
        const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1;

        const vec = this.engineCore.getWorldPosition(ndcX, ndcY);
        return { x: vec.x, y: vec.y, z: vec.z };
    }

    /**
     * Update the visual theme of the dice.
     */
    public setTheme(theme: Partial<DiceTheme>) {
        if (this.engineCore) {
            this.engineCore.rollController.updateTheme(theme as DiceTheme);
        }
    }

    /**
     * Handle container resize.
     */
    public resize() {
        if (this.engineCore && this.container) {
            this.engineCore.handleResize(this.container);
            this.engineCore.fitBoundsToScreen();
        }
    }

    /**
     * Updates the engine settings (theme, physics, etc.)
     * If the engine is not initialized, settings are cached and applied on initialization.
     */
    public updateSettings(settings: any): void {
        if (this.engineCore && typeof (this.engineCore as any).updateSettings === 'function') {
            (this.engineCore as any).updateSettings(settings);
        } else {
            // console.log('[DiceEngine] Core not ready. Caching settings for init.');
            // Cache settings to be applied on initialize
            if (!this._pendingOptions) this._pendingOptions = {};
            this._pendingOptions = { ...this._pendingOptions, cachedSettings: settings };
        }
    }

    /**
     * Destroy the engine and clean up resources.
     */
    public destroy() {
        if (this.engineCore) {
            this.engineCore.destroy();
            this.engineCore = null;
        }
    }

    // --- Event Emitter ---
    public on(event: 'rollStart' | 'rollComplete', fn: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    public off(event: 'rollStart' | 'rollComplete', fn: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    }

    private emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(fn => fn(data));
        }
    }
}

// Export a singleton instance for simplicity
export const diceEngine = new DiceEngine();
