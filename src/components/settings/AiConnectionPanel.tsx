import { useState } from 'react';
import { Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { useAiStore } from '../../stores/useAiStore';
import { testAiConnection } from '../../core/ai/aiClient';

export function AiConnectionPanel() {
    const {
        settings,
        updateConnectionSettings,
    } = useAiStore();

    const [model, setModel] = useState(settings.model);
    const [uri, setUri] = useState(settings.uri);
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [showApiKey, setShowApiKey] = useState(false);

    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-ruby" />
                <h2 className="text-lg font-bold text-type-primary">AI Connection</h2>
            </div>

            {/* Connection Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-type-secondary uppercase tracking-wider">
                    Connection Configuration
                </h3>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        Model
                    </label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
                        placeholder="e.g., gpt-4o, ollama:llama3.1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        URI
                    </label>
                    <input
                        type="text"
                        value={uri}
                        onChange={(e) => setUri(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
                        placeholder="e.g., https://api.openai.com/v1/chat/completions"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-canvas-surface border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-ruby"
                            placeholder="Enter your API key"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-type-tertiary hover:text-type-primary"
                        >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSaveConnection}
                        className="px-4 py-2 bg-ruby hover:opacity-90 text-canvas rounded-md text-sm font-medium transition-colors"
                    >
                        Save Connection
                    </button>
                    <button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="px-4 py-2 bg-canvas-surface hover:bg-border text-type-primary rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                </div>

                {connectionStatus !== 'idle' && (
                    <div
                        className={`p-3 rounded-md text-sm ${connectionStatus === 'success'
                            ? 'bg-jade/10 border border-jade/50 text-jade'
                            : 'bg-error/10 border border-error/50 text-error'
                            }`}
                    >
                        {connectionMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
