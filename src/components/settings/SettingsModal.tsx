import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { DiceSettingsPanel } from './DiceSettingsPanel';
import { EditorSettingsPanel } from './EditorSettingsPanel';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: 'dice' | 'editor';
}

export function SettingsModal({ isOpen, onClose, initialCategory = 'editor' }: SettingsModalProps) {
    const [activeCategory, setActiveCategory] = useState<'dice' | 'editor'>(initialCategory);

    if (!isOpen) return null;

    return (
        <SettingsLayout
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onClose={onClose}
        >
            {activeCategory === 'dice' && <DiceSettingsPanel />}
            {activeCategory === 'editor' && <EditorSettingsPanel />}
        </SettingsLayout>
    );
}
