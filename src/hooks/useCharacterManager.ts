"use client";

import { useState, useEffect } from 'react';
import { Character } from '@/data/characters'; // ✅ ใช้ Type จาก Lib ที่เราสร้างเพื่อให้ตรงกับ DB
import { EquipmentType, Equipment } from '@/data/equipment';

// ขยาย Type ของตัวละครใน State
export interface CharacterState extends Character {
  equippedCards: string[]; // Map มาจาก equipedSkillCard
  equippedItems: string[];
  equippedGear: Record<EquipmentType, string | null>;
  equippedSignature: string | null;
  deckList: string[];
}

export function useCharacterManager() {
  const [gold, setGold] = useState(5000);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  
  // State สำหรับ Drag & Drop (เพิ่มใหม่)
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const [globalDeck, setGlobalDeck] = useState<string[]>([
    'atk-001', 'iron-1', 'atk-001', 'iron-1', 'atk-001',
  ]);

  // 1. Fetch Data จาก API จริง
  const [characters, setCharacters] = useState<Character[]>([]);
  
  useEffect(() => {
    const fetchChars = async () => {
      try {
        const res = await fetch('/api/characters/skillCard'); // ✅ เรียก API ใหม่
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setCharacters(data);
        
        // ถ้ายังไม่ได้เลือกตัวละคร ให้เลือกตัวแรกอัตโนมัติ
        if (data.length > 0 && !selectedCharId) {
             // setSelectedCharId(data[0].id); // (Optional: ถ้าอยากให้เลือกเลย)
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchChars();
  }, []);

  // 2. Init State (แปลงข้อมูลจาก DB -> Frontend State)
  const [myChars, setMyChars] = useState<CharacterState[]>([]);
  
  useEffect(() => {
    if (characters.length > 0) {
      const initializedChars = characters.map(c => ({
        ...c,
        // ✅ MAP DB FIELD: เอาค่าจาก DB มาใส่ State
        equippedCards: c.equipedSkillCard || [], 
        
        // Mock Data ส่วนอื่นๆ (เพราะ DB ยังไม่ได้เก็บ)
        equippedItems: [],
        equippedGear: { Head: null, Body: null, Arms: null, Legs: null, Accessory: null },
        equippedSignature: null,
        deckList: ['atk-001', 'iron-1', 'atk-001', 'iron-1', 'atk-001'],
      }));
      setMyChars(initializedChars);
    }
  }, [characters]);

  // Helper หาตัวละครที่เลือก
  const activeChar = myChars.find(c => c.id === selectedCharId) || myChars[0];

  // Helper Update State ภายใน
  const updateCharState = (updates: Partial<CharacterState>) => {
    if (!activeChar) return;
    setMyChars(prev => prev.map(c => 
      c.id === activeChar.id ? { ...c, ...updates } : c
    ));
  };

  // -----------------------------------------------------------
  // ✅ LOGIC จัดการ Skill Card (Auto-Save + Optimistic UI)
  // -----------------------------------------------------------
  const toggleEquipCard = async (cardId: string) => {
    if (!activeChar) return;

    // 1. คำนวณ Logic (เหมือนเดิม)
    let newEquipped = [...activeChar.equippedCards];
    
    if (newEquipped.includes(cardId)) {
        // มีอยู่แล้ว -> เอาออก
        newEquipped = newEquipped.filter(id => id !== cardId);
    } else {
        // ยังไม่มี -> ใส่เพิ่ม (Max 2)
        if (newEquipped.length < 2) {
            newEquipped.push(cardId);
        } else {
            alert("ช่องสวมใส่การ์ดเต็มแล้ว!");
            return;
        }
    }

    // 2. ✅ Optimistic Update: อัปเดตหน้าจอทันที
    updateCharState({ equippedCards: newEquipped });

    // 3. ✅ Background Auto-Save: ยิง API
    try {
        await fetch('/api/characters/skillCard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                characterId: activeChar.id,
                cardIds: newEquipped
            })
        });
        console.log("Auto-saved skills for", activeChar.name);
    } catch (error) {
        console.error("Auto-save failed:", error);
        // (Optional) ถ้าพังจริงๆ อาจจะ Rollback State กลับตรงนี้
    }
  };

  const removeCard = (cardId: string) => {
      // เรียกใช้ toggleEquipCard ได้เลย เพราะมันมี logic การเอาออกให้อยู่แล้ว
      // หรือจะเขียนแยกเพื่อความชัดเจนก็ได้ แต่วิธีนี้ประหยัดโค้ดกว่า
      if (activeChar?.equippedCards.includes(cardId)) {
          toggleEquipCard(cardId);
      }
  };

  // ✅ Logic สำหรับ Drag & Drop Card ลง Slot
  const handleDropCard = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.dragType !== 'CARD' || !activeChar) return;

    // ถ้าการ์ดนี้ใส่อยู่แล้ว ไม่ต้องทำอะไร
    if (activeChar.equippedCards.includes(draggedItem.id)) return;

    // สวมใส่การ์ด (Trigger Auto-save)
    toggleEquipCard(draggedItem.id); 
    setDraggedItem(null); // เคลียร์ของที่ลากมา
  };

  // -----------------------------------------------------------
  // Logic อื่นๆ (Items, Gear, Deck, Upgrade) - คงเดิมไว้
  // -----------------------------------------------------------

  const addToDeck = (cardId: string) => {
    if (globalDeck.length >= 30) {
      alert("Deck เต็มแล้ว! (สูงสุด 30 ใบ)");
      return;
    }
    setGlobalDeck(prev => [...prev, cardId]);
  };

  const removeFromDeck = (cardId: string) => {
    const indexToRemove = globalDeck.indexOf(cardId);
    if (indexToRemove !== -1) {
      const newDeck = [...globalDeck];
      newDeck.splice(indexToRemove, 1);
      setGlobalDeck(newDeck);
    }
  };

  const handleUpgrade = (statKey: keyof Character['stats']) => {
    if (!activeChar) return;
    if (gold < 200) {
      alert("เงินไม่พอ! (Need 200G)");
      return;
    }
    setGold(prev => prev - 200);
    const newStats = { ...activeChar.stats };
    newStats[statKey] += 5;
    updateCharState({ stats: newStats });
  };

  const toggleEquipItem = (itemId: string) => {
    if (!activeChar) return;
    const current = activeChar.equippedItems;
    let newItems = [...current];

    if (current.includes(itemId)) {
      newItems = newItems.filter(id => id !== itemId);
    } else {
      if (newItems.length < 5) newItems.push(itemId);
      else alert("พกได้สูงสุด 5 ชิ้น!");
    }
    updateCharState({ equippedItems: newItems });
  };

  const equipGear = (gear: Equipment) => {
    if (!activeChar) return;
    const newGear = { ...activeChar.equippedGear, [gear.type]: gear.id };
    updateCharState({ equippedGear: newGear });
  };

  const unequipGear = (slot: EquipmentType) => {
    if (!activeChar) return;
    const newGear = { ...activeChar.equippedGear, [slot]: null };
    updateCharState({ equippedGear: newGear });
  };

  const equipSignature = (sigId: string) => {
    if (!activeChar) return;
    const newSig = activeChar.equippedSignature === sigId ? null : sigId;
    updateCharState({ equippedSignature: newSig });
  };

  return {
    // Data & State
    gold, 
    myChars, 
    selectedCharId, 
    activeChar,
    globalDeck,
    
    // Drag & Drop State (ส่งออกไปให้หน้า UI ใช้)
    draggedItem,
    setDraggedItem,

    // Actions
    setSelectedCharId,
    handleUpgrade,
    
    // Card Management (Updated)
    toggleEquipCard, // ใช้ฟังก์ชันนี้แทน handleToggleCard ได้เลย
    removeCard,
    handleDropCard, // ✅ เพิ่มใหม่

    // Other Equipment
    toggleEquipItem,
    equipGear,
    unequipGear,
    equipSignature,

    // Deck Management
    addToDeck,
    removeFromDeck
  };
}