// src/components/StatBar.tsx
import React from 'react';

interface StatBarProps {
  current: number;
  max: number;
  shield?: number;     // มีเกราะไหม? (Optional)
  type: 'HP' | 'ULT';  // เป็นหลอดประเภทไหน
}

export default function StatBar({ current, max, shield = 0, type }: StatBarProps) {
  const percent = Math.min(100, (current / max) * 100);
  
  if (type === 'HP') {
    // คำนวณ % ของเกราะเทียบกับ MaxHP
    const shieldPercent = Math.min(100, (shield / max) * 100);

    return (
      <div className="w-full h-4 bg-gray-700 mt-2 rounded-sm overflow-hidden flex border border-gray-600 relative">
        {/* Layer 1: เลือด (สีเขียว) */}
        <div 
          className="h-full bg-green-500 transition-all duration-300" 
          style={{ width: `${percent}%` }} 
        />
        {/* Layer 2: เกราะ (สีฟ้าต่อท้าย) */}
        {shield > 0 && (
          <div 
            className="h-full bg-blue-400 border-l border-blue-600 transition-all duration-300 relative" 
            style={{ width: `${shieldPercent}%` }}
          >
             {/* Effect เงาวิบวับให้รู้ว่าเป็นเกราะ */}
             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  // กรณีเป็น Ultimate Bar
  return (
    <div className="w-full h-2 bg-gray-800 mt-1 rounded-sm overflow-hidden border border-gray-600 relative">
       {/* พื้นหลังหลอด */}
       <div className="absolute inset-0 bg-yellow-900/30"></div>
       {/* เนื้อหลอดสีทอง */}
       <div 
         className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 transition-all duration-300 shadow-[0_0_10px_gold]" 
         style={{ width: `${percent}%` }} 
       />
    </div>
  );
}