import { useState, useEffect } from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAiStore } from '../../stores/useAiStore';
import { getAllPersonas } from '../../core/ai/personaDefaults';
import { GmPersonaId } from '../../types/ai';
import { testAiConnection } from '../../core/ai/aiClient';

export function AiSettingsPanel() {
    const {
        settings,
        updateConnectionSettings,
        setActivePersona,
        updatePersonaName,
        updatePersonaInstructions,
        getEffectivePersona,
    } = useAiStore();

    const [model, setModel] = useState(settings.model);
    const [uri, setUri] = useState(settings.uri);
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [showApiKey, setShowApiKey] = useState(false);

    const [activePersonaId, setActivePersonaIdLocal] = useState<GmPersonaId>(settings.activePersonaId);
    const [personaName, setPersonaName] = useState('');
    const [personaInstructions, setPersonaInstructions] = useState('');

    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

    const personas = getAllPersonas();

    // Load effective persona when active persona changes
    useEffect(() => {
        const effective = getEffectivePersona(activePersonaId);
        setPersonaName(effective.name);
        setPersonaInstructions(effective.instructions);
    }, [activePersonaId, getEffectivePersona]);

    const handleSaveConnection = () => {
        updateConnectionSettings(model, uri, apiKey);
        setConnectionStatus('idle');
        setConnectionMessage('');
    };

    const handleTestConnection = async () => {
        if (!model || !uri || !apiKey) {
            setConnectionStatus('error');
            setConnectionMessage('Please fill in all connection fields');
            return;
        }

        setTestingConnection(true);
        setConnectionStatus('idle');
        setConnectionMessage('');

        try {
            await testAiConnection(uri, apiKey, model);
            setConnectionStatus('success');
            setConnectionMessage('Connection successful!');
        } catch (error) {
            setConnectionStatus('error');
            setConnectionMessage(error instanceof Error ? error.message : 'Connection failed');
        } finally {
            setTestingConnection(false);
        }
    };

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
        const effective = getEffectivePersona(activePersonaId);
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
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">AI Settings</h2>
            </div>

            {/* Connection Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Connection Configuration
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Model
                    </label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., gpt-4o, ollama:llama3.1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        URI
                    </label>
                    <input
                        type="text"
                        value={uri}
                        onChange={(e) => setUri(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., https://api.openai.com/v1/chat/completions"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter your API key"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-300"
                        >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSaveConnection}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Save Connection
                    </button>
                    <button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                </div>

                {connectionStatus !== 'idle' && (
                    <div
                        className={`p-3 rounded-md text-sm ${connectionStatus === 'success'
                                ? 'bg-green-900/20 border border-green-700 text-green-300'
                                : 'bg-red-900/20 border border-red-700 text-red-300'
                            }`}
                    >
                        {connectionMessage}
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700" />

            {/* GM Persona Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    GM Persona
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Persona
                    </label>
                    <select
                        value={activePersonaId}
                        onChange={(e) => handlePersonaChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {personas.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                                {persona.defaultName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        GM Name
                    </label>
                    <input
                        type="text"
                        value={personaName}
                        onChange={(e) => setPersonaName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Morgan the Archivist"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Persona Instructions
                    </label>
                    <textarea
                        value={personaInstructions}
                        onChange={(e) => setPersonaInstructions(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="Persona-specific instructions..."
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        These instructions are added on top of the universal GM instructions.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSavePersona}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Save Persona
                    </button>
                    <button
                        onClick={handleResetPersona}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
}
