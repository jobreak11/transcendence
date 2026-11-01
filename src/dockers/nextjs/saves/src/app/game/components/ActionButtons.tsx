import { useState } from "react";

type PokerAction = "FOLD" | "CHECK" | "CALL" | "RAISE";

interface ActionButtonsProps {
  disabled: boolean;
  callAmount: number;
  onAction: (action: PokerAction, amount?: number) => void;
}

export default function ActionButtons({
  disabled,
  callAmount,
  onAction,
}: ActionButtonsProps) {
  const [showRaiseOptions, setShowRaiseOptions] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(100);

  const submitRaise = () => {
    if (!Number.isSafeInteger(raiseAmount) || raiseAmount < 1) return;
    onAction("RAISE", raiseAmount);
    setShowRaiseOptions(false);
  };

  return (
    <div className="fixed bottom-[3vh] right-[3vw] z-70 flex flex-col items-end gap-[1.5vh]">
      {showRaiseOptions && (
        <div className="flex w-[25vw] flex-col gap-[1vh] rounded-[1vw] border border-neutral-800 bg-neutral-950 p-[1.5vw]">
          <label className="flex flex-col gap-1 text-sm text-white">
            Additional chips to raise
            <input
              type="number"
              min={1}
              step={1}
              value={raiseAmount}
              onChange={(event) => setRaiseAmount(Number(event.target.value))}
              disabled={disabled}
              className="rounded bg-neutral-800 px-3 py-2 text-white"
            />
          </label>
          <button
            type="button"
            onClick={submitRaise}
            disabled={disabled || !Number.isSafeInteger(raiseAmount) || raiseAmount < 1}
            className="w-full rounded bg-amber-500 py-[1vh] font-extrabold uppercase text-neutral-950 disabled:opacity-50"
          >
            Confirm raise
          </button>
        </div>
      )}

      <div className="flex gap-[1vw]">
        <button
          type="button"
          onClick={() => onAction("FOLD")}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-red-500 font-bold uppercase text-white transition-all hover:bg-red-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Fold
        </button>

        <button
          type="button"
          onClick={() => onAction(callAmount > 0 ? "CALL" : "CHECK")}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-green-700 font-bold uppercase text-white transition-all hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {callAmount > 0 ? `Call ${callAmount}` : "Check"}
        </button>

        <button
          type="button"
          onClick={() => setShowRaiseOptions((visible) => !visible)}
          disabled={disabled}
          className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-blue-600 font-bold uppercase text-white transition-all hover:bg-sky-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showRaiseOptions ? "Cancel raise" : "Raise"}
        </button>
      </div>
      {!disabled && <p className="text-xs text-white/70">Your turn</p>}
    </div>
  );
}
