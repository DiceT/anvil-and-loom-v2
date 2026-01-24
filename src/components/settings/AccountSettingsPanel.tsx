import { User } from 'lucide-react';

export function AccountSettingsPanel() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">Account Settings</h2>
            </div>

            <div className="p-8 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500">
                <User className="w-12 h-12 mb-4 opacity-50" />
                <p>Account management coming soon.</p>
            </div>
        </div>
    );
}
