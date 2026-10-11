import { useState } from 'react';

export default function ActionButtons() {
  const [showRaiseOptions, setShowRaiseOptions] = useState(false);

  return (
    <div className="fixed bottom-[3vh] right-[3vw] flex flex-col items-end gap-[1.5vh] z-70">
      
      {showRaiseOptions && (
        <div className="flex flex-col gap-[1vh] bg-neutral-950 p-[1.5vw] rounded-[1vw] border border-neutral-800 w-[25vw]">
          <div className="grid grid-cols-4 gap-[0.5vw]">
            <button className="bg-neutral-800 text-white rounded-[10%] hover:bg-neutral-700 cursor-pointer">Min</button>
            <button className="bg-neutral-800 text-white rounded-[10%] hover:bg-neutral-700 cursor-pointer">2x</button>
            <button className="bg-neutral-800 text-white rounded-[10%] hover:bg-neutral-700 cursor-pointer">Pot</button>
            <button className="bg-neutral-800 text-red-400 py-[0.8vh] rounded-[10%] hover:bg-neutral-700 cursor-pointer">All-In</button>
          </div>
          
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold py-[1vh] text-[1.1vw] rounded-[0.4vw] uppercase tracking-wide transition-colors cursor-pointer">
            Confirm Raise
          </button>
        </div>
      )}

      <div className="flex gap-[1vw]">
        <button className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-red-500 font-bold uppercase text-white cursor-pointer hover:-translate-y-0.5 hover:bg-red-300 hover:text-black active:translate-y-0.5 transition-all">
          Fold
        </button>
        
        <button className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-green-700 font-bold uppercase text-white cursor-pointer hover:-translate-y-0.5 hover:bg-green-400 hover:text-black active:translate-y-0.5 transition-all">
          Call
        </button>
        
        <button 
          onClick={() => setShowRaiseOptions(!showRaiseOptions)}
          className={`px-[2.2vw] py-[1.2vh] text-[1.2vw] font-bold uppercase cursor-pointer active:translate-y-0.5 transition-all
            ${showRaiseOptions 
              ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-inner' 
              : 'bg-blue-600 text-white hover:-translate-y-0.5 hover:bg-sky-400 hover:text-black'
            }`}
        >
          {showRaiseOptions ? 'Cancel' : 'Raise'}
        </button>
      </div>

    </div>
  );
}
