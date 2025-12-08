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
  effect?: 'Pierce' | 'Drain' | 'AoE' | 'None';
  ultimateCharge: number; // <--- เพิ่มค่านี้ (เติมเกจเท่าไหร่)
}

export const CARD_POOL: Card[] = [
  { 
    id: 'atk-001', name: "Quick Slash", type: 'Attack', 
    value: 40, cost: 1, description: "โจมตีรวดเร็ว", icon: "🗡️", effect: 'None',
    ultimateCharge: 15 // ตีเบา ได้เกจ 15
  },
  { 
    id: 'atk-002', name: "Heavy Smash", type: 'Attack', 
    value: 80, cost: 2, description: "ทุบอย่างแรง", icon: "🔨", effect: 'None',
    ultimateCharge: 25 // ตีแรง ได้เกจเยอะ
  },
  { 
    id: 'atk-003', name: "Spear Thrust", type: 'Attack', 
    value: 35, cost: 2, description: "แทงทะลุ", icon: "🔱", effect: 'Pierce',
    ultimateCharge: 20
  },
  { 
    id: 'atk-004', name: "Vampire Bite", type: 'Attack', 
    value: 30, cost: 2, description: "ดูดเลือด", icon: "🦇", effect: 'Drain',
    ultimateCharge: 20
  },
  { 
    id: 'def-001', name: "Iron Guard", type: 'Defend', 
    value: 40, cost: 1, description: "ยกโล่ป้องกัน", icon: "🛡️", effect: 'None',
    ultimateCharge: 10
  },
  { 
    id: 'def-002', name: "Fortress", type: 'Defend', 
    value: 90, cost: 3, description: "ป้อมปราการ", icon: "🏰", effect: 'None',
    ultimateCharge: 30
  },
  { 
    id: 'heal-001', name: "First Aid", type: 'Heal', 
    value: 40, cost: 1, description: "ปฐมพยาบาล", icon: "🩹", effect: 'None',
    ultimateCharge: 15
  },
  { 
    id: 'sp-001', name: "Meteor", type: 'Attack', 
    value: 120, cost: 3, description: "เรียกอุกกาบาต", icon: "☄️", effect: 'None',
    ultimateCharge: 50
  }
];