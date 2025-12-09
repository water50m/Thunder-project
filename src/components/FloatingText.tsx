// src/components/FloatingText.tsx
import React, { useEffect, useState } from 'react';
import { FloatingTextData } from '@/data/typesEffect';

export default function FloatingText({ data, onComplete }: { data: FloatingTextData, onComplete: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // ตั้งเวลาให้ลบตัวเองทิ้งเมื่อ Animation จบ (0.8 วินาทีตาม CSS)
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete(data.id);
    }, 800);
    return () => clearTimeout(timer);
  }, [data.id, onComplete]);

  if (!visible) return null;

  // เลือกสีและไอคอนตามประเภท
  let colorClass = '';
  let prefix = '';
  switch (data.type) {
    case 'DMG':   colorClass = 'text-red-500'; prefix = '-'; break;
    case 'DOT':   colorClass = 'text-purple-400'; prefix = '-'; break;
    case 'HEAL':  colorClass = 'text-green-400'; prefix = '+'; break;
    case 'BLOCK': colorClass = 'text-blue-400'; prefix = '🛡️'; break;
    case 'BUFF':  colorClass = 'text-yellow-400'; prefix = '⬆️'; break;
    default:      colorClass = 'text-white';
  }

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 font-bold text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pointer-events-none animate-flyUp ${colorClass}`}
         style={{ top: '30%' }} // เริ่มต้นที่กลางตัว
    >
      {prefix}{data.text}
    </div>
  );
}