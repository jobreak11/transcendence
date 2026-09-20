'use client';

import { useState } from 'react';

export function FriendList() {
	const [isopen, setIsopen] = useState(false);
	const [friendList, setFriendList] = useState<string[]>([]);
	return (
		<div className="fixed bottom-0 right-10 z-50 w-[22rem] shadow-2x1 max-sm:right-0 max-sm:w-full">
				<section
				id="global-chat-popup"
				aria-label="Global chat room"
				className="flex flex-col overflow-hidden rounded-t-xl border border-white/15 border-b-0 bg-slate-950 shadow-black/50"
				>
					<header
						onClick={() =>setIsopen(!isopen)}
						className="flex cursor-point items-center justify-between bg-slate-900 px-4 py-3 transistion hover:bg-slate-800"
					>
						<div className="flex items-center gap-3">
							<div>
								<h2 className="text-sm font-semibold text-white">Friendlists</h2>
							</div>
						</div>
						<button
							type="button"
							aria-label={isopen ? 'Minimize list' : 'Expand list'}
							className="text-slate-400 hover:text-white">
						{isopen ? (
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15"></polyline></svg>
						) : (
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
						)}
						</button>
					</header>

					{/*Friend list display*/}
					{isopen && (
						<div className="flex h-[24rem] flex-col border-t border-white/10 max-sm:h-[calc(100vh-10rem)]">
							<div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-slate-800">
														<img 
							src="https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
							alt="Profile" 
							className="w-10 h-10 rounded-full object-cover" 
							/>	Cat <br />
							</div>
							<div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-slate-800">
														<img 
							src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFhkGKE5cQRKKWm10_78a2CyCKckupdz-FdCoDduPq6ebCl0F_SYvxmS5v&s=10" 
							alt="Profile" 
							className="w-10 h-10 rounded-full object-cover" 
							/>	The optimung price ou ou a a <br />
							</div>
						</div> 
					)}
				</section>
		</div>
	)
}

