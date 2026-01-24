import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useAiStore } from '../../stores/useAiStore';
import { getAllPersonas } from '../../core/ai/personaDefaults';
import { GmPersonaId } from '../../types/ai';

export function AiPersonaPanel() {
    const {
        settings,
        setActivePersona,
        updatePersonaName,
        updatePersonaInstructions,
        getEffectivePersona,
    } = useAiStore();

    const [activePersonaId, setActivePersonaIdLocal] = useState<GmPersonaId>(settings.activePersonaId);
    const [personaName, setPersonaName] = useState('');
    const [personaInstructions, setPersonaInstructions] = useState('');

    const personas = getAllPersonas();

    // Load effective persona when active persona changes
    useEffect(() => {
        const effective = getEffectivePersona(activePersonaId);
        setPersonaName(effective.name);
        setPersonaInstructions(effective.instructions);
    }, [activePersonaId, getEffectivePersona]);

    const handlePersonaChange = (personaId: string) => {
        const id = personaId as GmPersonaId;
        setActivePersonaIdLocal(id);
        setActivePersona(id);
    };

    const handleSavePersona = () => {
        updatePersonaName(activePersonaId, personaName);
        updatePersonaInstructions(activePersonaId, personaInstructions);
    };

    const handleResetPersona = () => {
        const personaDefault = personas.find(p => p.id === activePersonaId);
        if (personaDefault) {
            setPersonaName(personaDefault.defaultName);
            setPersonaInstructions(personaDefault.defaultInstructions);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-ruby" />
                <h2 className="text-lg font-bold text-type-primary">GM Persona</h2>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-type-secondary uppercase tracking-wider">
                    Persona Configuration
                </h3>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        Persona
                    </label>
                    <select
                        value={activePersonaId}
                        onChange={(e) => handlePersonaChange(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
                    >
                        {personas.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                                {persona.defaultName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        GM Name
                    </label>
                    <input
                        type="text"
                        value={personaName}
                        onChange={(e) => setPersonaName(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
                        placeholder="e.g., Morgan the Archivist"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        Persona Instructions
                    </label>
                    <textarea
                        value={personaInstructions}
                        onChange={(e) => setPersonaInstructions(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby font-mono text-sm"
                        placeholder="Persona-specific instructions..."
                    />
                    <p className="mt-1 text-xs text-type-tertiary">
                        These instructions are added on top of the universal GM instructions.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSavePersona}
                        className="px-4 py-2 bg-ruby hover:opacity-90 text-canvas rounded-md text-sm font-medium transition-colors"
                    >
                        Save Persona
                    </button>
                    <button
                        onClick={handleResetPersona}
                        className="px-4 py-2 bg-canvas-surface hover:bg-border text-type-primary rounded-md text-sm font-medium transition-colors"
                    >
                        Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
}
