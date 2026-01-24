import { useState, useEffect } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { useAiStore } from '../../stores/useAiStore';

export function AiArtStylePanel() {
    const {
        settings,
        updateArtStyleName,
        updateArtStyleInstructions,
    } = useAiStore();

    const artStyle = settings.artStyle || { name: '', instructions: '' };
    const [name, setName] = useState(artStyle.name);
    const [instructions, setInstructions] = useState(artStyle.instructions);

    // Sync local state when store changes externally (unlikely but good practice)
    useEffect(() => {
        const currentStyle = settings.artStyle || { name: '', instructions: '' };
        setName(currentStyle.name);
        setInstructions(currentStyle.instructions);
    }, [settings.artStyle]);

    const handleSave = () => {
        updateArtStyleName(name);
        updateArtStyleInstructions(instructions);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">Art Style</h2>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Artistic Direction
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Style Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Grimdark Oil Painting, Cyberpunk Neon"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Detailed Instructions
                    </label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="Instructions for the image generation model (e.g., 'Use high contrast, muted colors, focus on architecture...')"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        These instructions will be appended to image generation prompts.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Save Art Style
                    </button>
                </div>
            </div>
        </div>
    );
}
