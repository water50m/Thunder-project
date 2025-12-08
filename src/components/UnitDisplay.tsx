// src/components/UnitDisplay.tsx
import React from 'react';
import StatBar from './StatBar';
import { ActiveStatus } from '@/data/typesEffect'; // Import type

interface UnitDisplayProps {
  name: string;
  avatar: string;
  color: string;
  hp: number;
  maxHp: number;
  shield?: number;
  ult?: number;
  maxUlt?: number;
  variant?: 'PLAYER' | 'BOSS' | 'MINION';
  isSelected?: boolean;
  onClick?: () => void;
  // 🔥 เพิ่ม prop รับ Status
  statuses?: ActiveStatus[];
}

export default function UnitDisplay({
  name, avatar, color,
  hp, maxHp, shield = 0,
  ult, maxUlt,
  variant = 'PLAYER',
  isSelected = false,
  onClick,
  statuses = [] // default ว่างเปล่า
}: UnitDisplayProps) {

  const isDead = hp <= 0;
  const isBoss = variant === 'BOSS';

  let containerSize = variant === 'BOSS' ? 'w-56' : variant === 'MINION' ? 'w-24' : 'w-36';
  let avatarSize = variant === 'BOSS' ? 'text-9xl' : variant === 'MINION' ? 'text-4xl' : 'text-6xl';

  return (
    <div 
      onClick={!isDead ? onClick : undefined}
      className={`${containerSize} relative transition-all duration-300 flex flex-col items-center
        ${isDead ? 'grayscale opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${isSelected ? 'scale-110 z-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}
        ${variant === 'MINION' && isDead ? 'opacity-0 scale-0' : ''}`}
    >
      {isSelected && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 font-bold animate-bounce">🔻</div>}

      {/* 🔥 STATUS EFFECT ICONS (ลอยอยู่บนหัว) */}
      <div className="absolute -top-8 w-full flex justify-center gap-1 z-30">
        {statuses.map((status) => (
           <div key={status.id} className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center shadow border border-white/20 animate-pulse">
              <span>{status.icon}</span>
              <span className="ml-1 font-bold text-yellow-300">{status.duration}</span>
           </div>
        ))}
      </div>

      {/* Character Box */}
      <div className={`w-full aspect-[3/4] rounded-lg flex flex-col items-center justify-center shadow-lg relative ${isSelected ? 'border-white' : `border-${color}-500`} bg-${color}-700 border-4`}>
         <span className={`${avatarSize} drop-shadow-md select-none`}>{avatar || "?"}</span>
         
         {!isBoss && variant !== 'MINION' && <div className="mt-2 text-white font-bold text-center leading-tight px-1 text-sm">{name}</div>}
         
         {!isBoss && (
           <div className="text-xs text-white/90 mt-1 bg-black/30 px-2 rounded backdrop-blur-sm">
              HP: {hp} {shield > 0 && <span className="text-blue-300">(+{shield})</span>}
           </div>
         )}
      </div>

      {!isBoss && <StatBar current={hp} max={maxHp} shield={shield} type="HP" />}

      {(ult !== undefined && maxUlt !== undefined && !isBoss) && (
        <div className="mt-1 relative w-full">
            <StatBar current={ult} max={maxUlt} type="ULT" />
            <div className="absolute right-0 top-0 text-[10px] text-yellow-500 font-bold leading-none -mt-3 drop-shadow-md">
                {Math.floor(ult)}/{maxUlt}
            </div>
        </div>
      )}
    </div>
  );
}