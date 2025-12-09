import React, { useState } from 'react';
import UnitDisplay from '@/components/UnitDisplay';
import { CharacterState } from '@/hooks/useCharacterManager';
import { AVAILABLE_CARDS } from '@/data/cards';
import { ITEM_POOL } from '@/data/items';
import { EQUIPMENT_POOL, EquipmentType } from '@/data/equipment';
import { SIGNATURE_POOL } from '@/data/signatures';
import DetailedSelectionModal from './DetailedSelectionModal';
import EquipmentModal from './EquipmentModal';
import CardManagementPanel from './CardManagementPanel';

interface Props {
  char: CharacterState;
  onClose: () => void;
  onUpgrade: (key: any) => void;
  onToggleCard: (id: string) => void;
  onToggleItem: (id: string) => void;
  onEquipGear: (item: any) => void;
  onUnequipGear: (slot: EquipmentType) => void;
  onEquipSig: (id: string) => void;
}

export default function CharacterModal({ 
    char, onClose, onUpgrade, onToggleCard, 
    onToggleItem, onEquipGear, onUnequipGear,
    onEquipSig
}: Props) {

  const [showItemModal, setShowItemModal] = useState(false);
  const [modalType, setModalType] = useState<'NONE' | 'ITEMS' | 'GEAR' | 'SIG' | 'CARDS'>('NONE');  
  const [targetGearSlot, setTargetGearSlot] = useState<EquipmentType | null>(null);
  



  // Getters
  const getCard = (id: string) => AVAILABLE_CARDS.find(c => c.id === id);
  const getItem = (id: string) => ITEM_POOL.find(i => i.id === id);
  const getGear = (slot: EquipmentType) => EQUIPMENT_POOL.find(e => e.id === char.equippedGear[slot]);
  
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [inspectItem, setInspectItem] = useState<any>(null);
  const [hoverSig, setHoverSig] = useState<any>(null);
  
  const openGearModal = (slot: EquipmentType) => {
      setTargetGearSlot(slot); // เซ็ตว่าจะเลือกของช่องไหน
      setModalType('GEAR');    // เปิด Modal Gear
  };
  const handleDragStart = (e: React.DragEvent, item: any, type: string) => {
      setDraggedItem({ ...item, dragType: type });
      setInspectItem(item);  // โชว์รายละเอียดตอนเริ่มลาก
  };

  const handleDropCard = (e: React.DragEvent) => {
      e.preventDefault();
      // เช็คว่าของที่ลากมาเป็นการ์ดจริงไหม
      if (draggedItem?.dragType === 'CARD') {
          onToggleCard(draggedItem.id);
      }
      setDraggedItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 animate-fadeIn text-white font-sans select-none">
        
        {/* Main Container */}
        <div className="w-full h-full bg-slate-950 shadow-2xl flex border border-slate-700 rounded-xl overflow-hidden relative">
            
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded flex items-center justify-center font-bold transition-colors">✕</button>

            {/* ================= COL 1: CHARACTER (Leftmost) ================= */}
            {/* 🔥 แก้ไข: ปรับความกว้างเหลือ w-[14%] (เล็กลงอีก 25%) */}
            <div className="w-[14%] bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 border-r border-slate-700 relative shadow-[10px_0_20px_rgba(0,0,0,0.3)] z-10">
                {/* ลดขนาดตัวอักษรชื่อลงนิดหน่อย */}
                <h2 className="text-lg font-bold mb-4 uppercase tracking-widest text-center break-words leading-tight">{char.name}</h2>
                
                {/* Graphic: ลด Scale ลงเหลือ 110 เพื่อให้พอดีกรอบที่แคบลง */}
                <div className="scale-110 origin-center drop-shadow-2xl mb-4">
                    <UnitDisplay name="" avatar={char.avatar} color={char.color} hp={char.stats.hp} maxHp={char.stats.hp} ult={100} maxUlt={char.stats.maxUltimate} variant="BOSS" />
                </div>
                
                <div className="mt-4 text-[10px] text-slate-400 text-center px-1 italic leading-tight">
                    "{char.description}"
                </div>
            </div>

            {/* ================= COL 2: GEAR & SIG (Middle-Left) ================= */}
            <div className="flex-1 flex flex-col border-r border-slate-700">
                
                {/* Top: Equipment Slots */}
                <div className="flex-[2] bg-slate-900 p-6 overflow-y-auto">
                    <h3 className="text-slate-300 font-bold mb-4 uppercase border-b border-slate-700 pb-2 text-sm">Equipment</h3>
                    <div className="space-y-3">
                        {(['Head', 'Body', 'Arms', 'Legs', 'Accessory'] as EquipmentType[]).map(slot => {
                            const gear = getGear(slot);
                            return (
                                <div key={slot} 
                                     onClick={() => openGearModal(slot)}
                                     className="flex items-center justify-between bg-slate-800/50 p-2 rounded cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/50 hover:border-blue-500/50 group"
                                     
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-black/30 rounded flex items-center justify-center text-xl shadow-inner relative">
                                            {gear ? gear.icon : <span className="opacity-20 text-sm">{slot[0]}</span>}
                                            {gear && <div className="absolute inset-0 bg-red-900/80 hidden group-hover:flex items-center justify-center text-xs rounded">✕</div>}
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">{slot}</div>
                                            <div className={`text-sm font-bold ${gear ? 'text-blue-300' : 'text-slate-600'}`}>{gear ? gear.name : 'Empty'}</div>
                                        </div>
                                    </div>
                                    <span className="text-slate-600 text-xs">▼</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Bottom: Signature */}
                <div className="flex-1 bg-gradient-to-t from-yellow-900/10 to-slate-900 p-4 relative group border-t border-slate-700 overflow-y-auto">
                    <h3 className="text-yellow-500/80 font-bold mb-3 uppercase text-sm flex justify-between">
                        <span>Signature Weapon</span>
                        <span className="text-[10px] text-slate-500">Choose 1</span>
                    </h3>
                    
                    <div className="space-y-2">
                        {SIGNATURE_POOL.map((sig) => {
                            const isEquipped = char.equippedSignature === sig.id;
                            return (
                                <div 
                                    key={sig.id}
                                    onClick={() => onEquipSig(sig.id)} // กดเพื่อใส่
                                    onMouseEnter={() => setHoverSig(sig)} 
                                    onMouseLeave={() => setHoverSig(null)}
                                    className={`
                                        flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all
                                        ${isEquipped 
                                            ? 'bg-yellow-900/40 border-yellow-500 ring-1 ring-yellow-500/50' 
                                            : 'bg-slate-800/40 border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800'}
                                    `}
                                >
                                    <div className="text-2xl">{sig.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${isEquipped ? 'text-yellow-100' : 'text-slate-400'}`}>
                                            {sig.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate">{sig.bonus}</div>
                                    </div>
                                    {isEquipped && <div className="text-yellow-500 text-xs">✅</div>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Popup รายละเอียดตอน Hover */}
                    {hoverSig && (
                        <div className="absolute bottom-full left-0 w-full bg-slate-900 p-4 rounded-t-lg z-20 pointer-events-none border border-slate-600 shadow-xl">
                            <div className="font-bold text-yellow-400 text-lg flex items-center gap-2">
                                <span>{hoverSig.icon}</span> {hoverSig.name}
                            </div>
                            <div className="text-xs mt-2 text-slate-300">{hoverSig.description}</div>
                            <div className="text-sm text-green-400 mt-2 font-mono border-t border-slate-700 pt-2">{hoverSig.bonus}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= COL 3: CARDS & STATS (Middle-Right) ================= */}
                <CardManagementPanel 
                charId={char.id}
                equippedIds={char.equippedCards}
                draggedItem={draggedItem}
                onToggleCard={onToggleCard}
                onInspect={setInspectItem}
                onDragStart={handleDragStart}
                onDropCard={handleDropCard}
            />

            {/* ================= COL 4: STATS & ITEMS (Rightmost) ================= */}
            <div className="flex-1 flex flex-col">
                
                {/* Top: Stats */}
                <div className="flex-[2] bg-slate-900 p-6 overflow-y-auto">
                    <h3 className="text-slate-300 font-bold mb-4 uppercase border-b border-slate-700 pb-2 text-sm">Statistics</h3>
                    <div className="space-y-2">
                        {[
                            { l: "Max HP", v: char.stats.hp, k: 'hp', up: true },
                            { l: "Attack", v: char.stats.atk, k: 'atk', up: true },
                            { l: "Defense", v: char.stats.def, k: 'def', up: true },
                            { l: "Power", v: char.stats.power, k: 'power', up: true },
                            { l: "Crit Rate", v: `${char.stats.cri}%`, k: null, up: false },
                        ].map((s: any) => (
                            <div key={s.l} className="flex justify-between items-center bg-slate-800/40 p-2 rounded hover:bg-slate-800 transition-colors">
                                <span className="text-slate-400 text-sm font-bold">{s.l}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-white text-lg">{s.v}</span>
                                    {s.up && <button onClick={() => onUpgrade(s.k)} className="w-6 h-6 bg-green-700 hover:bg-green-600 text-white rounded flex items-center justify-center text-xs font-bold shadow-sm transition-transform active:scale-95">+</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Items */}
                <div className="flex-1 bg-gradient-to-t from-blue-900/10 to-slate-900 p-6 relative border-t border-slate-700">
                    <h3 className="text-blue-400/80 font-bold mb-2 uppercase text-sm">Consumables Pouch</h3>
                    
                    {/* Item Grid */}
                    <div className="grid grid-cols-3 gap-3 cursor-pointer group" onClick={() => setShowItemModal(true)}>
                        {Array.from({length: 5}).map((_, i) => {
                            const item = getItem(char.equippedItems[i]);
                            return (
                                <div key={i} className="aspect-square bg-slate-800/50 rounded-lg border border-blue-900/30 flex items-center justify-center hover:bg-blue-900/20 transition-colors shadow-sm relative">
                                    {item ? <span className="text-3xl drop-shadow">{item.icon}</span> : <span className="text-slate-600/30 text-xs">Empty</span>}
                                </div>
                            )
                        })}
                        <div className="aspect-square bg-blue-600/10 rounded-lg border border-blue-500/30 flex flex-col items-center justify-center text-blue-400 group-hover:bg-blue-600/20 transition-colors">
                            <span className="text-xl mb-1">⚙️</span>
                            <span className="text-[8px] font-bold">MANAGE</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* Modal เลือกไอเทม */}
        {showItemModal && (
            <DetailedSelectionModal 
                title="Manage Consumables"
                pool={ITEM_POOL}
                equippedIds={char.equippedItems}
                onEquip={(item) => onToggleItem(item.id)}
                onUnequip={(id) => onToggleItem(id)}
                onClose={() => setShowItemModal(false)}
                renderIcon={(item) => item.icon}
                getItemName={(item) => item.name}
                getItemDesc={(item) => item.description}
                getItemEffect={(item) => "Restores Health / Utility"}
                getItemLevel={(item) => "Common"}
            />
        )}

        {/* 🔥 1. GEAR MODAL (ใช้ Component ใหม่ที่เพิ่งสร้าง) */}
        {modalType === 'GEAR' && targetGearSlot && (
            <EquipmentModal 
                equippedGear={char.equippedGear} // ส่งไปทั้งก้อนเลย ให้มันไปจัดการเอง
                initialSlot={targetGearSlot}     // บอกว่ากดช่องไหนเข้ามา
                onEquip={(item) => { onEquipGear(item); }} // ไม่ต้องปิด Modal ทันทีเพื่อให้กดเปลี่ยนชิ้นอื่นต่อได้ หรือจะปิดก็ได้ตามชอบ
                onUnequip={onUnequipGear}
                onClose={() => setModalType('NONE')}
            />
        )}
                

    </div>
  );
}