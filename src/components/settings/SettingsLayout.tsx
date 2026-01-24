import { ReactNode } from 'react';
import { Type, Settings, X, Sparkles, User, Wrench, Palette, Link as LinkIcon, Users } from 'lucide-react';

interface SettingsLayoutProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    onClose: () => void;
    children: ReactNode;
}

export function SettingsLayout({ activeCategory, onCategoryChange, onClose, children }: SettingsLayoutProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-canvas rounded-xl w-[1000px] h-[900px] shadow-2xl border border-border flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-canvas-surface">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-sapphire" />
                        <h2 className="text-lg font-bold text-type-primary">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-type-tertiary hover:text-type-primary p-1 hover:bg-canvas-panel rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-canvas-surface border-r border-border p-4 flex flex-col gap-1 overflow-y-auto">
                        <button
                            onClick={() => onCategoryChange('editor')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'editor'
                                ? 'bg-sapphire/20 text-sapphire'
                                : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            Editor
                        </button>

                        <button
                            onClick={() => onCategoryChange('mechanics')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'mechanics'
                                ? 'bg-gold/20 text-gold'
                                : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                }`}
                        >
                            <Wrench className="w-4 h-4" />
                            Mechanics
                        </button>

                        {/* AI Section */}
                        <div className="pt-2 pb-1">
                            <div className="px-4 py-1 text-xs font-semibold text-type-tertiary uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-ruby" />
                                AI
                            </div>
                        </div>

                        <button
                            onClick={() => onCategoryChange('ai-connection')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-connection'
                                ? 'bg-ruby/20 text-ruby'
                                : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                }`}
                        >
                            <LinkIcon className="w-3 h-3" />
                            Connection
                        </button>

                        <button
                            onClick={() => onCategoryChange('ai-persona')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-persona'
                                ? 'bg-ruby/20 text-ruby'
                                : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                }`}
                        >
                            <Users className="w-3 h-3" />
                            GM Persona
                        </button>

                        <button
                            onClick={() => onCategoryChange('ai-art')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-art'
                                ? 'bg-ruby/20 text-ruby'
                                : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                }`}
                        >
                            <Palette className="w-3 h-3" />
                            Art Style
                        </button>

                        <div className="mt-auto pt-4 border-t border-border">
                            <button
                                onClick={() => onCategoryChange('account')}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'account'
                                    ? 'bg-emerald/20 text-emerald'
                                    : 'text-type-tertiary hover:bg-canvas-panel hover:text-type-primary'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Account
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
