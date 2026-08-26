"use client";

import { useState } from 'react';
import Link from "next/link"

interface SquareProps {
  square: number | string | null;
  onSquareClick: () => void; 
}


function Square({ square, onSquareClick }: SquareProps) {
  return <button className="w-12 h-12 bg-white text-black border border-gray-400 font-bold text-xl m-[2px] hover:bg-gray-100 flex items-center justify-center"
          onClick={onSquareClick}
          >
          {square}
          </button>;
}

export default function Board() {
  const [xIsNext, setXIsNext] = useState(true);
  const [squares, setSquares] = useState(Array(9).fill(null));
  function handleClick(i:number){
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = "X";
    }
    else{
      nextSquares[i] = "O";
    }
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }
  return (
    <div className="flex flex-col items-center mt-10">
      <div className="flex">
        <Square square={squares[0]} onSquareClick={() => handleClick(0)}/>
        <Square square={squares[1]} onSquareClick={() => handleClick(1)}/>
        <Square square={squares[2]} onSquareClick={() => handleClick(2)}/>
      </div>
      <div className="flex">
        <Square square={squares[3]} onSquareClick={() => handleClick(3)}/>
        <Square square={squares[4]} onSquareClick={() => handleClick(4)}/>
        <Square square={squares[5]} onSquareClick={() => handleClick(5)}/>
      </div>
      <div className="flex">
        <Square square={squares[6]} onSquareClick={() => handleClick(6)}/>
        <Square square={squares[7]} onSquareClick={() => handleClick(7)}/>
        <Square square={squares[8]} onSquareClick={() => handleClick(8)}/>
      </div>
    </div>
  );
}


