// src/components/Card.tsx
import React from 'react';
import { Card as CardType } from '@/data/cards';

interface CardProps {
  data: CardType;
  isSelected?: boolean;
  onClick?: () => void;
  bonus?: number;       // ค่า Power ที่บวกเพิ่ม (ถ้ามี)
  disabled?: boolean;   // กดไม่ได้ (เช่น ไม่ใช่เทิร์นเรา)
  className?: string;
}

export default function Card({ data, isSelected, onClick, bonus = 0, disabled = false, className = "w-full h-full" }: CardProps) {
  
  // Logic เลือกไอคอนตามประเภท
  let typeIcon = '';
  let typeColor = '';
  
  switch (data.type) {
    case 'Attack': typeIcon = '🗡️'; typeColor = 'text-red-400'; break;
    case 'Defend': typeIcon = '🛡️'; typeColor = 'text-blue-400'; break;
    case 'Heal':   typeIcon = '+';  typeColor = 'text-green-400 font-bold text-2xl'; break; // ใช้ Text + สีเขียว
    default:       typeIcon = '✨'; typeColor = 'text-purple-400';
  }

  // คำนวณ Ultimate Charge ที่จะได้ (Default 10 ถ้าไม่ได้ระบุ)
  const ultGain = data.ultimateCharge || 10;

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-xl border-2 flex flex-col items-center p-2 text-center transition-all duration-200 select-none
        ${className}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-4'}
        ${isSelected 
            ? 'border-yellow-400 bg-slate-800 -translate-y-8 z-20 shadow-[0_0_20px_gold] scale-105' 
            : 'border-slate-600 bg-slate-800 shadow-lg'}
      `}
    >
      {/* Cost Bubble (มุมซ้ายบน) */}
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full border-2 border-slate-900 text-white font-bold flex items-center justify-center shadow-md z-10">
        {data.cost}
      </div>

      {/* Main Icon */}
      <div className="text-5xl mt-3 drop-shadow-md">{data.icon}</div>

      {/* Card Name */}
      <div className="font-bold text-white text-xs mt-2 line-clamp-1">{data.name}</div>
      
      {/* Value Row (ค่าพลัง + โบนัส) */}
      <div className="mt-1 text-xl font-mono font-bold text-white flex items-center justify-center gap-1 bg-slate-900/50 w-full rounded py-1">
          <span>{data.value}</span>
          <span className={typeColor}>{typeIcon}</span>
          {bonus > 0 && <span className="text-green-400 text-xs animate-pulse">+{bonus}</span>}
      </div>

      {/* Description */}
      <div className="text-[10px] text-gray-400 mt-2 leading-tight px-1 line-clamp-2">
        {data.description}
      </div>

      {/* 🔥 Ultimate Gain Indicator (มุมขวาล่าง) */}
      <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-yellow-900/80 px-1.5 py-0.5 rounded-full border border-yellow-600/50">
         <span className="text-[10px] text-yellow-400">⚡{ultGain}</span>
      </div>
    </div>
  );
}