"use client";

import { useState } from 'react';
import { charactersData, Character } from '@/data/characters';
import { EquipmentType, Equipment } from '@/data/equipment';

// ขยาย Type ของตัวละครใน State (เฉพาะหน้านี้)
export interface CharacterState extends Character {
  equippedCards: string[];
  equippedItems: string[];
  equippedGear: Record<EquipmentType, string | null>; // เก็บ ID Gear แยกตามส่วน
  equippedSignature: string | null; // เก็บ ID ของประจำตัว (max 1)
}

export function useCharacterManager() {
  const [gold, setGold] = useState(5000);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [globalDeck, setGlobalDeck] = useState<string[]>([
        'atk-001', 'iron-1', 'atk-001', 'iron-1', 'atk-001', // 5 ใบเริ่มต้น
    ]);
  
  // Init State
  const [myChars, setMyChars] = useState<CharacterState[]>(charactersData.map(c => ({
      ...c,
      equippedCards: [],
      equippedItems: [],
      equippedGear: { Head: null, Body: null, Arms: null, Legs: null, Accessory: null },
      equippedSignature: null,
      deckList: ['atk-001', 'iron-1', 'atk-001', 'iron-1', 'atk-001'], // 👈 5 ใบเริ่มต้น
  })));
  
  const activeChar = myChars.find(c => c.id === selectedCharId) || myChars[0];

  const addToDeck = (cardId: string) => {
        if (globalDeck.length >= 30) {
            alert("Deck เต็มแล้ว! (สูงสุด 30 ใบ)");
            return;
        }
        setGlobalDeck(prev => [...prev, cardId]);
    };

    //  ถอดการ์ดออกจาก Deck (ลบออก 1 ใบเท่านั้น)
    const removeFromDeck = (cardId: string) => {
        const indexToRemove = globalDeck.indexOf(cardId);
        if (indexToRemove !== -1) {
            const newDeck = [...globalDeck];
            newDeck.splice(indexToRemove, 1);
            setGlobalDeck(newDeck);
        }
    };

const removeCard = (cardId: string) => {
    if (!activeChar) return;
    // ใช้ filter กรองเอาการ์ดใบที่ต้องการออก
    const newEquipped = activeChar.equippedCards.filter(id => id !== cardId);
    updateCharState({ equippedCards: newEquipped });
};

    // Logic อัปเกรดสเตตัส (ใช้เงิน)
  const handleUpgrade = (statKey: keyof Character['stats']) => {
      if (!activeChar) return;
      if (gold < 200) {
          alert("เงินไม่พอ! (Need 200G)");
          return;
      }
      
      setGold(prev => prev - 200); // หักเงิน
      
      const newStats = { ...activeChar.stats };
      newStats[statKey] += 5; // เพิ่ม Stat ทีละ 5
      
      updateCharState({ stats: newStats });
  };




  // Logic ใส่/ถอด การ์ด (Max 2)
const toggleEquipCard = (cardId: string) => {
    if (!activeChar) return;
    
    // 1. ถ้าใส่อยู่แล้ว (includes) ให้ถอดออก
    if (activeChar.equippedCards.includes(cardId)) {
        removeCard(cardId);
    } else {
        // 2. ถ้ายังว่างอยู่ (ช่อง < 2) ให้ใส่เพิ่ม
        if (activeChar.equippedCards.length < 2) {
            const newEquipped = [...activeChar.equippedCards, cardId];
            updateCharState({ equippedCards: newEquipped });
        } else {
            // 3. ถ้าเต็มแล้ว ให้ Alert หรือจะเขียน Logic สลับก็ได้
            alert("ช่องสวมใส่การ์ดเต็มแล้ว!");
        }
    }
};

  // ✅ 1. Logic สวมใส่ ITEM (Max 5)
  const toggleEquipItem = (itemId: string) => {
      if (!activeChar) return;
      const current = activeChar.equippedItems;
      let newItems = [...current];

      if (current.includes(itemId)) {
          newItems = newItems.filter(id => id !== itemId); // ถอด
      } else {
          if (newItems.length < 5) newItems.push(itemId); // ใส่
          else alert("พกได้สูงสุด 5 ชิ้น!");
      }
      
      updateCharState({ equippedItems: newItems });
  };

  // ✅ 2. Logic สวมใส่ GEAR (ตาม Slot)
  const equipGear = (gear: Equipment) => {
      if (!activeChar) return;
      const newGear = { ...activeChar.equippedGear, [gear.type]: gear.id };
      updateCharState({ equippedGear: newGear });
  };

  // ✅ 3. Logic สวมใส่ SIGNATURE (Max 1)
  const equipSignature = (sigId: string) => {
      if (!activeChar) return;
      // ถ้ากดตัวเดิมให้ถอดออก, ถ้าตัวใหม่ให้สวมแทนเลย
      const newSig = activeChar.equippedSignature === sigId ? null : sigId;
      updateCharState({ equippedSignature: newSig });
  };

  // Helper เพื่ออัปเดต State
  const updateCharState = (updates: Partial<CharacterState>) => {
        const targetId = activeChar!.id;
      setMyChars(prev => {
      
          const newState = prev.map(c => {
              // เปรียบเทียบ ID ว่าตรงไหม (แปลงเป็น String ทั้งคู่เพื่อความชัวร์)
              if (c.id === targetId) { 
                return { ...c, ...updates };
            }
              return c;
          });

          
          return newState;
      });
  };

  const unequipGear = (slot: EquipmentType) => {
      if (!activeChar) return;
      const newGear = { ...activeChar.equippedGear, [slot]: null };
      updateCharState({ equippedGear: newGear });
  };

 return {
    gold, myChars, selectedCharId, activeChar,
    setSelectedCharId, 
    handleUpgrade, 
    
    // Cards
    toggleEquipCard, 
 
    removeCard, // ✅ ใส่กลับมาให้แล้วครับ
    
    // Items & Gear
    toggleEquipItem, 
    equipGear, 
    unequipGear, 
    equipSignature,

    // deck management
    globalDeck,
    addToDeck, 
    removeFromDeck
  };
}