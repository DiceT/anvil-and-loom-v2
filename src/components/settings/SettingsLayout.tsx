import { ReactNode } from 'react';
import { Dices, Type, Settings, X } from 'lucide-react';

interface SettingsLayoutProps {
    activeCategory: 'dice' | 'editor';
    onCategoryChange: (category: 'dice' | 'editor') => void;
    onClose: () => void;
    children: ReactNode;
}

export function SettingsLayout({ activeCategory, onCategoryChange, onClose, children }: SettingsLayoutProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl w-[800px] h-[600px] shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
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
                    <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => onCategoryChange('dice')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'dice'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Dices className="w-4 h-4" />
                            Dice
                        </button>
                        <button
                            onClick={() => onCategoryChange('editor')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'editor'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            Editor
                        </button>
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
