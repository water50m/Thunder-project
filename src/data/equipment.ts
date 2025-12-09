export type EquipmentType = 'Head' | 'Body' | 'Arms' | 'Legs' | 'Accessory';


export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  stats: string; // เช่น "+50 HP"
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Mock ข้อมูลอุปกรณ์ (แยกตามประเภท)
export const EQUIPMENT_POOL: Equipment[] = [
  { id: 'helm-1', name: "Iron Helm", type: 'Head', stats: "+50 HP", icon: "🪖", rarity: 'common' },
  { id: 'helm-2', name: "Mage Hat", type: 'Head', stats: "+10 Power", icon: "🎩", rarity: 'common' },
  
  { id: 'body-1', name: "Plate Armor", type: 'Body', stats: "+20 Def", icon: "👕", rarity: 'common' },
  { id: 'body-2', name: "Robe", type: 'Body', stats: "+50 Mana", icon: "👘", rarity: 'common' },

  { id: 'arm-1', name: "Gauntlets", type: 'Arms', stats: "+5 Atk", icon: "🥊", rarity: 'common' },
  { id: 'arm-2', name: "Bracers", type: 'Arms', stats: "+2 Spd", icon: "🦾", rarity: 'common' },

  { id: 'leg-1', name: "Iron Boots", type: 'Legs', stats: "+10 Def", icon: "👢", rarity: 'common' },
  { id: 'leg-2', name: "Sandals", type: 'Legs', stats: "+10 Spd", icon: "🩴", rarity: 'common' },

  { id: 'acc-1', name: "Ring of Power", type: 'Accessory', stats: "+5 All", icon: "💍", rarity: 'common' },
  { id: 'acc-2', name: "Amulet", type: 'Accessory', stats: "+100 HP", icon: "📿", rarity: 'common' },
];