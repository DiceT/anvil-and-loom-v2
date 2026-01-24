import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { EditorSettingsPanel } from './EditorSettingsPanel';
import { MechanicsSettingsPanel } from './MechanicsSettingsPanel';
import { AiConnectionPanel } from './AiConnectionPanel';
import { AiPersonaPanel } from './AiPersonaPanel';
import { AiArtStylePanel } from './AiArtStylePanel';
import { AccountSettingsPanel } from './AccountSettingsPanel';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: string;
}

export function SettingsModal({ isOpen, onClose, initialCategory = 'editor' }: SettingsModalProps) {
    const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

    if (!isOpen) return null;

    return (
        <SettingsLayout
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onClose={onClose}
        >
            {activeCategory === 'editor' && <EditorSettingsPanel />}
            {activeCategory === 'mechanics' && <MechanicsSettingsPanel />}
            {activeCategory === 'ai-connection' && <AiConnectionPanel />}
            {activeCategory === 'ai-persona' && <AiPersonaPanel />}
            {activeCategory === 'ai-art' && <AiArtStylePanel />}
            {activeCategory === 'account' && <AccountSettingsPanel />}
        </SettingsLayout>
    );
}
