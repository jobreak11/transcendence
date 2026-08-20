import Link from "next/link";

// literal type
type GameLife = 5 | 4 | 3 | 2 | 1; // life exsiting for game
type HatchingPhase = 3 | 2 | 1; // Ex.ข hatching to ก requires 3 turn
type BoardSlot = 6 | 5 | 4 | 3 | 2 | 1; // slot for card

type GamePhase = "Main_Phase" | "Attack_Phase" | "Defense_Phase" | "End_Phase";


let life: GameLife = 5;
let hatcingPhase: HatchingPhase = 3;
let boardSlot: BoardSlot = 1;
let is_placed_in_slot:boolean = false; // logic for placing slot in card status
let currentPhase: GamePhase = "Main_Phase"


export default function Page() {
	return (
		<div className='bg-black min-h-screen text-white flex flex-col items-center justify-center p-10'>
			<h1 className='text-4xl font-bold mb-6'>Duel Board</h1>
			<p className="mb-8">เตรียมพร้อมเข้าสู่สนามประลอง 3D!</p>
			{/* ปุ่มกดกลับไปหน้าหลัก*/}
			<Link href='../' className='bg-slate-700 p-3 rounded-xl hover:border-2 hover:border-white transition-all'>
					Back to Home
			</Link>
		</div>
	)
}