import React from 'react';
import Card from '@/components/Card';
import { AVAILABLE_CARDS, EXTRA_CARDS } from '@/data/cards';

// ✅ จุดที่ต้องเช็ค: Interface นี้ต้องมี draggedItem
interface Props {
  equippedIds: string[];
  draggedItem: any; // <--- ต้องมีบรรทัดนี้ครับ Error ถึงจะหาย!
  charId: number;
  onToggleCard: (id: string) => void;
  onInspect: (item: any) => void;
  onDragStart: (e: React.DragEvent, item: any, type: string) => void;
  onDropCard: (e: React.DragEvent) => void;
}

export default function CardManagementPanel({
  equippedIds,
  draggedItem, // <--- และต้องรับเข้ามาตรงนี้ด้วย
  charId,
  onToggleCard,
  onInspect,
  onDragStart,
  onDropCard
}: Props) {
  
  const handleDropToPool = (e: React.DragEvent) => {
    e.preventDefault();
    console.log("Dropped to pool area");
    console.log("Dragged Item:", draggedItem);
    // เช็คว่าสิ่งที่ลากมาคือการ์ด และมันถูกใส่อยู่ (อยู่ใน equippedIds)
    if (draggedItem?.dragType === 'CARD' && equippedIds.includes(draggedItem.id)) {
        console.log("Dropping card back to pool:", draggedItem.id);
        onToggleCard(draggedItem.id); // สั่งถอดการ์ด
    }
  };

  const getCard = (id: string) => EXTRA_CARDS.find(c => c.id === id);

  return (
    <div className="flex-1 bg-slate-800/50 border-r border-slate-700 p-6 overflow-y-auto">
        <h3 className="text-slate-300 font-bold mb-4 uppercase border-b border-slate-700 pb-2 text-sm">Skill Cards</h3>
        
        {/* 1. ส่วนบน: ช่องสวมใส่ */}
        <div className="mb-6">
            <div className="text-xs text-slate-500 font-bold mb-2 uppercase">Equipped (2 Max)</div>
            
            <div className="flex gap-3" 
                 onDragOver={(e) => e.preventDefault()} 
                 onDrop={onDropCard}
            >
                {[0, 1].map(i => {
                    const card = getCard(equippedIds[i]);
                    return (
                        <div key={i} 
                             draggable={!!card}
                             onDragStart={(e) => card && onDragStart(e, card, 'CARD')}
                             onClick={() => card && onToggleCard(card.id)} 
                             onMouseEnter={() => card && onInspect(card)}
                             className={`
                                flex-1 aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all relative group
                                ${card ? 'border-blue-500 border-solid shadow-md bg-slate-900' : 'border-slate-600 bg-slate-900/50 hover:border-slate-400'}
                                
                                {/* ใช้ draggedItem ตรงนี้เพื่อทำ Highlight */}
                                ${draggedItem?.dragType === 'CARD' ? 'bg-green-900/10 border-green-500/50' : ''}
                             `}
                        >
                            {card ? (
                                <div className="pointer-events-none w-full h-full">
                                    <Card data={card}/>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-600">
                                    <span className="text-2xl opacity-50 mb-1">🎴</span>
                                    <span className="text-[10px] uppercase font-bold">Slot {i+1}</span>
                                </div>
                            )}

                            {/* {card && (
                                <div className="absolute inset-0 bg-red-900/90 hidden group-hover:flex items-center justify-center text-xs font-bold text-white rounded-lg z-10">
                                    REMOVE
                                </div>
                            )} */}
                        </div>
                    )
                })}
            </div>
        </div>

        {/* 2. ส่วนล่าง: รายการการ์ด */}
        <div onDragOver={(e) => e.preventDefault()}
             onDrop={handleDropToPool}>
            <div className="text-xs text-slate-500 font-bold mb-3 uppercase flex justify-between items-center">
                <span>Card Pool ({EXTRA_CARDS.length})</span>
                <span className="text-[9px] bg-slate-700 px-2 py-0.5 rounded text-slate-400">Drag or Click</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pb-4">
                {EXTRA_CARDS.filter(card => !card.exclusiveTo || card.exclusiveTo === charId).map(card => {
                    const isEquipped = equippedIds.includes(card.id);
                    return (
                        <div key={card.id} 
                             draggable={!isEquipped}
                             onDragStart={(e) => onDragStart(e, card, 'CARD')}
                             onClick={() => onToggleCard(card.id)}
                             onMouseEnter={() => onInspect(card)}
                             className={`
                                aspect-[3/4] rounded-lg border transition-all cursor-pointer relative overflow-hidden group
                                ${isEquipped 
                                    ? 'opacity-40 grayscale bg-slate-900 border-slate-800' 
                                    : 'bg-slate-800 border-slate-600 hover:border-blue-400 hover:scale-105 hover:z-10 shadow-sm'}
                             `}
                        >
                            <div className="pointer-events-none w-full h-full">
                                <Card data={card} />
                            </div>

                            {isEquipped && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                    <span className="text-[10px] font-bold text-green-400 border border-green-500 px-2 py-1 rounded bg-black">EQUIPPED</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
}