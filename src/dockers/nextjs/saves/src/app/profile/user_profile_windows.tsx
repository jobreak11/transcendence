'use client';

import { useState } from 'react';

export function UserProfile() {
  return (
    // กรอบหลัก: ใช้ flex เพื่อจัดให้รูปภาพกับข้อมูลเรียงซ้าย-ขวา และพื้นหลังสีเทาเข้ม
    <div className="mx-auto flex w-full max-w-4xl bg-[#3a3a3a] p-4 shadow-md">
      
      {/* ส่วนที่ 1: รูปโปรไฟล์ด้านซ้าย */}
      <div className="shrink-0">
        <img
          src="https://images.unsplash.com/photo-1602161726511-b062973eb7f9?q=80&w=250&auto=format&fit=crop" // รูปภาพเทียนจำลอง
          alt="Avatar"
          className="h-36 w-36 border border-black object-cover"
        />
      </div>

      {/* ส่วนที่ 2: พื้นที่ข้อมูลด้านขวา */}
      <div className="ml-6 flex w-full flex-col justify-center">
        
        {/* สถิติ 3 คอลัมน์ 2 แถว */}
        <div className="grid grid-cols-3 gap-y-3 text-[15px] text-white">
          <p>Joined: Aug 1, 2026</p>
          <p>Level: 69</p>
          <p>Status: <span className="text-[#4caf50]">Online</span></p>

          <p>Matches Played: 1158</p>
          <p>Rounds Won: 3790</p>
          <p>Win Rate: 49.25%</p>
        </div>

        {/* เส้นคั่นกลาง */}
        <hr className="my-4 border-gray-500" />

        {/* ลายเซ็นด้านล่าง */}
        <p className="text-[15px] text-white">
          Signature: แสงเทียนนี้จะส่องสว่างเมื่ออยู่ในใจเธอ &gt;w&lt;
        </p>

      </div>
    </div>
  );
}