import React from 'react';
import { ShakingState, ShakeType } from '@/hooks/battle/useBattleUI';

// กำหนด Type (เหมือนเดิม)
export interface UnitCardProps {
  index: number;
  name: string;
  role: 'Defender' | 'Attacker' | string;
  image?: string;
  position: 'FRONT' | 'BACK';
  currentHp: number;
  maxHp: number;
  shield: number;
  currentUlt: number;
  maxUlt: number;
  isDead: boolean;
  isSelected: boolean;
  shaking: ShakingState;
  statuses: any[]; 
  floatingTexts: any[];
  onSelect: (index: number) => void;
  onUltimate: () => void;
  onFloatingTextComplete: (id: string) => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  index,
  name,
  role,
  position,
  currentHp,
  maxHp,
  shield,
  currentUlt,
  maxUlt,
  isDead,
  isSelected,
  shaking,
  statuses,
  onSelect,
  onUltimate
}) => {
  
  const roleIcon = role === 'Defender' ? '🛡️' : '⚔️';

  // ⚠️ แก้จุดที่ 1: ต้องดึงจาก 'players' เพราะนี่คือ Unit ฝั่งเรา
  const shakeStatus = shaking.players[index] || 'NONE';

  // ⚠️ แก้จุดที่ 2: ปรับ Style ให้ Block ไม่สั่น
  const getShakeStyle = (status: ShakeType) => {
    switch (status) {
        case 'DAMAGE':
            // 🔴 แดง + สั่น (โดนดาเมจ)
            return 'animate-shake bg-red-900/80 border-red-500';
        case 'BLOCK':
            // 🔵 ฟ้า + ไม่สั่น (เปลี่ยนสีขอบให้รู้ว่ากันได้)
            return 'border-blue-400 bg-gray-800 shadow-[0_0_15px_rgba(59,130,246,0.5)]'; 
        default:
            // ⚫ ปกติ
            return 'bg-gray-800 border-gray-600';
    }
  };

  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 group ${isDead ? 'opacity-50 grayscale' : ''}`}>
      
      {/* --- ส่วนบน: Status & HP --- */}
      <div className="mb-2 flex flex-col items-center gap-1">
        {/* Status Icons */}
        <div className="flex justify-center gap-1 min-h-[20px]">
          {statuses && statuses.map((s, i) => (
            <div key={i} className="w-5 h-5 bg-gray-600 rounded-full text-xs flex items-center justify-center" title={s.name}>
               {s.icon || '?'} 
            </div>
          ))}
        </div>

        {/* HP Bar */}
        <div className="w-32">
          <div className="relative w-full h-4 bg-gray-900 rounded border border-gray-600 overflow-hidden">
             <div className="h-full bg-red-600 transition-all" style={{width: `${(currentHp/maxHp)*100}%`}}></div>
             {shield > 0 && <div className="absolute top-0 h-full bg-blue-400/50" style={{width: `${(shield/maxHp)*100}%`}}></div>}
             {/* Text HP */}
             <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md">
                {currentHp}/{maxHp}
             </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนกลาง: ตัวละคร (Sprite/Card) --- */}
      <div 
        onClick={() => !isDead && onSelect(index)}
        className={`
          relative w-32 h-44 md:w-40 md:h-56 rounded-xl border-4 cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center overflow-visible shadow-xl
          
          /* Logic การเลือก */
          ${isSelected ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)] scale-105 z-10' : 'hover:border-gray-400 hover:bg-gray-700'}
          
          /* ✅ Logic การสั่น/เปลี่ยนสี (เรียกใช้ function ที่แก้แล้ว) */
          ${getShakeStyle(shakeStatus)}
        `}
      >
        
        {/* ⚠️ แก้จุดที่ 3: เพิ่ม Shield Overlay (Layer บนสุด) */}
        {shakeStatus === 'BLOCK' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center animate-pulse pointer-events-none">
                <span className="text-9xl opacity-70 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                    🛡️
                </span>
            </div>
        )}

        {/* Background Role Icon (Layer ล่างสุด) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 text-9xl pointer-events-none">
          {roleIcon}
        </div>

        {/* Main Icon / Sprite */}
        <div className="z-10 text-6xl mb-2 drop-shadow-2xl transform transition-transform group-hover:scale-110">
          {roleIcon}
        </div>
        
        {/* Name Tag */}
        <div className="z-10 font-bold text-sm bg-black/60 px-3 py-0.5 rounded-full border border-gray-600 shadow-md text-white">
          {name}
        </div>
        
        {/* Position Badge */}
        <div className="absolute -bottom-3 text-[10px] font-bold bg-gray-700 px-2 rounded text-gray-400 border border-gray-500 uppercase z-20">
          {position}
        </div>

      </div>

      {/* --- ส่วนล่าง: Ultimate Bar --- */}
      <div 
        onClick={() => !isDead && currentUlt >= maxUlt && onUltimate()}
        className={`
            mt-3 w-full h-3 bg-gray-900 rounded-full border border-gray-600 relative overflow-hidden
            ${!isDead && currentUlt >= maxUlt ? 'cursor-pointer ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
        `}
      >
        <div 
            className={`h-full transition-all duration-500 ${currentUlt >= maxUlt ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 animate-pulse' : 'bg-blue-600'}`} 
            style={{ width: `${Math.min(100, (currentUlt / maxUlt) * 100)}%` }}
        />
      </div>

    </div>
  );
};

export default UnitCard;