import { useState } from 'react';
import {
  Triangle,
  Square,
  Diamond,
  Pentagon,
  Hexagon,
  Circle,
  Percent,
  Eraser,
  Dices,
  Info,
} from 'lucide-react';
import { rollDiceExpression } from '../../../core/dice/diceEngine';
import { logThread } from '../../../core/results/threadEngine';
import { IconButton } from '../../ui/IconButton';

type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export function DiceTool() {
  const [expression, setExpression] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('none');

  const handleDiceClick = (die: string) => {
    setExpression((prev) => {
      // Handle advantage/disadvantage mode
      if (advantageMode !== 'none') {
        const keepModifier = advantageMode === 'advantage' ? 'kh' : 'kl';
        const prefix = prev.trim() && !prev.trim().endsWith('+') && !prev.trim().endsWith('-') ? '+' : '';
        const newExpression = prev + prefix + `2${die}${keepModifier}`;

        // Reset advantage mode after use
        setAdvantageMode('none');
        return newExpression;
      }

      // Normal dice click logic
      const diePattern = new RegExp(`(\\d*)${die.replace('d', 'd')}`, 'i');
      const match = prev.match(diePattern);

      if (match) {
        // Die exists - increment the count
        const currentCount = match[1] ? parseInt(match[1], 10) : 1;
        const newCount = currentCount + 1;
        return prev.replace(diePattern, `${newCount}${die}`);
      } else {
        // Die doesn't exist - add it with a + if expression isn't empty
        const prefix = prev.trim() && !prev.trim().endsWith('+') && !prev.trim().endsWith('-') ? '+' : '';
        return prev + prefix + die;
      }
    });
    setError(null);
  };

  const handleModifierClick = (modifier: string) => {
    setExpression((prev) => prev + modifier);
    setError(null);
  };

  const handleRoll = async () => {
    if (!expression.trim()) {
      setError('Please enter a dice expression');
      return;
    }

    try {
      setError(null);
      // Roll the dice using the dice engine
      const result = await rollDiceExpression(expression);

      // Format the rolls for display with bold for kept dice
      const rollsText = result.rolls
        .map((r) => (r.kept ? `**${r.value}**` : `${r.value}`))
        .join(' + ');

      const modifierText = result.modifier
        ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`
        : '';

      // Create a Thread using the Thread engine
      logThread({
        header: `DICE: ${expression}`,
        result: `${result.total}`,
        content: `Expression: ${expression}\nRolls: ${rollsText}${modifierText}`,
        source: 'dice',
        meta: {
          expression: result.expression,
          rolls: result.rolls,
          modifier: result.modifier,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll dice');
    }
  };

  const handleClear = () => {
    setExpression('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Dice Tray Header */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Dice Tray
      </div>

      {/* Dice Icons */}
      <div className="flex items-center justify-center gap-2">
        <IconButton
          icon={Triangle}
          size="m"
          onClick={() => handleDiceClick('d4')}
          tooltip="d4"
        />
        <IconButton
          icon={Square}
          size="m"
          onClick={() => handleDiceClick('d6')}
          tooltip="d6"
        />
        <IconButton
          icon={Diamond}
          size="m"
          onClick={() => handleDiceClick('d8')}
          tooltip="d8"
        />
        <IconButton
          icon={Circle}
          size="m"
          onClick={() => handleDiceClick('d10')}
          tooltip="d10"
        />
        <IconButton
          icon={Pentagon}
          size="m"
          onClick={() => handleDiceClick('d12')}
          tooltip="d12"
        />
        <IconButton
          icon={Hexagon}
          size="m"
          onClick={() => handleDiceClick('d20')}
          tooltip="d20"
        />
        <IconButton
          icon={Percent}
          size="m"
          onClick={() => handleDiceClick('d100')}
          tooltip="d100"
        />
      </div>

      {/* Modifiers Row */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handleModifierClick('-1')}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
        >
          -1
        </button>
        <button
          onClick={() => setAdvantageMode(advantageMode === 'disadvantage' ? 'none' : 'disadvantage')}
          className={`px-3 py-1 text-xs rounded transition-colors ${advantageMode === 'disadvantage'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          data-tooltip="Disadvantage"
        >
          DIS
        </button>
        <button
          onClick={() => setAdvantageMode(advantageMode === 'advantage' ? 'none' : 'advantage')}
          className={`px-3 py-1 text-xs rounded transition-colors ${advantageMode === 'advantage'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          data-tooltip="Advantage"
        >
          ADV
        </button>
        <button
          onClick={() => handleModifierClick('+1')}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
        >
          +1
        </button>
      </div>

      {/* Dice Expression Label */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Dice Expression
      </div>

      {/* Expression Input */}
      <input
        type="text"
        value={expression}
        onChange={(e) => {
          setExpression(e.target.value);
          setError(null);
        }}
        placeholder="e.g., 2d6+3, d20+5"
        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleRoll();
          }
        }}
      />

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 px-2">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-1">
        <IconButton
          icon={Eraser}
          size="m"
          onClick={handleClear}
          tooltip="Clear expression"
        />
        <IconButton
          icon={Info}
          size="m"
          tooltip="kl         keep lowest&#10;kh         keep highest&#10;klN        keep lowest N&#10;khN        keep highest N"
        />
        <IconButton
          icon={Dices}
          size="m"
          onClick={handleRoll}
          disabled={!expression.trim()}
          tooltip="Roll dice"
        />
      </div>
    </div>
  );
}
