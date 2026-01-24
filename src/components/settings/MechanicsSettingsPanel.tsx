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
                <Wrench className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-type-primary">Mechanics Settings</h2>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-type-tertiary uppercase tracking-wider">
                    Core Resolution
                </h3>

                <div>
                    <label className="block text-sm font-medium text-type-secondary mb-2">
                        Resolution Method
                    </label>
                    <div className="relative">
                        <select
                            value={mechanics.resolutionMethod}
                            onChange={(e) => updateMechanicsSettings({ resolutionMethod: e.target.value as ResolutionMethod })}
                            className="w-full px-3 py-2 bg-canvas-panel border border-border rounded-md text-type-primary focus:outline-none focus:ring-2 focus:ring-gold appearance-none cursor-pointer"
                        >
                            <option value="dc-2">DC - 2 Tiers</option>
                            <option value="dc-3">DC - 3 Tiers</option>
                            <option value="action-roll">Action Roll</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-type-tertiary">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-canvas-panel/50 rounded-lg p-4 border border-border">
                    <p className="text-sm text-type-secondary leading-relaxed">
                        {resolutionDescriptions[mechanics.resolutionMethod]}
                    </p>
                </div>
            </div>
        </div>
    );
}
