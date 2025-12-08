'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { charactersData, Character } from '@/data/characters';

export default function CharacterSelection() {
  const router = useRouter();
  
  // LOGIC ใหม่: เปลี่ยนจากเก็บตัวเดียว เป็นเก็บ Array []
  const [selectedTeam, setSelectedTeam] = useState<Character[]>([]);

  const toggleCharacter = (char: Character) => {
    const index = selectedTeam.findIndex((c) => c.id === char.id);

    if (index !== -1) {
      // ถ้าเลือกไว้อยู่แล้ว -> เอาออก
      const newTeam = [...selectedTeam];
      newTeam.splice(index, 1);
      setSelectedTeam(newTeam);
    } else {
      // ถ้ายังไม่เลือก และยังไม่ครบ 2 ตัว -> ใส่เพิ่ม
      if (selectedTeam.length < 2) {
        setSelectedTeam([...selectedTeam, char]);
      }
    }
  };

  const handleStartGame = () => {
    localStorage.setItem('myTeam', JSON.stringify(selectedTeam));
    router.push('/battle');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      
      {/* Header เดิม */}
      <h1 className="text-4xl font-bold mb-2 text-yellow-400">SELECT YOUR TEAM</h1>
      <p className="text-gray-400 mb-10">
         เลือกตัวละคร 2 ตัว ({selectedTeam.length}/2)
      </p>

      {/* Grid เดิม UI เดิมเป๊ะ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 w-full max-w-6xl">
        {charactersData.map((char) => {
          // ตรวจสอบสถานะการเลือก
          const selectionIndex = selectedTeam.findIndex((c) => c.id === char.id);
          const isSelected = selectionIndex !== -1;
          
          return (
            <div
              key={char.id}
              onClick={() => toggleCharacter(char)}
              className={`
                relative cursor-pointer rounded-xl p-6 border-2 transition-all duration-300
                hover:scale-105 hover:bg-gray-800
                ${isSelected 
                  ? `bg-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105` // Style ตอนเลือก (เอามาจากอันเดิม)
                  : 'border-gray-700 bg-gray-900/50 opacity-80 hover:opacity-100'}
              `}
              style={{ borderColor: isSelected ? char.color : '' }} // ใช้สีตามตัวละครเหมือนเดิม
            >
              {/* ชื่อและ Role */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">{char.name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full border border-white/20 uppercase tracking-widest`}>
                  {char.role}
                </span>
              </div>

              {/* Status Display และหลอดพลัง (คงไวเหมือนเดิม) */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">HP</span>
                  <span className="font-mono text-green-400">{char.stats.hp}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${(char.stats.hp / 300) * 100}%` }}></div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">ATK</span>
                  <span className="font-mono text-red-400">{char.stats.atk}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full" style={{ width: `${(char.stats.atk / 100) * 100}%` }}></div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">DEF</span>
                  <span className="font-mono text-blue-400">{char.stats.def}</span>
                </div>
                 <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${(char.stats.def / 100) * 100}%` }}></div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">CRI</span>
                  <span className="font-mono text-yellow-400">{char.stats.cri}%</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-gray-500 text-center italic">
                "{char.description}"
              </p>

              {/* Indicator เดิม (ปรับเล็กน้อยให้โชว์เลขลำดับ 1 หรือ 2) */}
              {isSelected && (
                <div className="absolute top-2 right-2 font-bold text-xl animate-pulse" style={{ color: char.color }}>
                  #{selectionIndex + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/">
          <button className="px-6 py-3 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white transition">
            BACK TO MENU
          </button>
        </Link>
        
        <button
          onClick={handleStartGame}
          disabled={selectedTeam.length !== 2}
          className={`
            px-12 py-3 rounded-lg font-bold text-xl transition-all
            ${selectedTeam.length === 2
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg scale-105' 
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
          `}
        >
          CONFIRM TEAM
        </button>
      </div>
    </div>
  );
}