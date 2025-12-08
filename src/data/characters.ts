// src/data/characters.ts
import { UltimateSkill } from './typesEffect'; // Import type มาใช้

export type Character = {
  id: number;
  name: string;
  role: 'Attacker' | 'Defender' | 'Support' | 'Balanced';
  description: string;
  avatar: string;
  stats: {
    hp: number;
    atk: number;
    def: number;
    cri: number;
    power: number;
    maxUltimate: number;
  };
  color: string;
  ultimate: UltimateSkill; // <--- เพิ่ม Field นี้
};

export const charactersData: Character[] = [
  {
    id: 1, name: "Blaze", role: "Attacker", description: "นักดาบเพลิง", avatar: "🔥", color: "red",
    stats: { hp: 100, atk: 55, def: 10, cri: 25, power: 20, maxUltimate: 100 },
    ultimate: {
      name: "Inferno",
      description: "เผาผลาญศัตรูทั้งหมด (30 Dmg/3 Turn)",
      effects: [
        { type: 'INSTANT_DMG', value: 80, duration: 0, target: 'ENEMY_ALL' },
        { type: 'DOT', value: 30, duration: 3, target: 'ENEMY_ALL', icon: '🔥' }
      ]
    }
  },
  {
    id: 2, name: "Ironclad", role: "Defender", description: "ป้อมปราการ", avatar: "🛡️", color: "blue",
    stats: { hp: 250, atk: 20, def: 50, cri: 5, power: 25, maxUltimate: 100 },
    ultimate: {
      name: "Iron Wall",
      description: "เพิ่มเกราะให้ตัวเองและทีม",
      effects: [
        { type: 'DEFEND_UP', value: 100, duration: 0, target: 'SELF' }, // เกราะตัวเองเยอะ
        { type: 'DEFEND_UP', value: 50, duration: 0, target: 'TEAM_ALL' } // เกราะเพื่อน
      ]
    }
  },
  {
    id: 3, name: "Lumina", role: "Support", description: "แสงรักษา", avatar: "✨", color: "green",
    stats: { hp: 150, atk: 25, def: 20, cri: 10, power: 30, maxUltimate: 100 },
    ultimate: {
      name: "Blessing",
      description: "ฮีลหมู่และรีเจนเลือด",
      effects: [
        { type: 'INSTANT_HEAL', value: 100, duration: 0, target: 'TEAM_ALL' },
        { type: 'HOT', value: 30, duration: 3, target: 'TEAM_ALL', icon: '💚' }
      ]
    }
  },
  {
    id: 4, name: "Vanguard", role: "Balanced", description: "นักรบสมดุล", avatar: "⚔️", color: "purple",
    stats: { hp: 180, atk: 35, def: 30, cri: 15, power: 15, maxUltimate: 100 },
    ultimate: {
      name: "Strike Command",
      description: "โจมตีรุนแรงใส่บอส",
      effects: [
        { type: 'INSTANT_DMG', value: 200, duration: 0, target: 'ENEMY_SINGLE' },
        { type: 'BUFF_POWER', value: 20, duration: 2, target: 'SELF', icon: '💪' }
      ]
    }
  }
];