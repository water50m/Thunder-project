'use client'; // ต้องใช้ client เพราะมีการกดปุ่ม (Interact)

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MainMenu() {
  const [isExiting, setIsExiting] = useState(false);

  // ฟังก์ชันสำหรับปุ่ม Exit
  const handleExit = () => {
    // บนเว็บเราปิด Tab โดยตรงไม่ได้ (Browser Security)
    // เรามักจะทำเป็น Popup ขอบคุณ หรือ Redirect ไป Google แทน
    const confirmExit = window.confirm("ต้องการออกจากเกมใช่ไหม?");
    if (confirmExit) {
      setIsExiting(true);
      // สมมติว่าปิดเกมโดยการเปลี่ยนหน้าไป google
      window.location.href = "https://www.google.com";
    }
  };

  if (isExiting) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">Closing Game...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white font-mono">
      {/* Title ของเกม */}
      <h1 className="mb-12 text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
        MY NEXT GAME
      </h1>

      {/* เมนูตัวเลือก */}
      <div className="flex flex-col gap-6 w-64">
        
        {/* 1. START GAME */}
        <Link href="/game">
          <button className="w-full py-4 text-xl font-bold bg-green-600 hover:bg-green-500 border-b-4 border-green-800 hover:border-green-700 rounded-lg transition-all active:border-b-0 active:translate-y-1">
            START
          </button>
        </Link>

        {/* 2. CHARACTERS */}
        <Link href="/characters">
          <button className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 hover:border-blue-700 rounded-lg transition-all active:border-b-0 active:translate-y-1">
            CHARACTERS
          </button>
        </Link>

        {/* 3. SHOPS */}
        <Link href="/shops">
          <button className="w-full py-3 text-lg font-semibold bg-yellow-600 hover:bg-yellow-500 border-b-4 border-yellow-800 hover:border-yellow-700 rounded-lg transition-all active:border-b-0 active:translate-y-1">
            SHOPS
          </button>
        </Link>

        {/* 4. EXIT */}
        <button 
          onClick={handleExit}
          className="w-full py-3 text-lg font-semibold bg-red-600 hover:bg-red-500 border-b-4 border-red-800 hover:border-red-700 rounded-lg transition-all active:border-b-0 active:translate-y-1"
        >
          EXIT
        </button>

      </div>
      
      <p className="mt-16 text-gray-500 text-sm">v1.0.0 by You</p>
    </main>
  );
}