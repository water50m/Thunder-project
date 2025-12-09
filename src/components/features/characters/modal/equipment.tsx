'use client';

import React, { useState, useMemo } from 'react';
import { EQUIPMENT_POOL, EquipmentType, Equipment } from '@/data/equipment';
import { X, Search } from 'lucide-react'; // ตรวจสอบว่าลง lucide-react แล้ว หรือใช้ icon อื่นแทน

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map ตัวย่อ H, B, A, L, A ให้ตรงกับ Type
const SLOT_FILTERS: { label: string; type: EquipmentType }[] = [
  { label: 'H', type: 'Head' },
  { label: 'B', type: 'Body' },
  { label: 'A', type: 'Arms' },
  { label: 'L', type: 'Legs' },
  { label: 'A', type: 'Accessory' },
];

export default function EquipmentModal({ isOpen, onClose }: EquipmentModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<EquipmentType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Logic การ Filter:
  // 1. ถ้ามีการเลือก Filter (กดปุ่มซ้าย) จะแสดงเฉพาะ Type นั้น
  // 2. ถ้าไม่มีการเลือก (ค่าเป็น null) จะแสดงทั้งหมด (All)
  const filteredItems = useMemo(() => {
    let items = EQUIPMENT_POOL;

    if (selectedFilter) {
      items = items.filter((item) => item.type === selectedFilter);
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [selectedFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Main Container - ใช้สีพื้นหลังโทนน้ำเงินเข้มจัด (Blaze Theme) */}
      <div className="flex h-[85vh] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-700 bg-[#0B1120] shadow-2xl shadow-blue-900/20">
        
        {/* --- LEFT SIDE: Filter Slots (Red Buttons Area) --- */}
        <div className="flex w-24 flex-col gap-3 border-r border-slate-700 bg-[#151F32] p-4 py-8 items-center">
          {SLOT_FILTERS.map((slot, index) => {
            const isActive = selectedFilter === slot.type;
            return (
              <button
                key={`${slot.type}-${index}`}
                onClick={() => setSelectedFilter(isActive ? null : slot.type)} // กดซ้ำเพื่อยกเลิก Filter
                className={`
                  flex h-14 w-14 items-center justify-center rounded-lg border-2 font-bold text-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-105' // Active State
                    : 'bg-[#1E293B] border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-white' // Inactive State
                  }
                `}
              >
                {slot.label}
              </button>
            );
          })}
          
          {/* ปุ่ม Reset Filter (Optional) */}
          <button 
             onClick={() => setSelectedFilter(null)}
             className="mt-auto text-xs text-slate-500 hover:text-white underline"
          >
            Show All
          </button>
        </div>

        {/* --- RIGHT SIDE: Content Area (Green Area in diagram) --- */}
        <div className="flex flex-1 flex-col bg-[#0B1120]">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-700 bg-[#151F32] px-6 py-4">
            <div>
              <h2 className="text-xl font-bold tracking-wider text-white uppercase">
                {selectedFilter ? `${selectedFilter} List` : 'All Equipment'}
              </h2>
              <p className="text-xs text-slate-400">Select an item to equip</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search Box */}
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    className="h-9 rounded-md bg-[#0B1120] pl-9 pr-4 text-sm text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>

              {/* Close Button (Red Square) */}
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
             {filteredItems.length === 0 ? (
               <div className="flex h-full items-center justify-center text-slate-500">
                 No items found.
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                 {filteredItems.map((item) => (
                   <ItemCard key={item.id} item={item} />
                 ))}
               </div>
             )}
          </div>

          {/* Footer Stats (Optional - to match game UI feel) */}
          <div className="border-t border-slate-700 bg-[#0F1623] px-6 py-2 text-xs text-slate-500 text-right">
            Total Items: {filteredItems.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component: การ์ดแสดงไอเทม
function ItemCard({ item }: { item: Equipment }) {
  // ฟังก์ชันกำหนดสีขอบตามความหายาก (Optional styling)
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500/50 shadow-yellow-900/20';
      case 'epic': return 'border-purple-500/50 shadow-purple-900/20';
      case 'rare': return 'border-blue-500/50 shadow-blue-900/20';
      default: return 'border-slate-700 hover:border-slate-500';
    }
  };

  return (
    <div className={`
      group relative flex cursor-pointer flex-col rounded-lg border bg-[#1A2333] p-3 transition-all hover:-translate-y-1 hover:shadow-lg
      ${getRarityColor(item.rarity)}
    `}>
      {/* Icon Placeholder */}
      <div className="mb-3 flex aspect-square items-center justify-center rounded bg-[#0B1120] border border-slate-700/50">
        {/* ใส่ <img> ที่นี่แทน text */}
        <span className="text-2xl opacity-50">⚔️</span> 
      </div>

      <div className="mb-1">
        <h3 className="truncate text-sm font-bold text-slate-200 group-hover:text-white">
          {item.name}
        </h3>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">
          {item.type}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between rounded bg-[#0B1120]/50 px-2 py-1">
        <span className="text-xs font-medium text-green-400">{item.stats}</span>
      </div>
    </div>
  );
}