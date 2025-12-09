import React, { useState, useEffect } from 'react';
import { EQUIPMENT_POOL, Equipment, EquipmentType } from '@/data/equipment';

interface Props {
  equippedGear: Record<EquipmentType, string | null>;
  initialSlot: EquipmentType;
  onEquip: (item: Equipment) => void;
  onUnequip: (slot: EquipmentType) => void;
  onClose: () => void;
}

export default function EquipmentModal({ 
  equippedGear, initialSlot, onEquip, onUnequip, onClose 
}: Props) {

  const [activeFilter, setActiveFilter] = useState<EquipmentType>(initialSlot);
  const [inspectItem, setInspectItem] = useState<Equipment | null>(null);

  // Filter ของตาม Tab ที่เลือก
  const filteredItems = EQUIPMENT_POOL.filter(item => item.type === activeFilter);
  const currentEquippedItem = EQUIPMENT_POOL.find(e => e.id === equippedGear[activeFilter]);

  // Reset Inspector เมื่อเปลี่ยน Tab
  useEffect(() => { setInspectItem(null); }, [activeFilter]);

  // ข้อมูล Tabs
  const slots: { id: EquipmentType, label: string }[] = [
    { id: 'Head', label: 'HEAD' },
    { id: 'Body', label: 'BODY' },
    { id: 'Arms', label: 'ARMS' },
    { id: 'Legs', label: 'LEGS' },
    { id: 'Accessory', label: 'ACC' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center  backdrop-blur-sm p-8 animate-fadeIn select-none font-sans text-white">
      
      {/* Container หลัก */}
      <div className="w-full max-w-6xl h-[80vh] bg-[#0f1218] border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden relative bg-gray-900">
        
        {/* ปุ่มปิด */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-600 hover:text-white font-bold text-xl transition-colors">✕</button>

        {/* ================= COL 1: LOADOUT TABS (ซ้ายสุด) ================= */}
        {/* 🔥 แก้ไข: แสดงไอเทมที่สวมใส่อยู่จริง แทนที่จะเป็นแค่ปุ่ม */}
        <div className="w-36 bg-[#131720] flex flex-col items-center py-6 gap-4 border-r border-gray-800 shrink-0">
            <div className="text-[10px] font-bold text-gray-500 mb-2 mt-2 uppercase tracking-wider">Loadout</div>
            
            {slots.map((slot) => {
                // หาของที่ใส่อยู่ใน Slot นี้
                const item = EQUIPMENT_POOL.find(e => e.id === equippedGear[slot.id]);
                const isActive = activeFilter === slot.id;

                return (
                    <div key={slot.id} 
                         onClick={() => setActiveFilter(slot.id)}
                         className={`
                            relative w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group border
                            ${isActive 
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110 z-10' 
                                : 'bg-[#1a1e29] border-gray-700 hover:border-gray-500 opacity-80 hover:opacity-100'}
                         `}
                    >
                        {/* Icon ของที่ใส่ (หรือตัวย่อถ้าว่าง) */}
                        <div className="text-2xl drop-shadow-md">
                            {item ? item.icon : <span className="text-gray-600 text-xs font-bold">{slot.label}</span>}
                        </div>

                        

                        {/* ปุ่มถอดของ (X) จะขึ้นเมื่อมีของใส่และเอาเมาส์ชี้ */}
                        {item && (
                          <div 
                                  onClick={(e) => { 
                                      e.stopPropagation(); 
                                      onUnequip(slot.id); 
                                    }}
                                    // ✅ แก้ตรงนี้: ลบ opacity-0 และ group-hover:opacity-100 ออก
                                    className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10 cursor-pointer"
                                    title="Unequip"
                          >✕</div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* ================= COL 2: INVENTORY (กลาง) ================= */}
        <div className="flex-[2] bg-[#0a0c10] flex flex-col border-r border-gray-800 min-w-0">
            
            {/* Header แสดงสถานะ */}
            <div className="h-20 border-b border-gray-800 flex items-center px-8 bg-[#131720]">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                        {/* ไอคอนใหญ่แสดงหมวดหมู่ */}
                        <span className="text-3xl opacity-50">
                            {currentEquippedItem ? currentEquippedItem.icon : (activeFilter === 'Head' ? '🪖' : activeFilter === 'Body' ? '👕' : activeFilter === 'Arms' ? '🥊' : activeFilter === 'Legs' ? '👢' : '💍')}
                        </span>
                        <span>{activeFilter} Storage</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {currentEquippedItem 
                            ? <span className="text-green-400">Equipped: {currentEquippedItem.name}</span> 
                            : "No item equipped in this slot"}
                    </p>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredItems.map(item => {
                        const isEquipped = equippedGear[activeFilter] === item.id;
                        const isSelected = inspectItem?.id === item.id;
                        return (
                            <div key={item.id} 
                                onClick={() => setInspectItem(item)}
                                onDoubleClick={() => onEquip(item)}
                                className={`
                                    aspect-square bg-[#1a1e29] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative group
                                    ${isSelected ? 'border-blue-500 bg-[#202530] shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-gray-800 hover:border-gray-500'}
                                    ${isEquipped ? 'opacity-40 grayscale' : ''}
                                `}
                            >
                                <div className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform">{item.icon}</div>
                                {isEquipped && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-black/80 text-green-400 text-[9px] font-bold px-2 py-1 rounded border border-green-500/50">EQUIPPED</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {filteredItems.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-700 border-2 border-dashed border-gray-800 rounded-xl">
                            <span className="text-4xl opacity-20 mb-2">📦</span>
                            <span className="text-sm font-bold">No items found</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* ================= COL 3: DETAILS (ขวาสุด) ================= */}
        <div className="flex-1 bg-[#131720] border-l border-gray-800 p-8 flex flex-col items-center text-center relative">
            
            {inspectItem ? (
                <div className="w-full flex flex-col items-center h-full animate-fadeIn">
                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-8 border-b border-blue-900/20 pb-2 w-full">Item Details</div>
                    
                    {/* Name & Icon */}
                    <h2 className="text-2xl font-bold text-white mb-4">{inspectItem.name}</h2>
                    <div className="w-40 h-40 bg-[#0a0c10] rounded-2xl flex items-center justify-center text-8xl mb-8 shadow-2xl border border-gray-700 ring-1 ring-white/5">
                        {inspectItem.icon}
                    </div>

                    {/* Stats Block */}
                    <div className="w-full bg-[#1a1e29] p-5 rounded-xl border border-gray-700 text-left space-y-4 mb-auto">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Type</div>
                            <div className="text-gray-300 font-bold">{inspectItem.type}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-green-500 uppercase font-bold mb-1">Bonus Stats</div>
                            <div className="text-green-400 font-mono text-xl font-bold">{inspectItem.stats}</div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={() => onEquip(inspectItem)}
                        disabled={equippedGear[activeFilter] === inspectItem.id}
                        className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider mt-4
                            ${equippedGear[activeFilter] === inspectItem.id
                                ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-blue-900/20'}
                        `}
                    >
                        {equippedGear[activeFilter] === inspectItem.id ? 'Equipped' : 'Equip Item'}
                    </button>
                </div>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-700 space-y-4">
                    <span className="text-6xl opacity-20 animate-pulse">🛡️</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Select an item to view stats</span>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}