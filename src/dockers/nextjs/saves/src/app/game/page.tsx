"use client"
import { useState , useEffect } from "react";
import { signOut } from "../../lib/auth";
// import Link from "next/link";
import HandInfo from "./components/handInfo";
import ActionButtons from "./components/ActionButtons";
import { CardSlot, PopUpTop, PopUpUnder, SeatIcon, PlayerHand }  from "./components/layout";
// import Image from 'next/image';
import { io, Socket } from "socket.io-client";

export default function Page() {
  const [showHandInfo, setShowHandInfo] = useState(false);
  const handleHandInfo = () => { setShowHandInfo(!showHandInfo); };

  return (
    <main className="min-h-screen w-full bg-radial from-green-900 via-green-950 via-55% to-black flex justify-center items-center relative overflow-hidden">
        <div className="relative w-[85vw] max-w-[1100px] aspect-[16/10] flex justify-center items-center">
        <div id="table" 
            className="w-[78%] h-[58%] bg-[#0b6b3a] rounded-[160px] border-[20px] border-[#5c3a21]
             shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.7)]">
            <div id="pool" 
            className="absolute items-center justify-center top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex h-[35%] gap-[2%]">
              <CardSlot>
                <img 
                  src="/theme/standard/AC.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </CardSlot>
              <CardSlot>
                <img 
                  src="/theme/standard/AS.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </CardSlot>
              <CardSlot>
                <img 
                  src="/theme/standard/AH.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </CardSlot>
              <CardSlot>
                <img 
                  src="/theme/standard/AD.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </CardSlot>
              <CardSlot>
                <img 
                  src="/theme/standard/3C.svg" 
                  alt="Poker Hand Info" 
                  className="w-full h-full object-contain"
                />
              </CardSlot>
            </div>
        </div>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[85%] left-[50%] z-60">
          <SeatIcon>
            P1
            <PopUpTop>
                <h1 className="font-bold text-sm">WooInwZa007</h1>
                <p className="text-xs">Winrate: 10%</p>
                <p className="text-xs">Match Played: 10</p>
                <p className="text-xs">Hand played: 45</p>
                <p className="text-xs">Hand win: 6</p>
            </PopUpTop>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[70%] left-[50%]">
          <CardSlot>
            <img 
              src={`/theme/standard/3C.svg`} 
              alt="first card"
              className="w-full h-full object-contain"
            />
          </CardSlot>
          <CardSlot>
            <img 
              src={`/theme/standard/4H.svg`}
              alt="second card"
              className="w-full h-full object-contain"
            />
            </CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[82%] left-[18%] z-60">
          <SeatIcon>
            P2
            <PopUpTop>
                <h1 className="font-bold text-sm">PingPong1715</h1>
            </PopUpTop>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[67%] left-[25%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[50%] left-[7%] z-60">
          <SeatIcon>
            P3
            <PopUpTop>
                <h1 className="font-bold text-sm">Maya2125</h1>
            </PopUpTop>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[50%] left-[20%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[18%] left-[18%] z-60">
          <SeatIcon>
            P4
            <PopUpUnder>
                <h1 className="font-bold text-sm">Hirokun</h1>
                <p className="text-xs">Winrate: 70%</p>
                <p className="text-xs">Match Played: 841</p>
                <p className="text-xs">Hand played: 5404</p>
                <p className="text-xs">Hand win: 2475</p>
            </PopUpUnder>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[33%] left-[25%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[15%] left-[50%] z-60">
          <SeatIcon>
          P5
            <PopUpUnder>
                <h1 className="font-bold text-sm">Jonathan Bartling</h1>
                <p className="text-xs">Winrate: 100%</p>
                <p className="text-xs">Match Played: 7854</p>
                <p className="text-xs">Hand played: 18795</p>
                <p className="text-xs">Hand win: 10456</p>
            </PopUpUnder>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[30%] left-[50%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[18%] left-[82%] z-60">
          <div id="seat6" 
          className="w-full h-full aspect-square rounded-full flex justify-center items-center bg-neutral-400 border-[3px] border-neutral-500 cursor-pointer hover:border-blue-500 hover:text-black">
            P6
            <PopUpUnder>
                <h1 className="font-bold text-sm">Kings777</h1>
                <p className="text-xs">Winrate: 77%</p>
                <p className="text-xs">Match Played: 7777</p>
                <p className="text-xs">Hand played: 8759</p>
                <p className="text-xs">Hand win: 7451</p>
            </PopUpUnder>
          </div>
        </div>

        <PlayerHand Position="top-[33%] left-[75%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[50%] left-[93%] z-60">
          <SeatIcon>
            P7
            <PopUpTop>
                <h1 className="font-bold text-sm">L</h1>
            </PopUpTop>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[50%] left-[80%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>

        <div className="group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 top-[82%] left-[82%] z-60">
          <SeatIcon>
          P8
            <PopUpTop>
                <h1 className="font-bold text-sm">CatGamer</h1>
            </PopUpTop>
          </SeatIcon>
        </div>

        <PlayerHand Position="top-[67%] left-[75%]">
          <CardSlot></CardSlot>
          <CardSlot></CardSlot>
        </PlayerHand>
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