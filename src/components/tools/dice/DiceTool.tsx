import { useState } from 'react';
import { rollDiceExpression } from '../../../core/dice/diceEngine';
import { logResultCard } from '../../../core/results/resultCardEngine';

export function DiceTool() {
  const [expression, setExpression] = useState('');

  const handleDiceButtonClick = (fragment: string) => {
    setExpression((prev) => prev + fragment);
  };

  const handleRoll = async () => {
    if (!expression.trim()) return;

    try {
      // Roll the dice using the dice engine
      const result = await rollDiceExpression(expression);

      // Format the rolls for display
      const rollsText = result.rolls
        .map((r) => `${r.value}`)
        .join(' + ');

      const modifierText = result.modifier
        ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`
        : '';

      // Create a result card using the result card engine
      logResultCard({
        header: `Dice Roll: ${expression}`,
        result: `${result.total}`,
        content: `Rolls: ${rollsText}${modifierText}`,
        source: 'dice',
        meta: {
          expression: result.expression,
          rolls: result.rolls,
          modifier: result.modifier,
        },
      });

      // Clear the expression after rolling
      setExpression('');
    } catch (error) {
      console.error('Error rolling dice:', error);
      // Optionally show an error message to the user
    }
  };

  const handleClear = () => {
    setExpression('');
  };

  return (
    <div className="space-y-3">
      {/* Expression Input */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Dice Expression
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="e.g., 2d6+3, 1d20+5"
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRoll();
            }
          }}
        />
      </div>

      {/* Common Dice Buttons */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">
          Quick Add
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleDiceButtonClick('d4')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d4
          </button>
          <button
            onClick={() => handleDiceButtonClick('d6')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d6
          </button>
          <button
            onClick={() => handleDiceButtonClick('d8')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d8
          </button>
          <button
            onClick={() => handleDiceButtonClick('d10')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d10
          </button>
          <button
            onClick={() => handleDiceButtonClick('d12')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d12
          </button>
          <button
            onClick={() => handleDiceButtonClick('d20')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d20
          </button>
          <button
            onClick={() => handleDiceButtonClick('d100')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            d100
          </button>
          <button
            onClick={() => handleDiceButtonClick('+')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRoll}
          disabled={!expression.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
        >
          Roll
        </button>
        <button
          onClick={handleClear}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded transition-colors text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
