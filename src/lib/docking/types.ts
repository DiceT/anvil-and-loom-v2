import type { LayoutData, TabData } from 'rc-dock';
import type { ComponentType } from 'react';

export interface PanelConfig {
    id: string;
    title: string;
    icon?: ComponentType<{ className?: string }>;
    component: ComponentType;
    defaultLocation?: 'left' | 'center' | 'right';
    allowMultiple?: boolean;
    closeable?: boolean;
    minWidth?: number;
    minHeight?: number;
}

export interface LayoutState {
    version: string;
    layout: LayoutData;
    openPanels: string[];
}

export interface PanelTabData extends TabData {
    id: string;
    panelConfig?: PanelConfig;
}
