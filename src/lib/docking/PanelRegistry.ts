import type { PanelConfig } from './types';

class PanelRegistry {
    private panels: Map<string, PanelConfig> = new Map();

    register(config: PanelConfig): void {
        if (this.panels.has(config.id)) {
            console.warn(`Panel ${config.id} is already registered. Overwriting.`);
        }
        this.panels.set(config.id, config);
    }

    unregister(id: string): void {
        this.panels.delete(id);
    }

    get(id: string): PanelConfig | undefined {
        return this.panels.get(id);
    }

    getAll(): PanelConfig[] {
        return Array.from(this.panels.values());
    }

    getAllByLocation(location: string): PanelConfig[] {
        return this.getAll().filter(
            (panel) => panel.defaultLocation === location
        );
    }

    has(id: string): boolean {
        return this.panels.has(id);
    }
}

export const panelRegistry = new PanelRegistry();
