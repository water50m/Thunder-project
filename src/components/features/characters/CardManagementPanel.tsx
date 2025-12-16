import React from 'react';
import Card from '@/components/Card';
import { EXTRA_CARDS } from '@/data/cards';

interface Props {
  equippedIds: string[]; // เปลี่ยนเป็น string[] ธรรมดาก็พอครับ (ไม่มี null)
  draggedItem: any; 
  characterName: string;
  charId: number;
  onToggleCard: (cardId: string) => void; // Parent จะส่ง Auto-save logic มาให้
  onInspect: (item: any) => void;
  onDragStart: (e: React.DragEvent, item: any, type: string) => void;
  onDropCard: (e: React.DragEvent, slotIndex: number) => void;
}

export default function CardManagementPanel({
  equippedIds,
  draggedItem,
  charId,
  characterName,
  onToggleCard,
  onInspect,
  onDragStart,
  onDropCard
}: Props) {

  // Helper หาการ์ด
  const getCard = (id: string | null) => id ? EXTRA_CARDS.find(c => c.id === id) : null;

  // Logic การ Drop กลับเข้า Pool (ถอดออก)
  const handleDropToPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem?.dragType === 'CARD' && equippedIds.includes(draggedItem.id)) {
        onToggleCard(draggedItem.id);
    }
  };

  return (
    <div className="flex-1 bg-slate-800/50 border-r border-slate-700 p-6 overflow-y-auto">
        <h3 className="text-slate-300 font-bold mb-4 uppercase border-b border-slate-700 pb-2 text-sm">
            Skill Cards (Auto-Save Active)
        </h3>
        
        {/* --- 1. Equipped Slots (2 ช่อง) --- */}
        <div className="mb-6">
            <div className="text-xs text-slate-500 font-bold mb-2 uppercase">Equipped (2 Max)</div>
            <div className="flex gap-3">
                {[0, 1].map(i => {
                    const cardId = equippedIds[i] || null; // กันเหนียว
                    const card = getCard(cardId);

                    return (
                        <div key={i} 
                             onDragOver={(e) => e.preventDefault()} 
                             onDrop={(e) => onDropCard(e, i)}
                             draggable={!!card}
                             onDragStart={(e) => card && onDragStart(e, card, 'CARD')}
                             onClick={() => card && onToggleCard(card.id)} 
                             className={`
                                flex-1 aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all relative
                                ${card ? 'border-blue-500 border-solid bg-slate-900 shadow-md' : 'border-slate-600 bg-slate-900/50 hover:border-slate-400'}
                                ${draggedItem?.dragType === 'CARD' ? 'bg-green-900/10 border-green-500/50' : ''}
                             `}
                        >
                            {card ? (
                                <div className="pointer-events-none w-full h-full"><Card data={card}/></div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-600">
                                    <span className="text-2xl opacity-50 mb-1">🎴</span>
                                    <span className="text-[10px] uppercase font-bold">Slot {i+1}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>

        {/* --- 2. Card Pool --- */}
        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropToPool}>
            <div className="text-xs text-slate-500 font-bold mb-3 uppercase">
                Available Cards ({EXTRA_CARDS.length})
            </div>
            
            <div className="grid grid-cols-2 gap-3 pb-4">
                {EXTRA_CARDS.filter(c => !c.owner || c.owner === characterName).map(card => {
                    const isEquipped = equippedIds.includes(card.id);
                    return (
                        <div key={card.id} 
                             draggable={!isEquipped}
                             onDragStart={(e) => onDragStart(e, card, 'CARD')}
                             onClick={() => onToggleCard(card.id)}
                             onMouseEnter={() => onInspect(card)}
                             className={`
                                aspect-[3/4] rounded-lg border transition-all cursor-pointer relative overflow-hidden
                                ${isEquipped ? 'opacity-40 grayscale bg-slate-900 border-slate-800' : 'bg-slate-800 border-slate-600 hover:border-blue-400 hover:scale-105'}
                             `}
                        >
                            <div className="pointer-events-none w-full h-full"><Card data={card} /></div>
                            {isEquipped && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
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