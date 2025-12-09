import { useState } from 'react';
import { charactersData, Character } from '@/data/characters';
import { EquipmentType, Equipment } from '@/data/equipment';

// ขยาย Type ของตัวละครใน State (เฉพาะหน้านี้)
export interface CharacterState extends Character {
  equippedCards: string[];
  equippedItems: string[]; // เก็บ ID ไอเทม (max 5)
  equippedGear: Record<EquipmentType, string | null>; // เก็บ ID Gear แยกตามส่วน
  equippedSignature: string | null; // เก็บ ID ของประจำตัว (max 1)
}

export function useCharacterManager() {
  const [gold, setGold] = useState(5000);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  
  // Init State
  const [myChars, setMyChars] = useState<CharacterState[]>(charactersData.map(c => ({
      ...c,
      equippedCards: [],
      equippedItems: [],
      equippedGear: { Head: null, Body: null, Arms: null, Legs: null, Accessory: null },
      equippedSignature: null
  })));

  const activeChar = myChars.find(c => c.id === selectedCharId);
  
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
      
      let newEquipped = [...activeChar.equippedCards];
      
      if (newEquipped.includes(cardId)) {
          // ถ้ามีอยู่แล้ว -> ถอดออก
          newEquipped = newEquipped.filter(id => id !== cardId);
      } else {
          // ถ้ายังไม่มี -> เช็คว่าเต็มยัง?
          if (newEquipped.length < 2) {
              newEquipped.push(cardId); // ใส่เพิ่ม
          } else {
              alert("ใส่การ์ดได้สูงสุด 2 ใบ! (กรุณาถอดใบเก่าออกก่อน)");
              return;
          }
      }
      
      updateCharState({ equippedCards: newEquipped });
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
      setMyChars(prev => prev.map(c => c.id === activeChar!.id ? { ...c, ...updates } : c));
  };

  const unequipGear = (slot: EquipmentType) => {
      if (!activeChar) return;
      const newGear = { ...activeChar.equippedGear, [slot]: null };
      updateCharState({ equippedGear: newGear });
  };

  return {
    gold, myChars, selectedCharId, activeChar,
    setSelectedCharId, handleUpgrade, toggleEquipCard,
    toggleEquipItem, equipGear, equipSignature, unequipGear // Export ฟังก์ชันใหม่
  };
}