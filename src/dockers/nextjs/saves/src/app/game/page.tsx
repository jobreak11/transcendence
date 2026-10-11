"use client"
import { useState , useEffect } from "react";
import { signOut } from "../../lib/auth";
// import Link from "next/link";
import HandInfo from "./components/handInfo";
import ActionButtons from "./components/ActionButtons";
// import Image from 'next/image';
import { io, Socket } from "socket.io-client";

// const SOCKET_URL = "http://localhost:3001";
// let socket: Socket;

// interface GameState {
//   tableId: string;
//   communityCards: string[];
//   playerHands: Record<string, string[]>;
// }

export default function Page() {
  const [showHandInfo, setShowHandInfo] = useState(false);
  const handleHandInfo = () => { setShowHandInfo(!showHandInfo); };
  // const [gameState, setGameState] = useState<GameState | null>(null);
  // const [connected, setConnected] = useState(false);

  // useEffect(() => {
  //   socket = io(SOCKET_URL);

  //   socket.on("connect", () => {
  //     setConnected(true);
  //     socket.emit("join-table", { tableId: "1" });
  //   });

  //   socket.on("disconnect", () => setConnected(false));
  //   socket.on("state-update", (newState: GameState) => {
  //     setGameState(newState);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  // const handleShuffleAndDeal = () => {
  //   if (!socket || !connected) return;
  //   socket.emit("shuffle-deal", { tableId: "1" });
  // };

  // const renderHoleCards = (seatKey: string) => {
  //   const cards = gameState?.playerHands?.[seatKey] || [];
  //   return (
  //     <div className="flex gap-[2%] items-center justify-center h-full w-full">
  //       {[0, 1].map((index) => {
  //         const card = cards[index];
  //         return (
  //           <div
  //             key={index}
  //             className="h-[30%] aspect-[60/85] border-2 border-dashed border-[#64748b] rounded-[10%] cursor-pointer transition-all duration-200 hover:border-blue-500 overflow-hidden bg-black/30"
  //           >
  //             {card && (
  //               <img
  //                 src={`/theme/standard/${card}.svg`}
  //                 alt={`Card ${index + 1}`}
  //                 className="w-full h-full object-contain"
  //               />
  //             )}
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // };

  // const renderSeat = (name: string) => (
  //   <div className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 font-bold cursor-pointer transition-all hover:border-blue-500 hover:text-black">
  //     {name.slice(0, 4)}
  //   </div>
  // );

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
              cursor-pointer  transition-all duration-200 hover:border-[#f87171] group">
                <img 
                  src="/theme/standard/AC.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]">
                <img 
                  src="/theme/standard/AS.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]">
                <img 
                  src="/theme/standard/AH.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]">
                <img 
                  src="/theme/standard/AD.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div id="slot" 
              className="h-[30%] aspect-[60/85] 
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-[#f87171]">
                <img 
                  src="/theme/standard/3C.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
        </div>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[85%] left-[50%] z-60">
          <div id="seat1" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P1
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">WooInwZa007</h1>
                <p className="text-xs">Winrate: 10%</p>
                <p className="text-xs">Match Played: 10</p>
                <p className="text-xs">Hand played: 45</p>
                <p className="text-xs">Hand win: 6</p>
              </div>
            </div>
          </div>
        </div>

        <div id="hand1"
        className="absolute items-center justify-center top-[70%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%] z-50">
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500">
                <img 
                  src={`/theme/standard/3C.svg`} 
                  alt="first card"
                  className="w-full h-full object-contain"
                />
              </div>
          <div id="slot" 
              className="h-[30%] aspect-[60/85]
              border-2 border-dashed border-[#64748b] rounded-[10%] 
              cursor-pointer  transition-all duration-200 hover:border-blue-500">
                <img 
                  src={`/theme/standard/4H.svg`}
                  alt="second card"
                  className="w-full h-full object-contain"
                />
              </div>
        </div>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[82%] left-[18%] z-60">
          <div id="seat2" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P2
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">PingPong1715</h1>
              </div>
            </div>
          </div>
        </div>

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

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[50%] left-[7%] z-60">
          <div id="seat3" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P3
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">Maya2125</h1>
              </div>
            </div>
          </div>
        </div>

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

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[18%] left-[18%] z-60">
          <div id="seat4" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P4
            <div className="absolute top-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">Hirokun</h1>
                <p className="text-xs">Winrate: 70%</p>
                <p className="text-xs">Match Played: 841</p>
                <p className="text-xs">Hand played: 5404</p>
                <p className="text-xs">Hand win: 2475</p>
              </div>
            </div>
          </div>
        </div>

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

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[15%] left-[50%] z-60">
          <div id="seat5" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P5
            <div className="absolute top-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">Jonathan Bartling</h1>
                <p className="text-xs">Winrate: 100%</p>
                <p className="text-xs">Match Played: 7854</p>
                <p className="text-xs">Hand played: 18795</p>
                <p className="text-xs">Hand win: 10456</p>
              </div>
            </div>
          </div>
        </div>

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
        
        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[18%] left-[82%] z-60">
          <div id="seat6" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P6
            <div className="absolute top-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">Kings777</h1>
                <p className="text-xs">Winrate: 77%</p>
                <p className="text-xs">Match Played: 7777</p>
                <p className="text-xs">Hand played: 8759</p>
                <p className="text-xs">Hand win: 7451</p>
              </div>
            </div>
          </div>
        </div>

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

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[50%] left-[93%] z-60">
          <div id="seat7" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P7
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">L</h1>
              </div>
            </div>
          </div>
        </div>

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

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[82%] left-[82%] z-60">
          <div id="seat8" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P8
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden flex-col items-center pointer-events-none group-hover:flex">
              <div className="bg-black text-white rounded-xl p-4 border border-white w-[240px] text-left">
                <h1 className="font-bold text-sm">CatGamer</h1>
              </div>
            </div>
          </div>
        </div>

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

    <ActionButtons></ActionButtons>

    <div className="fixed top-[3vh] right-[3vw]">
      <button onClick={handleHandInfo}
       className="px-[1.2vw] py-[1.2vh] aspect-square text-[1.2vw] bg-sky-500 rounded-[100%] font-bold uppercase text-white cursor-pointer hover:bg-white hover:text-black active:translate-y-0.5">?</button>
    </div>
    {showHandInfo && <HandInfo handleHandInfo={handleHandInfo}/>}
    </main>
  )
}