import React from 'react';
import { AVAILABLE_CARDS } from '@/data/cards'; 

interface Props {
    deckList: string[];
    equippedIds: (string | null)[]; // ✅ เพิ่ม: ID การ์ดที่ถูกสวมใส่ของตัวละครที่ถูกเลือก    deckList: string[]; // ID การ์ดทั้งหมดใน Deck
    onAddToDeck: (cardId: string) => void;
    onRemoveFromDeck: (cardId: string) => void;
    onClose?: () => void; // ปุ่มปิด (เผื่อใช้ใน Modal/Route)
}

export default function DeckManagementPanel({ deckList, equippedIds, onAddToDeck, onRemoveFromDeck, onClose }: Props) {
    
    // 1. นับจำนวนการ์ดแต่ละใบใน Deck (Logic เดิม)
    const cardCounts = deckList.reduce((counts, id) => {
        counts[id] = (counts[id] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);

    // 2. Pool ที่แสดง: ใน Global Deck เราแสดงการ์ดทั้งหมดที่มี
    const filteredPool = AVAILABLE_CARDS; 
    const MAX_DECK_SIZE = 30;

    // Helper: คำนวณค่าเฉลี่ย Cost (Logic เดิม)
    const totalCost = deckList.reduce((sum, id) => {
        const card = AVAILABLE_CARDS.find(c => c.id === id);
        return sum + (card?.cost || 0);
    }, 0);
    const avgCost = deckList.length > 0 ? (totalCost / deckList.length).toFixed(1) : '0.0';

    // 3. ✅ จัดเรียงการ์ด: ถ้าสวมใส่อยู่ ให้ขึ้นมาบนสุด
    const sortedPool = [...filteredPool].sort((a, b) => {
        const aIsEquipped = equippedIds.includes(a.id);
        const bIsEquipped = equippedIds.includes(b.id);

        if (aIsEquipped && !bIsEquipped) {
            return -1; // A (Equipped) ขึ้นก่อน B
        }
        if (!aIsEquipped && bIsEquipped) {
            return 1;  // B (Equipped) ขึ้นก่อน A
        }
        return 0;      // ไม่มีการเปลี่ยนแปลงลำดับ
    });
    return (
        <div className="flex flex-col h-full bg-slate-800/50 p-6 text-white">
            
            {/* --- Header --- */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                <h3 className="text-2xl font-bold text-slate-200">
                    📚 Global Deck Builder 
                </h3>
                {onClose && (
                    <button 
                        onClick={onClose} 
                        className="px-4 py-1.5 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>
            
            
            {/* --- Main Content: สลับตำแหน่ง --- */}
            <div className="flex-1 overflow-hidden flex gap-6">
                
                {/* ⬅️ NEW LEFT: Deck Summary & Stats (ใช้ flex-1) ⬅️ */}
                <div className="flex-1 w-1/3 flex flex-col bg-slate-700/50 p-4 rounded-xl shadow-inner">
                    <h4 className="text-base font-semibold text-slate-300 mb-3">Deck Summary</h4>
                    
                    <div className="border-b border-slate-600 pb-2 mb-3">
                        <p className="text-lg font-bold text-blue-400">Total Cards: {deckList.length} / {MAX_DECK_SIZE}</p>
                        <p className={`text-sm font-semibold ${deckList.length === MAX_DECK_SIZE ? 'text-green-400' : 'text-red-400'}`}>
                            {deckList.length < MAX_DECK_SIZE ? `Need ${MAX_DECK_SIZE - deckList.length} more cards` : 'Deck Complete'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">Avg. Cost: {avgCost}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {/* แสดงการ์ดใน Deck เป็น list (จากโค้ดเดิมที่ทำงานได้) */}
                        {Object.keys(cardCounts)
                            .sort()
                            .map(id => {
                                const card = AVAILABLE_CARDS.find(c => c.id === id);
                                if (!card) return null;
                                const count = cardCounts[id];
                                return (
                                    <div key={id} className="flex justify-between text-sm text-white bg-slate-700 p-2 rounded">
                                        <span className={`truncate ${card.exclusiveTo ? 'text-yellow-300' : ''}`}>
                                            {card.icon && <span className="mr-1">{card.icon}</span>}
                                            ({card.cost}) {card.name}
                                        </span>
                                        <span className="font-bold text-green-300">x{count}</span>
                                    </div>
                                );
                            })}
                    </div>


                </div>

                {/* ➡️ NEW RIGHT: Available Card Pool (ใช้ flex-[2] และ Card Grid Look) ➡️ */}
                <div className="flex-[2] flex flex-col min-h-0 border-l border-slate-700 pl-6">
                    <h4 className="text-base font-semibold text-slate-400 mb-3">
                        Card Pool ({filteredPool.length} Unique Cards)
                    </h4>
                    
                    
                    {/* 👇 Card Grid Look 👇 */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4"> 
                            {sortedPool.map(card => {
                                const countInDeck = cardCounts[card.id] || 0;
                                const isExclusive = !!card.exclusiveTo;
                                
                                return (
                                    
                                    <div key={card.id} 
                                        className="aspect-[3/4] rounded-xl shadow-lg border-2 p-2 relative flex flex-col justify-between transition-transform transform hover:scale-[1.03]"
                                        style={{ 
                                            backgroundColor: isExclusive ? '#164E63' : '#1e293b', 
                                            borderColor: isExclusive ? '#FBBF24' : '#64748b' 
                                        }}
                                    >
                                        
                                        {/* Cost (มุมซ้ายบน) */}
                                        <div className="absolute top-1 left-1 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold border border-white/50">
                                            {card.cost}
                                        </div>

                                        {/* ICON (กึ่งกลางด้านบน) */}
                                        <div className="absolute top-4 left-0 right-0 w-fit mx-auto flex items-center justify-center w-12 h-12 rounded-lg bg-black/50">
                                            <span className="text-3xl leading-none" role="img" aria-label="Card Icon">
                                                {card.icon}
                                            </span> 
                                        </div>

                                        {/* Name & Type (ส่วนกลาง - เลื่อนลงมาด้านล่าง) */}
                                        <div className="mt-auto pt-16 text-center">
                                            <p className={`font-extrabold text-sm truncate ${isExclusive ? 'text-yellow-300' : 'text-white'}`}>
                                                {card.name}
                                            </p>
                                            <p className="text-xs text-slate-400 uppercase">{card.type}</p>
                                        </div>
                                        
                                        {/* Action Buttons (ด้านล่าง) */}
                                        <div className="flex justify-center items-center mt-2">
                                            <div className="flex items-center gap-1">
                                                
                                                {/* ปุ่ม Remove (-) */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onRemoveFromDeck(card.id); }}
                                                    disabled={countInDeck === 0}
                                                    className="bg-red-600 text-white w-6 h-6 rounded-full disabled:opacity-30 hover:bg-red-500 text-lg leading-none"
                                                >
                                                    -
                                                </button>
                                                
                                                {/* จำนวนใน Deck */}
                                                <span className={`text-md font-bold ${countInDeck > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                                                    x{countInDeck}
                                                </span>
                                                
                                                {/* ปุ่ม Add (+) */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onAddToDeck(card.id); }}
                                                    disabled={deckList.length >= MAX_DECK_SIZE}
                                                    className="bg-green-600 text-white w-6 h-6 rounded-full disabled:opacity-30 hover:bg-green-500 text-lg leading-none"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}