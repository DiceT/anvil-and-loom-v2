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
                <LinkIcon className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">AI Connection</h2>
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
        </div>
    );
}
