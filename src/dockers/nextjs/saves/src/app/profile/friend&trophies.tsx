'use client';

import { useState } from 'react';

export function Friend_Trophieslist() {
    return (
        // เพิ่ม text-white เพื่อให้ตัวอักษรสีขาวมองเห็นชัดบนพื้นหลังสีเทาเข้ม
        <div className="mx-auto flex flex-col w-full max-w-4xl bg-[#3a3a3a] p-4 shadow-md text-white mt-8">
            
            {/* ส่วน Friends */}
            <p className="mb-3">Friends:</p>
            
            {/* กล่องใส่รูปเพื่อน (ใช้ flex เรียงแนวนอน และ gap-4 เว้นระยะห่างรูป) */}
            <div className="flex gap-4 mb-8 pl-2">
                <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop" 
                    alt="Friend 1" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-500"
                />
                <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" 
                    alt="Friend 2" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-500"
                />
            </div>

            {/* ส่วน Trophies */}
            <p className="mb-3">Trophies:</p>
            
            {/* กล่องใส่รูปถ้วยรางวัล */}
            <div className="flex gap-4 pl-2">
                <img 
                    src="https://images.unsplash.com/photo-1578269174936-2709b6aeb913?q=80&w=150&auto=format&fit=crop" 
                    alt="Trophy 1" 
                    className="w-16 h-16 rounded-lg object-cover border-2 border-yellow-600 shadow-lg shadow-yellow-600/20"
                />
                 <img 
                    src="https://images.unsplash.com/photo-1589802713828-56961fb22488?q=80&w=150&auto=format&fit=crop" 
                    alt="Trophy 2" 
                    className="w-16 h-16 rounded-lg object-cover border-2 border-slate-400"
                />
            </div>

        </div>
    );
}