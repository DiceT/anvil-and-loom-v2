import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { DiceSettingsPanel } from './DiceSettingsPanel';
import { EditorSettingsPanel } from './EditorSettingsPanel';
import { AiSettingsPanel } from './AiSettingsPanel';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: 'dice' | 'editor' | 'ai';
}

export function SettingsModal({ isOpen, onClose, initialCategory = 'editor' }: SettingsModalProps) {
    const [activeCategory, setActiveCategory] = useState<'dice' | 'editor' | 'ai'>(initialCategory);

    if (!isOpen) return null;

    return (
        <SettingsLayout
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onClose={onClose}
        >
            {activeCategory === 'dice' && <DiceSettingsPanel />}
            {activeCategory === 'editor' && <EditorSettingsPanel />}
            {activeCategory === 'ai' && <AiSettingsPanel />}
        </SettingsLayout>
    );
}
