"use client"
import { useState } from "react";
import { signOut } from "../../lib/auth";
import Link from "next/link";
import HandInfo from "./components/handInfo";


export default function Page() {
  const [showHandInfo, setShowHandInfo] = useState(false);
  const handleHandInfo = () => {
    setShowHandInfo(!showHandInfo);
  };
  return (
    <main className="min-h-screen w-full bg-radial from-green-900 via-green-950 via-55% to-black flex justify-center items-center relative overflow-hidden">
        <div className="relative w-[85vw] max-w-[1100px] aspect-[16/10] flex justify-center items-center">
        <div id="table" 
            className="w-[78%] h-[58%] bg-[#0b6b3a] rounded-[160px] border-[20px] border-[#5c3a21]
             shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.7)]">
            <div id="pool" 
            className="absolute items-center justify-center top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%]">
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]"></div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]"></div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]"></div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]"></div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]"></div>
            </div>
        </div>
        <div id="seat1" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[85%] left-[50%]">P1</div>
        <div id="hand1"
        className="absolute items-center justify-center top-[70%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat2" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[82%] left-[18%]">P2</div>
        <div id="hand2"
        className="absolute items-center justify-center top-[67%] left-[25%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat3" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500 
        -translate-x-1/2 -translate-y-1/2 top-[50%] left-[7%]">P3</div>
        <div id="hand3"
        className="absolute items-center justify-center top-[50%] left-[20%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat4" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[18%] left-[18%]">P4</div>
        <div id="hand4"
        className="absolute items-center justify-center top-[33%] left-[25%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat5" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[15%] left-[50%]">P5</div>
        <div id="hand5"
        className="absolute items-center justify-center top-[30%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>
        
        <div id="seat6" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[18%] left-[82%]">P6</div>
        <div id="hand6"
        className="absolute items-center justify-center top-[33%] left-[75%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat7" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500
        -translate-x-1/2 -translate-y-1/2 top-[50%] left-[93%]">P7</div>
        <div id="hand7"
        className="absolute items-center justify-center top-[50%] left-[80%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>

        <div id="seat8" 
        className="absolute h-[11%] aspect-square rounded-full flex justify-center items-center font-bold border-[3px] border-neutral-500 
        -translate-x-1/2 -translate-y-1/2 top-[82%] left-[82%]">P8</div>
        <div id="hand8"
        className="absolute items-center justify-center top-[67%] left-[75%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500"></div>
        </div>
      </div>
    <div className="fixed bottom-[3vh] left-[3vw] bg-black border-2 border-[#444] rounded-[10%] px-[1.8vw] py-[1.2vh] text-white flex flex-col">
      <span className="text-[1vw] text-[#aaa] uppercase tracking-[1px] mb-[5px]">Chip</span>
      <span className="text-[2vw] font-bold text-[#2ecc71] font-mono">$7777</span>
    </div>

    <div className="fixed bottom-[3vh] right-[3vw] flex gap-[1vw]">
      <button className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-red-500 font-bold uppercase text-white cursor-pointer hover:-translate-y-0.5 hover:bg-red-300 hover:text-black active:translate-y-0.5">Fold</button>
      <button className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-green-700 font-bold uppercase text-white cursor-pointer hover:-translate-y-0.5 hover:bg-green-400 hover:text-black active:translate-y-0.5">Call</button>
      <button className="px-[2.2vw] py-[1.2vh] text-[1.2vw] bg-blue-600 font-bold uppercase text-white cursor-pointer hover:-translate-y-0.5 hover:bg-sky-400 hover:text-black active:translate-y-0.5">Raise</button>
    </div>

    <div className="fixed top-[3vh] right-[3vw]">
      <button onClick={handleHandInfo}
       className="px-[1.2vw] py-[1.2vh] aspect-square text-[1.2vw] bg-sky-500 rounded-[100%] font-bold uppercase text-white cursor-pointer hover:bg-white hover:text-black active:translate-y-0.5">?</button>
    </div>
    {showHandInfo && <HandInfo handleHandInfo={handleHandInfo}/>}
    </main>
  )
}