// src/data/cards.ts

export type CardType = 'Attack' | 'Defend' | 'Heal' | 'Special';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  cost: number;
  description: string;
  icon: string;
  effect?: 'Pierce' | 'Drain' | 'AoE' | 'None' | 'ShieldBased' | 'ShieldExplode' | 'BurnDetonate';  ultimateCharge: number;
  exclusiveTo?: number;
}

export const CARD_POOL: Card[] = [
  // ... (ข้อมูลเดิมของการ์ดใบเก่า ไม่ต้องแก้) ...
  { 
    id: 'atk-001', name: "Quick Slash", type: 'Attack', 
    value: 40, cost: 1, description: "โจมตีรวดเร็ว", icon: "🗡️", effect: 'None', ultimateCharge: 15 
  },
  { 
    id: 'atk-002', name: "Heavy Smash", type: 'Attack', 
    value: 80, cost: 2, description: "ทุบอย่างแรง", icon: "🔨", effect: 'None', ultimateCharge: 25 
  },
  { 
    id: 'atk-003', name: "Spear Thrust", type: 'Attack', 
    value: 35, cost: 2, description: "แทงทะลุ", icon: "🔱", effect: 'Pierce', ultimateCharge: 20 
  },
  { 
    id: 'atk-004', name: "Vampire Bite", type: 'Attack', 
    value: 30, cost: 2, description: "ดูดเลือด", icon: "🦇", effect: 'Drain', ultimateCharge: 20 
  },
  { 
    id: 'def-001', name: "Iron Guard", type: 'Defend', 
    value: 40, cost: 1, description: "ยกโล่ป้องกัน", icon: "🛡️", effect: 'None', ultimateCharge: 10 
  },
  { 
    id: 'def-002', name: "Fortress", type: 'Defend', 
    value: 90, cost: 3, description: "ป้อมปราการ", icon: "🏰", effect: 'None', ultimateCharge: 30 
  },
  { 
    id: 'def-003', name: "Spiked Shield", type: 'Defend', 
    value: 30, cost: 2, description: "สะท้อนดาเมจ", icon: "🌵", effect: 'None', ultimateCharge: 15 
  },
  { 
    id: 'heal-001', name: "First Aid", type: 'Heal', 
    value: 40, cost: 1, description: "ปฐมพยาบาล", icon: "🩹", effect: 'None', ultimateCharge: 15 
  },
  { 
    id: 'heal-002', name: "Holy Light", type: 'Heal', 
    value: 80, cost: 3, description: "แสงรักษา", icon: "✨", effect: 'None', ultimateCharge: 35 
  },
  { 
    id: 'heal-003', name: "Healing Rain", type: 'Heal', 
    value: 25, cost: 2, description: "ฝนฟื้นฟู (หมู่)", icon: "🌧️", effect: 'AoE', ultimateCharge: 25 
  },
  { 
    id: 'sp-001', name: "Meteor", type: 'Attack', 
    value: 120, cost: 3, description: "อุกกาบาต!", icon: "☄️", effect: 'None', ultimateCharge: 50 
  }
];

// 🔥 จุดที่แก้: สร้างตัวแปรแยก และระบุ type เป็น Card[] ชัดเจน
export const EXTRA_CARDS: Card[] = [
  { 
    id: 'blaze-1', name: "Eternal Fire", type: 'Attack', 
    value: 30, cost: 2, description: "เผาไหม้ต่อเนื่อง 10 Turn", 
    icon: "🔥⏳", effect: 'None', ultimateCharge: 15,
    exclusiveTo: 1,
    // (หมายเหตุ: เราจะเขียน Logic พิเศษให้ใบนี้ใน useBattle เพื่อบังคับ Duration 10)
  },
  { 
    id: 'blaze-2', name: "Combustion", type: 'Attack', 
    value: 0, cost: 3, description: "ระเบิด Burn ทั้งหมด (Dmg * Turns)", 
    icon: "💥🔥", effect: 'BurnDetonate', ultimateCharge: 40,
    exclusiveTo: 1
  },
  // ใบที่ 1: Shield Bash (Atk + Shield)
  { 
    id: 'iron-1', name: "Shield Bash", type: 'Attack', 
    value: 100, cost: 2, description: "Dmg = ATK + Shield", 
    icon: "🛡️💥", effect: 'ShieldBased', ultimateCharge: 20 ,
    exclusiveTo: 2
  },
  // ใบที่ 2: Shield Explosion (ระเบิดเกราะ x300%)
  { 
    id: 'iron-2', name: "Body Slam", type: 'Attack', 
    value: 300, cost: 3, description: "ทำลายเกราะ -> Dmg 300%", 
    icon: "💣🧱", effect: 'ShieldExplode', ultimateCharge: 40 ,
    exclusiveTo: 2 
  },

  { id: 'ex-3', name: "Life Drain", type: 'Attack', value: 30, cost: 2, description: "ดูดเลือด", icon: "🩸", effect: 'Drain', ultimateCharge: 20 },
  { id: 'ex-4', name: "Power Up", type: 'Heal', value: 20, cost: 1, description: "บัฟพลังโจมตี", icon: "💪", effect: 'None', ultimateCharge: 10 },
  { id: 'ex-5', name: "Meteor", type: 'Attack', value: 100, cost: 3, description: "อุกกาบาต", icon: "☄️", ultimateCharge: 40 },
];

// 🔥 แล้วค่อยเอามารวมกันตรงนี้
export const AVAILABLE_CARDS: Card[] = [
  ...CARD_POOL,
  ...EXTRA_CARDS
].slice(0, 10);