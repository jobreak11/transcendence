
export function CardSlot({ children }) {
  return (
    <div className="h-[30%] aspect-[60/85] 
        border-2 border-dashed border-[#64748b] rounded-[10%] 
        cursor-pointer  transition-all duration-200 hover:border-[#f87171]">
    {children}
    </div>
  );
};

export function PopUpTop({ children }) {
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
            <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                {children}
            </div>
        </div>
    );
};

export function PopUpUnder({ children }) {
    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
            <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                {children}
            </div>
        </div>
    );
};

export function SeatIcon({ children }){
    return (
        <div id="seat1" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            {children}
          </div>
    );
};

export function PlayerHand({ children, Position }){
    return (
        <div className={`absolute items-center justify-center ${Position} -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50`}>
            {children}
          </div>
    );
};
