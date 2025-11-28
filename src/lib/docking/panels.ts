import { lazy } from 'react';
import { panelRegistry } from './PanelRegistry';
import { FolderTree, Wrench, Edit3 } from 'lucide-react';

// Lazy load components to avoid circular dependencies and improve performance
const TapestryPanel = lazy(() => import('../../components/layout/LeftLane').then(m => ({ default: m.LeftLane })));
const EditorPanel = lazy(() => import('../../components/layout/CenterLane').then(m => ({ default: m.CenterLane })));
const ToolsPanel = lazy(() => import('../../components/layout/RightLane').then(m => ({ default: m.RightLane })));

export function registerCorePanels() {
    panelRegistry.register({
        id: 'tapestry',
        title: 'Tapestry',
        icon: FolderTree,
        component: TapestryPanel,
        defaultLocation: 'left',
        closeable: false,
    });

    panelRegistry.register({
        id: 'editor',
        title: 'Editor',
        icon: Edit3,
        component: EditorPanel,
        defaultLocation: 'center',
        closeable: false,
    });

    panelRegistry.register({
        id: 'tools',
        title: 'Tools',
        icon: Wrench,
        component: ToolsPanel,
        defaultLocation: 'right',
        closeable: false,
    });

    /*
    panelRegistry.register({
        id: 'dice-tray',
        title: 'Dice Tray',
        icon: Box,
        component: DiceTrayPanel,
        defaultLocation: 'right',
        closeable: true,
    });
    */
}
