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
            <div className="bg-slate-900 rounded-xl w-[1000px] h-[900px] shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-bold text-slate-100">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-1 overflow-y-auto">
                        <button
                            onClick={() => onCategoryChange('editor')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'editor'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            Editor
                        </button>

                        <button
                            onClick={() => onCategoryChange('mechanics')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'mechanics'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Wrench className="w-4 h-4" />
                            Mechanics
                        </button>

                        {/* AI Section */}
                        <div className="pt-2 pb-1">
                            <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                AI
                            </div>
                        </div>

                        <button
                            onClick={() => onCategoryChange('ai-connection')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-connection'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <LinkIcon className="w-3 h-3" />
                            Connection
                        </button>

                        <button
                            onClick={() => onCategoryChange('ai-persona')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-persona'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Users className="w-3 h-3" />
                            GM Persona
                        </button>

                        <button
                            onClick={() => onCategoryChange('ai-art')}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeCategory === 'ai-art'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Palette className="w-3 h-3" />
                            Art Style
                        </button>

                        <div className="mt-auto pt-4 border-t border-slate-800">
                            <button
                                onClick={() => onCategoryChange('account')}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'account'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Account
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
