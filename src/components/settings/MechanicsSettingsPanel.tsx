import { Wrench } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ResolutionMethod, defaultMechanicsSettings } from '../../types/settings';

export function MechanicsSettingsPanel() {
    const { settings, updateMechanicsSettings } = useSettingsStore();
    const mechanics = settings.mechanics || defaultMechanicsSettings;

    const resolutionDescriptions: Record<ResolutionMethod, string> = {
        'dc-2': "Difficulty Check with success/failure tiers. Set the DC, click the light, and your next dice roll will resolve against the DC.",
        'dc-3': "Difficulty Check with success/success with consequences/failure tiers. Ensure that your tier differential is set (default -3), set the DC tier, click the light, and your next dice roll will resolve against the DC tiers.",
        'action-roll': "Action Die (d6) vs Challenge Dice (2d10) with Strong Hit/Weak Hit/Match tiers. Matching d10 rolls result in additional boon or bane. Set the bonus to the Action Die and click Roll to resolve the Action Roll."
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">Mechanics Settings</h2>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Core Resolution
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Resolution Method
                    </label>
                    <select
                        value={mechanics.resolutionMethod}
                        onChange={(e) => updateMechanicsSettings({ resolutionMethod: e.target.value as ResolutionMethod })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="dc-2">DC - 2 Tiers</option>
                        <option value="dc-3">DC - 3 Tiers</option>
                        <option value="action-roll">Action Roll</option>
                    </select>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {resolutionDescriptions[mechanics.resolutionMethod]}
                    </p>
                </div>
            </div>
        </div>
    );
}
