import React from 'react';
import { Card as CardType } from '@/data/cards';
import { FloatingTextType, ActiveStatus, FloatingTextData } from '@/data/typesEffect';
import { BattleState, BattleUnit } from '@/types/battles'

// --- Types ---
export type EnemyRank = 'MINION' | 'ELITE' | 'BOSS';

interface Props {
  enemies: BattleUnit[];          // ✅ Input: รายชื่อศัตรูที่จะให้แสดง
  battleState: BattleState;
  shaking: boolean[];              // Animation สั่น
  floatingTexts: FloatingTextData[];          // ลอยตัวเลข
  enemyCardDisplay: CardType | null; // การ์ดที่ศัตรูกำลังใช้
  onFloatingTextComplete: (targetIdx: number, textId: string) => void;
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
  shaking, 
  floatingTexts, 
  enemyCardDisplay,
  onFloatingTextComplete 
}: Props) {

  return (
    <div className="flex items-end justify-center gap-2 md:gap-6 perspective-1000">
      
      {/* ✅ ต้องใช้ index มาช่วย map ตำแหน่ง Floating Text และ Shaking */}
      {enemies.map((enemy, index) => {
        
        // 1. ✅ เช็คตายจาก enemy โดยตรง
        if (enemy.isDead || enemy.currentHp <= 0) return null;

        // 2. ✅ ดึง Stats จาก enemy โดยตรง (เลิกใช้ battleState.xxx)
        const hp = enemy.currentHp;
        const shield = enemy.shield;
        const status = enemy.statuses;

        // 3. ✅ กรอง Floating Text (Logic ใหม่: Flat Array)
        // หาเฉพาะของศัตรูตัวนี้ (Side = ENEMY, Index = index)
        const myTexts = floatingTexts.filter(
            ft => ft.side === 'ENEMY' && ft.targetIndex === index
        );

        // 4. ✅ Shaking (ใช้ index เพราะ shaking มักจะเป็น array ตามลำดับ)
        const isShaking = shaking[index];

        // ฟังก์ชันเลือกสีตาม Rarity
        const getBorderColor = (rank: string = 'COMMON') => {
            switch (rank) {
                case 'LEGENDARY': return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'; // สีทอง + เรืองแสง
                case 'EPIC': return 'border-purple-500'; // สีม่วง
                case 'RARE': return 'border-blue-400';   // สีฟ้า
                default: return 'border-gray-400';       // สีเทา (Common)
            }
        };

        // ฟังก์ชันเลือกสีตาม Rank (Boss/Leader)
        const getRankStyle = (rank: string) => {
            if (rank === 'BOSS') return 'scale-125 z-10'; // บอสตัวใหญ่
            if (rank === 'LEADER') return 'ring-2 ring-yellow-200'; // หัวหน้าทีมมีวงแหวนเพิ่ม
            return '';
        }

        // --- Style Logic (คงเดิมของคุณไว้) ---
        let sizeClass = "w-24 h-24"; 
        let borderClass = "border-2 border-red-900 rounded-full";


        
        if (enemy.character.role === 'Boss') { // เช็ค rank ให้ชัวร์
            sizeClass = "w-56 h-56 md:w-64 md:h-64";
            borderClass = "border-4 border-red-700 rounded-full shadow-[0_0_60px_rgba(220,38,38,0.3)]";
        } else if (enemy.character.role=== 'Minion') {
            sizeClass = "w-32 h-32";
            borderClass = "border-2 border-purple-500 rounded-full "; 
        }

        return (
            <div key={enemy.id} className={`relative flex flex-col items-center `}>
                
                {/* 1. Stats Bar */}
                <div className={`mb-2 flex flex-col items-center w-full ${enemy.character.role === 'Boss' ? 'w-64' : 'w-24'}`}>
                    {enemy.character.role === 'Boss' && <div className="text-red-500 font-bold text-xl tracking-widest drop-shadow-md">BOSS</div>}
                    
                    {/* ✅ ส่ง status ที่ดึงมาใหม่ */}
                    <StatusList statuses={status} /> 
                    
                    {/* ✅ ส่ง hp/shield ที่ดึงมาใหม่ */}
                    <MiniHealthBar current={hp} max={enemy.maxHp} shield={shield} /> 
                </div>

                {/* 2. Character Sprite */}
                <div 
                    className={`
                        relative ${sizeClass} ${borderClass} ${getBorderColor(enemy.character.rank)} bg-gray-800 
                        flex items-center justify-center shadow-lg
                        transition-transform duration-100
                        ${isShaking ? 'translate-x-[-5px] bg-red-900/50' : 'bg-gradient-to-br from-red-950 to-black'}
                    `}
                >
                    <span className={`${enemy.character.role === 'Boss' ? 'text-8xl md:text-9xl' : 'text-5xl'} filter drop-shadow-md`}>
                        {/* หรือ enemy.character.avatar */}
                        {enemy.character.avatar || "👾"} 
                    </span>

                    {/* ✅ Floating Text (Loop จาก myTexts ที่กรองมาแล้ว) */}
                    {myTexts.map((ft) => (
                         <div key={ft.id} 
                              className={`absolute top-0 font-bold text-2xl animate-[floatUp_1s_ease-out_forwards] pointer-events-none whitespace-nowrap
                                ${ft.type === 'DMG' ? 'text-red-500 scale-125' : ft.type === 'HEAL' ? 'text-green-400' : 'text-blue-300'}
                              `}
                              // ✅ ส่ง index และ id กลับไปลบ
                              onAnimationEnd={() => onFloatingTextComplete(index, ft.id)}
                         >
                            {ft.text}
                         </div>
                    ))}
                    
                    {/* 3. Action Card (Boss Only) */}
                    {enemyCardDisplay && (enemy.character.role === 'Boss') && (
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