import { Dices, TentTree, Eclipse, List, Infinity } from 'lucide-react';
import { useToolStore, RightPaneMode } from '../../stores/useToolStore';
import { IconButton } from '../ui/IconButton';
import { DiceSettings } from '../settings/DiceSettings';

export function TopBar() {
  const { rightPaneMode, setRightPaneMode, setActiveTool } = useToolStore();

  const modeButtons: { mode: RightPaneMode; icon: typeof Dices; label: string }[] = [
    { mode: 'dice', icon: Dices, label: 'Dice' },
    { mode: 'environments', icon: TentTree, label: 'Environments' },
    { mode: 'oracles', icon: Eclipse, label: 'Oracles' },
  ];

  const handleModeClick = (mode: RightPaneMode) => {
    setRightPaneMode(mode);
    // If switching to dice mode, also activate the dice tool
    if (mode === 'dice') {
      setActiveTool('dice');
    }
  };

  const handleWeaveClick = () => {
    setRightPaneMode('weave');
  };

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between relative z-10">
      <h1 className="text-lg font-semibold text-slate-200">My Campaign</h1>

      {/* Mode Buttons */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {modeButtons.map(({ mode, icon, label }) => (
            <IconButton
              key={mode}
              icon={icon}
              size="xl"
              active={rightPaneMode === mode}
              onClick={() => handleModeClick(mode)}
              tooltip={label}
            />
          ))}

          {/* Weave Button */}
          <IconButton
            icon={Infinity}
            size="xl"
            active={rightPaneMode === 'weave'}
            onClick={handleWeaveClick}
            tooltip="The Weave"
          />

          {/* Results Button - Far Right */}
          <IconButton
            icon={List}
            size="xl"
            active={rightPaneMode === 'results'}
            onClick={() => handleModeClick('results')}
            tooltip="All Results"
          />
        </div>

        {/* Dice Settings (Temporary) */}
        <DiceSettings />
      </div>
    </div>
  );
}
