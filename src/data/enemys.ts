import { Character } from '@/data/characters'

export const enemyData: Character[] = [
  // --- 1. BOSS ---
  {
    id: 999,
    name: "Demon King",
    role: "Boss",
    rank:'COMMON',
    description: "ราชาปีศาจผู้ทรงพลัง",
    avatar: "👿",
    color: "red",
    stats: {
      hp: 1000,
      atk: 5,  // Base Attack
      def: 20,
      cri: 10,
      power: 0,
      maxUltimate: 100
    },
    ultimate: {
      name: "Hell Fire",
      description: "เผาผลาญทุกสิ่ง",
      effects: []
    },
    equipedSkillCard: []
  },

  // --- 2. MINION (Slime) ---
  {
    id: 101, // ID ของต้นแบบ Slime
    name: "Slime",
    role: "Minion", // ✅ Role Minion
    rank:'COMMON',
    description: "มอนสเตอร์ตัวน้อย",
    avatar: "💧",
    color: "blue",
    stats: {
      hp: 200,
      atk: 15,  // ตีเบา
      def: 5,   // ตัวนิ่ม
      cri: 0,   // ไม่คริ
      power: 0,
      maxUltimate: 50
    },
    ultimate: {
      name: "Splash",
      description: "กระเด็นใส่ศัตรู",
      effects: []
    },
    equipedSkillCard: []
  }
];