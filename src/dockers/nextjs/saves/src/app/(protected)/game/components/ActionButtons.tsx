import { useState } from "react";
import type enDictionary from "../../../../dictionaries/en.json";

type PokerAction = "FOLD" | "CHECK" | "CALL" | "RAISE";
export type GameLanguage = "en" | "th" | "cn";
export type GameDictionary = typeof enDictionary.game;

interface ActionButtonsProps {
  disabled: boolean;
  callAmount: number;
  stack: number;
  dictionary: GameDictionary;
  onAction: (action: PokerAction, amount?: number) => void;
}

export default function ActionButtons({
  disabled,
  callAmount,
  stack,
  dictionary,
  onAction,
}: ActionButtonsProps) {
  const [showRaiseOptions, setShowRaiseOptions] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(100);
  const selectedRaiseAmount = Math.min(Math.max(raiseAmount, 1), stack);

  const submitRaise = () => {
    if (
      !Number.isSafeInteger(selectedRaiseAmount)
      || selectedRaiseAmount < 1
      || selectedRaiseAmount > stack
    ) return;
    onAction("RAISE", selectedRaiseAmount);
    setShowRaiseOptions(false);
  };

  const submitAllIn = () => {
    if (stack < 1) return;
    if (callAmount >= stack) {
      onAction("CALL");
    } else {
      onAction("RAISE", stack);
    }
    setShowRaiseOptions(false);
  };

  return (
    <div className="fixed bottom-[3vh] right-[3vw] z-70 flex flex-col items-end gap-[1.5vh]">
      {showRaiseOptions && (
        <div className="flex w-[min(90vw,25rem)] flex-col gap-3 rounded-xl border border-blue-300/30 bg-neutral-950 p-4 shadow-xl">
          <label className="flex flex-col gap-2 text-sm text-white">
            <span className="flex items-center justify-between gap-4">
              <span>{dictionary.additionalChips}</span>
              <output className="font-bold tabular-nums">{selectedRaiseAmount}</output>
            </span>
            <input
              type="range"
              min={1}
              max={Math.max(stack, 1)}
              step={1}
              value={selectedRaiseAmount}
              onChange={(event) => setRaiseAmount(Number(event.target.value))}
              disabled={disabled || stack < 1}
              aria-label={dictionary.additionalChips}
              className="w-full accent-amber-400 disabled:opacity-50"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitRaise}
              disabled={disabled || stack < 1}
              className="flex-1 rounded bg-amber-500 py-2 font-extrabold uppercase text-neutral-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dictionary.confirmRaise}
            </button>
            <button
              type="button"
              onClick={submitAllIn}
              disabled={disabled || stack < 1}
              className="flex-1 rounded border border-red-400 bg-red-700 py-2 font-extrabold uppercase text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {dictionary.allIn}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-[1vw]">
        <button
          type="button"
          onClick={() => onAction("FOLD")}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-red-500 font-bold uppercase text-white transition-all hover:bg-red-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {dictionary.fold}
        </button>

        <button
          type="button"
          onClick={() => onAction(callAmount > 0 ? "CALL" : "CHECK")}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-green-700 font-bold uppercase text-white transition-all hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {callAmount > 0
            ? `${dictionary.call} ${callAmount}`
            : dictionary.check}
        </button>

        <button
          type="button"
          onClick={() => setShowRaiseOptions((visible) => !visible)}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-blue-600 font-bold uppercase text-white transition-all hover:bg-sky-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showRaiseOptions ? dictionary.cancelRaise : dictionary.raise}
        </button>
      </div>
      {!disabled && <p className="text-xs text-white/70">{dictionary.yourTurn}</p>}
    </div>
  );
}
