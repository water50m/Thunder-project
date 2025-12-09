'use client';

import Link from 'next/link';
import UnitDisplay from '@/components/UnitDisplay';
import CharacterModal from '@/components/features/characters/CharacterModal';
import { useCharacterManager } from '@/hooks/useCharacterManager';

export default function CharactersPage() {
  // ✅ เรียกใช้ Logic จาก Hook

  const { 
    gold, myChars, activeChar, 
    setSelectedCharId, handleUpgrade, toggleEquipCard,
    toggleEquipItem, equipGear, equipSignature, unequipGear // <--- ดึงมาเพิ่ม
  } = useCharacterManager();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">HERO MANAGEMENT</h1>
        <div className="flex items-center gap-4">
            <div className="bg-black/50 px-4 py-2 rounded-full border border-yellow-600 text-yellow-400 text-xl font-mono">💰 {gold} G</div>
            <Link href="/"><button className="px-6 py-2 border border-gray-500 rounded hover:bg-gray-800 transition">Back</button></Link>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {myChars.map((char) => (
          <div key={char.id} onClick={() => setSelectedCharId(char.id)} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className={`absolute inset-0 bg-${char.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex justify-center mb-4">
                <div className="scale-75 origin-center"><UnitDisplay name={char.name} avatar={char.avatar} color={char.color} hp={char.stats.hp} maxHp={char.stats.hp} ult={0} maxUlt={char.stats.maxUltimate} /></div>
            </div>
            <div className="text-center relative z-10">
                <h3 className="text-xl font-bold">{char.name}</h3>
                <p className="text-xs text-gray-400 uppercase">{char.role}</p>
                <div className="mt-2 text-xs bg-black/40 rounded py-1">Cards: {char.equippedCards.length}/2</div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Modal (เรียกใช้ Component เดียวจบ) */}
      {activeChar && (
        <CharacterModal 
            char={activeChar} 
            onClose={() => setSelectedCharId(null)}
            onUpgrade={handleUpgrade}
            onToggleCard={toggleEquipCard}
            // 👇 ส่ง props ใหม่ไป
            onToggleItem={toggleEquipItem}
            onEquipGear={equipGear}
            onEquipSig={equipSignature}
            onUnequipGear={unequipGear}
        />
    )}

    </div>
  );
}