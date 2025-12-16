import React from 'react';
// import { HealthBar } from './HealthBar'; // <-- อย่าลืม Import Component ย่อยของคุณ
// import { StatusIcon } from './StatusIcon';
// import { FloatingTextOverlay } from './FloatingTextOverlay';

// กำหนด Type ของข้อมูลที่จำเป็น (ปรับตาม Interface จริงของคุณ)
export interface UnitCardProps {
  // ข้อมูลพื้นฐาน
  index: number;
  name: string;
  role: 'Defender' | 'Attacker' | string;
  image?: string; // ถ้ามีรูปภาพ
  position: 'FRONT' | 'BACK';

  // Stats & Status
  hp: number;
  maxHp: number;
  shield: number;
  ult: number;
  maxUlt: number;
  isDead: boolean;
  
  // Visual States
  isSelected: boolean;
  isShaking: boolean;
  
  // Data Arrays (ปรับ Type ตามที่คุณใช้อยู่จริง)
  statuses: any[]; 
  floatingTexts: any[];

  // Event Handlers (Functions)
  onSelect: (index: number) => void;
  onUltimate: () => void;
  onFloatingTextComplete: (id: number) => void;
  
  // Optional: ถ้าต้องการส่ง event แสดง text จากใน card
  onShowFloatingText?: (index: number, text: string, type: any) => void; 
}

export const UnitCard: React.FC<UnitCardProps> = ({
  index,
  name,
  role,
  position,
  hp,
  maxHp,
  shield,
  ult,
  maxUlt,
  isDead,
  isSelected,
  isShaking,
  statuses,
  floatingTexts,
  onSelect,
  onUltimate,
  onFloatingTextComplete
}) => {
  
  // Icon ตาม Role
  const roleIcon = role === 'Defender' ? '🛡️' : '⚔️';

  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 group ${isDead ? 'opacity-50 grayscale' : ''}`}>
      
      {/* --- ส่วนบน: Status Icons & HP Bar --- */}
      <div className="mb-2 flex flex-col items-center gap-1">
        {/* Status Icons */}
        <div className="flex justify-center gap-1 min-h-[20px]">
          {statuses && statuses.map((s, i) => (
            // <StatusIcon key={`${s.id}-${i}`} status={s} />
            <div key={i} className="w-5 h-5 bg-gray-600 rounded-full text-xs flex items-center justify-center" title={s.name}>
               {/* Placeholder Icon ถ้ายังไม่ได้ import StatusIcon */}
               {s.icon || '?'} 
            </div>
          ))}
        </div>

        {/* HP Bar */}
        <div className="w-32">
          {/* <HealthBar current={hp} max={maxHp} shield={shield} /> */}
          {/* Placeholder HealthBar ในกรณีที่ยังไม่ได้ import */}
          <div className="relative w-full h-4 bg-gray-900 rounded border border-gray-600 overflow-hidden">
             <div className="h-full bg-red-600 transition-all" style={{width: `${(hp/maxHp)*100}%`}}></div>
             {shield > 0 && <div className="absolute top-0 h-full bg-blue-400/50" style={{width: `${(shield/maxHp)*100}%`}}></div>}
          </div>
        </div>
      </div>

      {/* --- ส่วนกลาง: ตัวละคร (Sprite/Card) --- */}
      <div 
        onClick={() => !isDead && onSelect(index)}
        className={`
          relative w-32 h-44 md:w-40 md:h-56 rounded-xl border-4 cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center bg-gray-800 overflow-visible shadow-xl
          ${isSelected ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)] scale-105 z-10' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700'}
          ${isShaking ? 'translate-x-[-10px] bg-red-900/50' : ''} 
        `}
      >
        {/* Background Role Icon (จางๆ) */}
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
        
        {/* Position Badge (Front/Back) */}
        <div className="absolute -bottom-3 text-[10px] font-bold bg-gray-700 px-2 rounded text-gray-400 border border-gray-500 uppercase">
          {position}
        </div>

        {/* Floating Texts Overlay */}
        {/* ตรวจสอบว่ามี Component นี้อยู่จริง หรือใช้ Placeholder */}
        {/* <FloatingTextOverlay 
            texts={floatingTexts} 
            onComplete={(id) => onFloatingTextComplete(id)} 
        /> */}
      </div>

      {/* --- ส่วนล่าง: Ultimate Bar --- */}
      <div 
        onClick={() => !isDead && ult >= maxUlt && onUltimate()}
        className={`
            mt-3 w-full h-3 bg-gray-900 rounded-full border border-gray-600 relative overflow-hidden
            ${!isDead && ult >= maxUlt ? 'cursor-pointer ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
        `}
      >
        <div 
            className={`h-full transition-all duration-500 ${ult >= maxUlt ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 animate-pulse' : 'bg-blue-600'}`} 
            style={{ width: `${Math.min(100, (ult / maxUlt) * 100)}%` }}
        />
      </div>

    </div>
  );
};

export default UnitCard;