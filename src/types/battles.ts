import { ActiveStatus } from '@/data/typesEffect'
import { Character } from '@/data/characters';

// 1. สร้าง Type สำหรับ "1 ตัวละคร" (รวมทุกอย่างในตัวเดียว)
export interface BattleUnit {
  id: string | number;
  
  // ✅ เก็บข้อมูลต้นฉบับไว้ในนี้เลย (เข้าถึง stats, role, avatar ผ่านตัวนี้)
  character: Character; 

  // --- Dynamic State (ค่าที่เปลี่ยนตลอดเวลา) ---
  currentHp: number;
  maxHp: number;     // อาจจะแยกไว้เพื่อความง่าย หรือจะใช้ character.stats.hp ก็ได้
  currentUlt: number;
  maxUlt: number;
  shield: number;
  isDead: boolean;
  statuses: ActiveStatus[];
}

// 2. สร้าง State หลักที่แยกฝั่งชัดเจน
export interface BattleState {
  players: BattleUnit[]; // ทีมเรา (กี่คนก็ได้)
  enemies: BattleUnit[]; // ทีมศัตรู (กี่ตัวก็ได้)
  // ... ค่าอื่นๆ เช่น turn, phase
}



