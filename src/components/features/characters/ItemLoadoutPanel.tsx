import React from 'react';
import { ITEM_POOL } from '@/data/items';

interface Props {
  equippedIds: string[];
  onToggle: (id: string) => void;
}

export default function ItemLoadoutPanel({ equippedIds, onToggle }: Props) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-bold text-green-400 mb-2">🎒 ITEMS POUCH ({equippedIds.length}/5)</h3>
      
      {/* ส่วนแสดงไอเทมที่เลือก */}
      <div className="flex gap-2 mb-4 bg-black/30 p-2 rounded-lg min-h-[60px]">
        {equippedIds.map(id => {
            const item = ITEM_POOL.find(i => i.id === id);
            return item ? (
                <div key={id} onClick={() => onToggle(id)} className="w-10 h-10 bg-gray-700 rounded border border-green-500 flex items-center justify-center cursor-pointer hover:bg-red-900" title="Click to remove">
                    {item.icon}
                </div>
            ) : null;
        })}
        {/* ช่องว่าง */}
        {Array.from({ length: 5 - equippedIds.length }).map((_, i) => (
            <div key={i} className="w-10 h-10 border-2 border-dashed border-gray-600 rounded"></div>
        ))}
      </div>

      {/* รายการไอเทมทั้งหมด (Scrollable) */}
      <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2 pr-2">
         {ITEM_POOL.map(item => {
             const isEquipped = equippedIds.includes(item.id);
             return (
                 <div key={item.id} onClick={() => onToggle(item.id)} 
                      className={`aspect-square rounded flex flex-col items-center justify-center cursor-pointer text-xs border transition-all
                      ${isEquipped ? 'bg-green-900/50 border-green-500 opacity-50' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}
                 `}>
                     <div className="text-xl">{item.icon}</div>
                     <div className="scale-75 truncate w-full text-center">{item.id}</div>
                 </div>
             )
         })}
      </div>
    </div>
  );
}