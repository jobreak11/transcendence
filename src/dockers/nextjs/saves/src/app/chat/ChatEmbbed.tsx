'use client';

import { FormEvent, useState } from 'react';

export function ChatEmbbed () {
	const [input, setInput] = useState(false);
	const [friend_channel, setFriendchannel] = useState('');
	const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const message = input;
		if (!message) return;
		setInput('');
	};

	return (
		<div className="flex flex-col p-10 items-center z-50 shadow-2xl">
			<div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-xl h-[500px] flex flex-col p-4">
				
			</div>
		</div>
	);
}




// "use client";

// import { useState } from 'react';

// export default function ChatPage() {
//     const [input, setInput] = useState<string>("");
//     const [chatHistory, setChatHistory] = useState<string[]>([]);

//     const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();

//         if (input.trim() === "") return;

//         setChatHistory([...chatHistory, input]);
//         setInput("");
//     };

//     return (
//         <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center">
//             <h1 className="text-4xl font-bold mb-6">Global Chat Room (Offline Mode)</h1>

//             <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-xl h-[500px] flex flex-col p-4">
//                 {/* กล่องแสดงประวัติแชท */}
//                 <div className="flex-1 overflow-y-auto mb-4 border border-slate-700 p-4 rounded-lg bg-slate-800 flex flex-col">
//                     {chatHistory.length === 0 ? (
//                         <p className="text-slate-400 text-center mt-20">ยังไม่มีข้อความ ลองพิมพ์อะไรสักอย่างสิ...</p>
//                     ) : (
//                         chatHistory.map((msg, index) => (
//                             <div key={index} className="bg-blue-600 text-white p-3 rounded-xl mb-3 w-fit max-w-[80%] self-end">
//                                 {msg}
//                             </div>
//                         ))
//                     )}
//                 </div>

//                 {/* ฟอร์มสำหรับพิมพ์และส่งข้อความ */}
//                 <form onSubmit={handleSendMessage} className="flex gap-2">
//                     <input 
//                         type="text"
//                         value={input}
//                         onChange={(e) => setInput(e.target.value)}
//                         placeholder="พิมพ์ข้อความที่นี่..."
//                         className="flex-1 p-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
//                     />
//                     <button
//                         type="submit"
//                         className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
//                     >
//                         Send
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }