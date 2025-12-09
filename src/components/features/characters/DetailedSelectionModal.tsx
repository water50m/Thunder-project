import React, { useState } from 'react';

interface Props<T> {
  title: string;
  pool: T[];
  equippedIds: string[];
  onEquip: (item: T) => void;
  onUnequip: (id: string) => void;
  onClose: () => void;
  renderIcon: (item: T) => React.ReactNode;
  getItemName: (item: T) => string;
  getItemDesc: (item: T) => string;
  getItemEffect: (item: T) => string;
  getItemLevel?: (item: T) => string;
}

export default function DetailedSelectionModal<T extends { id: string }>({ 
  title, pool, equippedIds, onEquip, onUnequip, onClose,
  renderIcon, getItemName, getItemDesc, getItemEffect, getItemLevel
}: Props<T>) {

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const equippedItems = equippedIds.map(id => pool.find(i => i.id === id)).filter(Boolean) as T[];

  return (
    // ✅ พื้นหลัง Modal สีดำโปร่ง
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn text-white font-sans select-none">
      
      {/* ✅ Container หลัก: สี Slate เข้ม */}
      <div className="w-full max-w-6xl h-[85vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header Bar สีดำ */}
        <div className="h-10 bg-black/60 flex justify-between items-center px-4 border-b border-slate-800">
            <span className="font-bold text-sm uppercase tracking-wider text-slate-300">{title}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors font-bold">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* ======= LEFT SIDE (Content) ======= */}
            <div className="flex-[2] flex flex-col border-r border-slate-700">
                
                {/* 1. TOP: EQUIPPED ROW */}
                {/* ✅ พื้นหลังสี Slate กลางๆ */}
                <div className="bg-slate-800/50 p-4 flex flex-col justify-center border-b border-slate-700">
                    <p className="text-xs font-bold text-slate-400 mb-3 uppercase">
                        Currently Equipped ({equippedItems.length}/5) - Click to remove
                    </p>
                    <div className="flex gap-3 overflow-x-auto py-2">
                        {equippedItems.map(item => (
                            <div key={item.id} onClick={() => onUnequip(item.id)}
                                // ✅ ช่องที่ใส่แล้ว: สีเข้ม, มีปุ่ม X สีแดงตอน Hover
                                className="w-16 h-16 bg-slate-700 border border-slate-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-900/50 hover:border-red-500 relative group shrink-0 shadow-sm transition-all"
                            >
                                <div className="text-3xl drop-shadow">{renderIcon(item)}</div>
                                <div className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</div>
                            </div>
                        ))}
                        {/* Empty Slots */}
                        {Array.from({length: Math.max(0, 5 - equippedItems.length)}).map((_, i) => (
                            <div key={i} className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-600 text-xs shrink-0">Empty</div>
                        ))}
                    </div>
                </div>

                {/* 2. BOTTOM: INVENTORY GRID */}
                {/* ✅ พื้นหลังสี Slate เข้ม */}
                <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
                    <h3 className="text-slate-400 font-bold mb-4 uppercase text-sm">Available Inventory</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {pool.map(item => {
                            const isEquipped = equippedIds.includes(item.id);
                            return (
                                <div key={item.id} 
                                    onClick={() => { setSelectedItem(item); }}
                                    onDoubleClick={() => onEquip(item)}
                                    // ✅ ช่องในคลัง: สีเข้ม, มี Effect ตอนเลือก
                                    className={`
                                        aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm relative
                                        ${selectedItem?.id === item.id ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50 scale-105 z-10' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
                                        ${isEquipped ? 'opacity-30 grayscale pointer-events-none' : ''}
                                    `}
                                >
                                    <div className="text-3xl drop-shadow">{renderIcon(item)}</div>
                                    {isEquipped && <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-300 bg-black/50 rounded-lg">EQUIPPED</div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ======= RIGHT SIDE: DETAILS ======= */}
            {/* ✅ ใช้ Gradient สี Slate เข้มไปหาดำ เพื่อให้ดูมีความลึก */}
            <div className="flex-1 bg-gradient-to-br from-slate-900 to-black p-8 flex flex-col items-center text-center relative shadow-inner border-l border-slate-800">
                {selectedItem ? (
                    <div className="animate-fadeIn flex flex-col h-full items-center">
                        {/* ชื่อ Item */}
                        <h2 className="text-2xl font-bold mb-6 text-white tracking-wider">{getItemName(selectedItem)}</h2>
                        
                        {/* Icon ใหญ่ */}
                        <div className="w-32 h-32 bg-slate-800/50 rounded-2xl flex items-center justify-center text-7xl mb-8 shadow-lg border border-slate-700 backdrop-blur-sm relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                            <span className="drop-shadow-2xl">{renderIcon(selectedItem)}</span>
                        </div>

                        {/* Effect & Description */}
                        <div className="w-full bg-slate-800/80 p-5 rounded-xl mb-auto border border-slate-700/50 text-left">
                            <div className="text-blue-400 text-xs uppercase font-bold mb-2">Effect / Bonus</div>
                            <div className="text-lg font-medium text-white mb-3">{getItemEffect(selectedItem)}</div>
                            <div className="text-sm text-slate-400 italic leading-relaxed">"{getItemDesc(selectedItem)}"</div>
                        </div>

                        {/* Rarity Badge */}
                        <div className="mt-6 mb-6 font-mono text-sm bg-slate-900/50 px-4 py-1 rounded-full border border-slate-700 text-slate-300 uppercase tracking-widest">
                            {getItemLevel ? getItemLevel(selectedItem) : 'Common'} Rarity
                        </div>

                        {/* Equip Button */}
                        {!equippedIds.includes(selectedItem.id) && (
                            <button onClick={() => onEquip(selectedItem)} 
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                                <span>Equip Item</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                        <span className="text-5xl">👈</span>
                        <span className="text-sm uppercase font-bold tracking-widest">Select an item to view details</span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}