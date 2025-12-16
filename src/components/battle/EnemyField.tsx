import React from 'react';
import { Card as CardType } from '@/data/cards';
import { FloatingTextType, ActiveStatus } from '@/data/typesEffect';

// --- Types ---
export type EnemyRank = 'MINION' | 'ELITE' | 'BOSS';

export interface EnemyConfig {
  id: number;          // Index ใน battleState (เช่น 2=Boss, 3=Minion)
  name: string;
  avatar: string;
  maxHp: number;
  rank: EnemyRank;     // เอาไว้กำหนดขนาด Z-Index
}

interface Props {
  enemies: EnemyConfig[];          // ✅ Input: รายชื่อศัตรูที่จะให้แสดง
  battleState: {                   // State จาก useBattle
    hp: number[];
    shield: number[];
    statuses: ActiveStatus[][];
  };
  shaking: boolean[];              // Animation สั่น
  floatingTexts: any[][];          // ลอยตัวเลข
  enemyCardDisplay: CardType | null; // การ์ดที่ศัตรูกำลังใช้
  onFloatingTextComplete: (charIdx: number, textId: string) => void;
}

// --- Sub-Component: Health Bar (แยกออกมาให้ clean) ---
const MiniHealthBar = ({ current, max, shield }: { current: number, max: number, shield: number }) => {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="relative w-full h-3 bg-gray-950 rounded-full border border-gray-700 overflow-visible mt-1">
        <div className="absolute inset-0 bg-red-900/40 rounded-full"></div>
        <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 rounded-l-full relative" 
            style={{ width: `${percent}%` }}
        />
        {shield > 0 && (
             <div className="absolute -top-3 -right-2 bg-blue-600 text-[9px] font-bold px-1.5 rounded-full border border-blue-400 z-10">
                 🛡 {shield}
             </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">
            {current}/{max}
        </div>
    </div>
  );
};

// --- Sub-Component: Status Icons ---
const StatusList = ({ statuses }: { statuses: ActiveStatus[] }) => (
    <div className="flex justify-center gap-0.5 min-h-[16px] mb-1 flex-wrap max-w-[120px]">
        {statuses && statuses.map((s, i) => (
            <div key={`${s.id}-${i}`} className="w-4 h-4 bg-black/80 rounded-full border border-gray-600 flex items-center justify-center text-[9px]" title={`${s.type} (${s.value})`}>
                {s.icon}
            </div>
        ))}
    </div>
);

// --- Main Component ---
export default function EnemyField({ 
  enemies, 
  battleState, 
  shaking, 
  floatingTexts, 
  enemyCardDisplay,
  onFloatingTextComplete 
}: Props) {

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 perspective-1000">
      {/* วนลูปสร้างศัตรูตาม Config ที่ส่งเข้ามา */}
      {enemies.map((enemy) => {
        const hp = battleState.hp[enemy.id];
        
        // ถ้าเลือดหมด ไม่ต้อง render (ตายแล้วหายไป)
        // หรือถ้า hp เป็น undefined แปลว่าไม่มีตัวนี้ในระบบ
        if (hp === undefined || hp <= 0) return null;

        const shield = battleState.shield[enemy.id];
        const isShaking = shaking[enemy.id];
        const texts = floatingTexts[enemy.id];
        const status = battleState.statuses[enemy.id];

        // กำหนด Style ตาม Rank (Boss ตัวใหญ่, Minion ตัวเล็ก)
        let sizeClass = "w-24 h-24"; // Minion
        let zIndex = "z-20";         // Minion อยู่หน้า
        let borderClass = "border-2 border-red-900 rounded-full";
        
        if (enemy.rank === 'BOSS') {
            sizeClass = "w-56 h-56 md:w-64 md:h-64";
            zIndex = "z-10"; // Boss อยู่หลัง
            borderClass = "border-4 border-red-700 rounded-full shadow-[0_0_60px_rgba(220,38,38,0.3)]";
        } else if (enemy.rank === 'ELITE') {
            sizeClass = "w-32 h-32";
            zIndex = "z-15";
            borderClass = "border-2 border-purple-500 rounded-xl rotate-45"; // สี่เหลี่ยมข้าวหลามตัด
        }

        return (
            <div key={enemy.id} className={`relative flex flex-col items-center ${zIndex}`}>
                
                {/* 1. Stats Bar (HP & Status) */}
                <div className={`mb-2 flex flex-col items-center w-full ${enemy.rank === 'BOSS' ? 'w-64' : 'w-24'}`}>
                    {enemy.rank === 'BOSS' && <div className="text-red-500 font-bold text-xl tracking-widest drop-shadow-md">BOSS</div>}
                    <StatusList statuses={status} />
                    <MiniHealthBar current={hp} max={enemy.maxHp} shield={shield} />
                </div>

                {/* 2. Character Sprite / Avatar */}
                <div 
                    className={`
                        relative ${sizeClass} ${borderClass} bg-gray-800 
                        flex items-center justify-center shadow-lg
                        transition-transform duration-100
                        ${isShaking ? 'translate-x-[-5px] bg-red-900/50' : 'bg-gradient-to-br from-red-950 to-black'}
                    `}
                >
                    <span className={`${enemy.rank === 'BOSS' ? 'text-8xl md:text-9xl' : 'text-5xl'} filter drop-shadow-md`}>
                        {enemy.avatar}
                    </span>

                    {/* Floating Text */}
                    {texts.map((ft: any) => ( // Inline Floating Text Logic เล็กๆ
                         <div key={ft.id} 
                              className={`absolute top-0 font-bold text-2xl animate-[floatUp_1s_ease-out_forwards] pointer-events-none whitespace-nowrap
                                ${ft.type === 'DMG' ? 'text-red-500 scale-125' : ft.type === 'HEAL' ? 'text-green-400' : 'text-blue-300'}
                              `}
                              onAnimationEnd={() => onFloatingTextComplete(enemy.id, ft.id)}
                         >
                            {ft.text}
                         </div>
                    ))}
                    
                    {/* 3. Enemy Action Card (แสดงเฉพาะที่ Boss หรือตัวที่กำหนด) */}
                    {/* Logic: ถ้ามี enemyCardDisplay และตัวนี้เป็น Boss ให้โชว์ (หรือจะปรับให้โชว์ตาม id ก็ได้) */}
                    {enemyCardDisplay && enemy.rank === 'BOSS' && (
                        <div className="absolute -left-48 top-0 z-50 bg-red-950/90 border-2 border-red-500 p-3 rounded-xl w-40 text-center animate-bounce">
                             <div className="text-3xl mb-1">{enemyCardDisplay.icon}</div>
                             <div className="font-bold text-red-200 text-sm">{enemyCardDisplay.name}</div>
                        </div>
                    )}
                </div>
            </div>
        );
      })}
    </div>
  );
}