// src/data/cards.ts
import { TargetType } from '@/data/typesEffect'

export type CardType = 'Attack' | 'Defend' | 'Heal' | 'Special'  ;

export interface Card {
  id: string;
  name: string;
  owner?: string;
  type: CardType;
  value: number;
  cost: number;
  description: string;
  icon: string;
  effect?: 'Pierce' | 'Drain' | 'AoE' | 'None' | 'ShieldBased' | 'ShieldExplode' | 'BurnDetonate' | 'GroupHealDamage' | 'CleanseHeal' | 'ApplyStun' | 'ApplyDot' | 'ApplyRegen';  
  ultimateCharge: number;
  exclusiveTo?: number;
  duration?: number; // สำหรับการ์ดที่มีสถานะต่อเนื่อง (เช่น Burn, Regen)
  targetType: TargetType;
}

export const CARD_POOL: Card[] = [
  // --- Attack Cards ---
  { 
    id: 'atk-001', name: "Quick Slash", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅
    value: 40, cost: 1, description: "โจมตีรวดเร็ว", icon: "🗡️", effect: 'None', ultimateCharge: 15 
  },
  { 
    id: 'atk-002', name: "Heavy Smash", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅
    value: 80, cost: 2, description: "ทุบอย่างแรง", icon: "🔨", effect: 'None', ultimateCharge: 25 
  },
  { 
    id: 'atk-003', name: "Spear Thrust", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅
    value: 35, cost: 2, description: "แทงทะลุ", icon: "🔱", effect: 'Pierce', ultimateCharge: 20 
  },
  { 
    id: 'atk-004', name: "Vampire Bite", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅
    value: 30, cost: 2, description: "ดูดเลือด", icon: "🦇", effect: 'Drain', ultimateCharge: 20 
  },

  // --- Defend Cards ---
  { 
    id: 'def-001', name: "Iron Guard", type: 'Defend', targetType: 'SELF', // ✅
    value: 40, cost: 1, description: "ยกโล่ป้องกัน", icon: "🛡️", effect: 'None', ultimateCharge: 10 
  },
  { 
    id: 'def-002', name: "Fortress", type: 'Defend', targetType: 'SELF', // ✅
    value: 90, cost: 3, description: "ป้อมปราการ", icon: "🏰", effect: 'None', ultimateCharge: 30 
  },
  { 
    id: 'def-003', name: "Spiked Shield", type: 'Defend', targetType: 'SELF', // ✅
    value: 30, cost: 2, description: "สะท้อนดาเมจ", icon: "🌵", effect: 'None', ultimateCharge: 15 
  },

  // --- Heal Cards ---
  { 
    id: 'heal-001', name: "First Aid", type: 'Heal', targetType: 'SINGLE_ALLY', // ✅ ฮีลเพื่อนคนเดียว
    value: 40, cost: 1, description: "ปฐมพยาบาล", icon: "🩹", effect: 'None', ultimateCharge: 15 
  },
  { 
    id: 'heal-002', name: "Holy Light", type: 'Heal', targetType: 'SINGLE_ALLY', // ✅ ฮีลเพื่อนคนเดียว (ถ้าอยากฮีลหมู่แก้เป็น ALL_ALLIES)
    value: 80, cost: 3, description: "แสงรักษา", icon: "✨", effect: 'None', ultimateCharge: 35 
  },
  { 
    id: 'heal-003', name: "Healing Rain", type: 'Heal', targetType: 'TEAM_ALL', // ✅ ฮีลหมู่
    value: 25, cost: 2, description: "ฝนฟื้นฟู (หมู่)", icon: "🌧️", effect: 'AoE', ultimateCharge: 25 
  },

  // --- Special Attack ---
  { 
    id: 'sp-001', name: "Meteor", type: 'Attack', targetType: 'ALL_ENEMIES', // ✅ โจมตีหมู่
    value: 120, cost: 3, description: "อุกกาบาต!", icon: "☄️", effect: 'None', ultimateCharge: 50 
  }
];

// 🔥 EXTRA CARDS
export const EXTRA_CARDS: Card[] = [
  // --- Lumina ---
  {
      id: 'lumina-1', 
      name: "Flash Heal", 
      type: 'Heal',
      targetType: 'TEAM_ALL', // ✅ ฮีลหมู่และดาเมจ (อาจต้องเขียน Logic พิเศษว่าทำดาเมจด้วย)
      owner: "Lumina",
      value: 0.20, 
      cost: 2, 
      description: "Heal พันธมิตรทั้งหมด 20% MaxHP และทำความเสียหายเท่ากันต่อศัตรู 1 ตัว",
      icon: "✨✚", 
      effect: 'GroupHealDamage', 
      ultimateCharge: 20,
      exclusiveTo: 2,
  },
  {
      id: 'lumina-2', 
      name: "Lumina Smite", 
      type: 'Heal',
      targetType: 'SINGLE_ALLY', // ✅ ล้างบัฟให้เพื่อน 1 คน
      owner: "Lumina",
      value: 0, 
      cost: 1, 
      description: "ล้าง Debuff ทั้งหมดให้พันธมิตร Heal 10% ต่อ 1 Debuff ที่ล้างออก",
      icon: "✨💥", 
      effect: 'CleanseHeal', 
      ultimateCharge: 15,
      exclusiveTo: 2,
  },

  // --- Blaze ---
  { 
    id: 'blaze-1', name: "Eternal Fire", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅ เผา 1 ตัว
    value: 30, cost: 2, description: "เผาไหม้ต่อเนื่อง 10 Turn", 
    icon: "🔥⏳", effect: 'None', ultimateCharge: 15,
    exclusiveTo: 1, owner: "blaze"
  },
  { 
    id: 'blaze-2', name: "Combustion", type: 'Attack', targetType: 'ALL_ENEMIES', // ✅ ระเบิดทั้งหมด
    value: 0, cost: 3, description: "ระเบิด Burn ทั้งหมด (Dmg * Turns)", 
    icon: "💥🔥", effect: 'BurnDetonate', ultimateCharge: 40,
    exclusiveTo: 1, owner: "blaze"
  },

  // --- Ironclad ---
  { 
    id: 'iron-1', name: "Shield Bash", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅ ตี 1 ตัว (แรงตามโล่)
    value: 100, cost: 2, description: "Dmg = ATK + Shield", 
    icon: "🛡️💥", effect: 'ShieldBased', ultimateCharge: 20 ,
    exclusiveTo: 2, owner: "ironclad"
  },
  { 
    id: 'iron-2', name: "Body Slam", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅ ตี 1 ตัว (ระเบิดโล่)
    value: 300, cost: 3, description: "ทำลายเกราะ -> Dmg 300%", 
    icon: "💣🧱", effect: 'ShieldExplode', ultimateCharge: 40 ,
    exclusiveTo: 2, owner: "ironclad"
  },

  // --- Extra Generic ---
  { 
    id: 'ex-3', name: "Life Drain", type: 'Attack', targetType: 'SINGLE_ENEMY', // ✅ ดูดเลือด 1 ตัว
    value: 30, cost: 2, description: "ดูดเลือด", icon: "🩸", effect: 'Drain', ultimateCharge: 20 
  },
  { 
    id: 'ex-4', name: "Power Up", type: 'Heal', targetType: 'SELF', // ✅ บัฟตัวเอง
    value: 20, cost: 1, description: "บัฟพลังโจมตี", icon: "💪", effect: 'None', ultimateCharge: 10 
  },
  { 
    id: 'ex-5', name: "Meteor", type: 'Attack', targetType: 'ALL_ENEMIES', // ✅ โจมตีหมู่
    value: 100, cost: 3, description: "อุกกาบาต", icon: "☄️", ultimateCharge: 40 
  },
];

// 🔥 แล้วค่อยเอามารวมกันตรงนี้
export const AVAILABLE_CARDS: Card[] = [
  ...CARD_POOL,
  ...EXTRA_CARDS
]