'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { charactersData, Character } from '@/data/characters';

export default function ShopPage() {
  const [gold, setGold] = useState(1000); // เงินเริ่มต้น
  const [selectedCharId, setSelectedCharId] = useState<number>(1);
  const [localChars, setLocalChars] = useState<Character[]>(charactersData);

  // โหลดข้อมูลถ้ามี Save เก่า (ถ้าจะทำระบบเซฟจริงจังค่อยใช้)
  // ตอนนี้ใช้ Mock Data ไปก่อน

  const selectedChar = localChars.find(c => c.id === selectedCharId) || localChars[0];

  const buyUpgrade = (statType: 'HP' | 'ATK' | 'POWER', cost: number) => {
    if (gold < cost) {
        alert("เงินไม่พอ! (Not enough gold)");
        return;
    }

    setGold(prev => prev - cost);
    
    // อัปเดต Stat
    setLocalChars(prev => prev.map(c => {
        if (c.id === selectedCharId) {
            const newStats = { ...c.stats };
            if (statType === 'HP') newStats.hp += 20;
            if (statType === 'ATK') newStats.atk += 5;
            if (statType === 'POWER') newStats.power += 5;
            return { ...c, stats: newStats };
        }
        return c;
    }));

    // *สำคัญ* ตรงนี้ถ้าจะให้มีผลใน Battle จริง ต้องบันทึกลง LocalStorage หรือ Global State
    // แต่ตอนนี้ทำเป็น Mock UI ให้เห็นภาพก่อน
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans flex flex-col">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-yellow-500">🛒 TRADER SHOP</h1>
            <div className="bg-black/50 px-4 py-2 rounded-full border border-yellow-600 flex items-center gap-2">
                <span>💰</span>
                <span className="text-xl font-mono text-yellow-400">{gold} G</span>
            </div>
        </div>
        <Link href="/">
          <button className="px-6 py-2 border border-gray-500 rounded hover:bg-gray-700 transition">
            Exit Shop
          </button>
        </Link>
      </div>

      <div className="flex flex-1 gap-8">
        
        {/* Left: Character Selector */}
        <div className="w-1/3 bg-gray-800/50 rounded-xl p-4 border border-gray-700 overflow-y-auto">
            <h3 className="text-gray-400 mb-4 font-bold">SELECT HERO TO UPGRADE</h3>
            <div className="space-y-3">
                {localChars.map(char => (
                    <div 
                        key={char.id}
                        onClick={() => setSelectedCharId(char.id)}
                        className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all border-2
                            ${selectedCharId === char.id ? 'bg-gray-700 border-yellow-500' : 'bg-gray-800 border-transparent hover:bg-gray-700'}
                        `}
                    >
                        <div className="text-2xl">{char.avatar}</div>
                        <div>
                            <div className="font-bold">{char.name}</div>
                            <div className="text-xs text-gray-400">{char.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Upgrade Station */}
        <div className="flex-1 bg-gray-800 rounded-xl p-8 border border-gray-600 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 opacity-10 text-[200px] pointer-events-none grayscale">
                {selectedChar.avatar}
            </div>

            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-6xl">{selectedChar.avatar}</span> 
                {selectedChar.name}
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg">
                อัปเกรดความสามารถของฮีโร่ เพื่อเตรียมพร้อมสำหรับการต่อสู้ที่ยากขึ้น
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upgrade HP */}
                <div className="bg-gray-900 p-6 rounded-xl border border-green-900/50 hover:border-green-500 transition-colors group">
                    <div className="text-green-500 text-4xl mb-2">❤️</div>
                    <h3 className="text-xl font-bold">Vitality Boost</h3>
                    <p className="text-gray-400 text-sm mb-4">เพิ่ม Max HP +20</p>
                    <div className="text-2xl font-mono mb-4 text-green-400">
                        {selectedChar.stats.hp} <span className="text-sm text-gray-500">➜</span> {selectedChar.stats.hp + 20}
                    </div>
                    <button 
                        onClick={() => buyUpgrade('HP', 150)}
                        className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bold flex justify-center items-center gap-2"
                    >
                        <span>Upgrade</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs">💰 150</span>
                    </button>
                </div>

                {/* Upgrade ATK */}
                <div className="bg-gray-900 p-6 rounded-xl border border-red-900/50 hover:border-red-500 transition-colors group">
                    <div className="text-red-500 text-4xl mb-2">⚔️</div>
                    <h3 className="text-xl font-bold">Strength Training</h3>
                    <p className="text-gray-400 text-sm mb-4">เพิ่ม Attack +5</p>
                    <div className="text-2xl font-mono mb-4 text-red-400">
                        {selectedChar.stats.atk} <span className="text-sm text-gray-500">➜</span> {selectedChar.stats.atk + 5}
                    </div>
                    <button 
                        onClick={() => buyUpgrade('ATK', 250)}
                        className="w-full py-3 bg-red-700 hover:bg-red-600 rounded-lg font-bold flex justify-center items-center gap-2"
                    >
                        <span>Upgrade</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs">💰 250</span>
                    </button>
                </div>

                {/* Upgrade Power */}
                <div className="bg-gray-900 p-6 rounded-xl border border-purple-900/50 hover:border-purple-500 transition-colors group">
                    <div className="text-purple-500 text-4xl mb-2">✨</div>
                    <h3 className="text-xl font-bold">Magic Affinity</h3>
                    <p className="text-gray-400 text-sm mb-4">เพิ่ม Bonus Power +5</p>
                    <div className="text-2xl font-mono mb-4 text-purple-400">
                        {selectedChar.stats.power} <span className="text-sm text-gray-500">➜</span> {selectedChar.stats.power + 5}
                    </div>
                    <button 
                        onClick={() => buyUpgrade('POWER', 400)}
                        className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded-lg font-bold flex justify-center items-center gap-2"
                    >
                        <span>Upgrade</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs">💰 400</span>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}