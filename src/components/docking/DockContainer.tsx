import { useEffect, Suspense } from 'react';
import Dock, { type LayoutData, type TabData } from 'rc-dock';
import 'rc-dock/dist/rc-dock.css';
import { useDockingStore } from '../../stores/useDockingStore';
import { panelRegistry } from '../../lib/docking/PanelRegistry';
import { registerCorePanels } from '../../lib/docking/panels';

// Initialize panels
registerCorePanels();

export function DockContainer() {
    const { layoutState, updateLayout, loadLayout } = useDockingStore();

    useEffect(() => {
        loadLayout();
    }, [loadLayout]);

    const loadTab = (data: TabData) => {
        const panelId = data.id;
        if (!panelId) return { id: 'unknown', title: 'Unknown', content: <div>Unknown Panel</div> };

        const panelConfig = panelRegistry.get(panelId);
        if (!panelConfig) {
            return {
                id: panelId,
                title: panelId,
                content: <div className="p-4 text-red-500">Panel not found: {panelId}</div>
            };
        }

        const Component = panelConfig.component;

        return {
            id: panelConfig.id,
            title: panelConfig.title,
            closable: panelConfig.closeable,
            content: (
                <Suspense fallback={<div className="p-4 text-slate-500">Loading...</div>}>
                    <Component />
                </Suspense>
            ),
            group: panelConfig.defaultLocation // Helps with drag grouping
        };
    };

    return (
        <div className="w-full h-full dock-theme-dark">
            <Dock
                layout={layoutState.layout}
                onLayoutChange={updateLayout}
                loadTab={loadTab}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}
