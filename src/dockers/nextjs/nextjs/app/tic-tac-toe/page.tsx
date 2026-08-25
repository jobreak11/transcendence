"use client";

import { useState } from 'react';
import Link from "next/link"


interface SquareProps{
  value: number | string | null;
}

function Square() {
  const [value, setValue] = useState<string | null>(null);
  function handleClick(){
    setValue('X');
  }
  return <button className="w-12 h-12 bg-white text-black border border-gray-400 font-bold text-xl m-[2px] hover:bg-gray-100 flex items-center justify-center"
          onClick={handleClick}
          >
          {value}
          </button>;
}

export default function Board() {
  return (
    <div className="flex flex-col items-center mt-10">
      <div className="flex">
        <Square/>
        <Square/>
        <Square/>
      </div>
      <div className="flex">
        <Square/>
        <Square/>
        <Square/>
      </div>
      <div className="flex">
        <Square/>
        <Square/>
        <Square/>
      </div>
    </div>
  );
}


