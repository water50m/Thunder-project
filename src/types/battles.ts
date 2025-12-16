import { ActiveStatus } from '@/data/typesEffect'

// 1. สร้าง Type สำหรับ "1 ตัวละคร" (รวมทุกอย่างในตัวเดียว)
export interface BattleUnit {
  // ข้อมูลคงที่ (จาก Config/Team)
  id: number | string;
  name: string;
  role: 'Attacker' | 'Defender' | string;
  maxHp: number;
  maxUlt: number;
  image?: string;

  // ✅ เพิ่ม Stats ที่ต้องใช้คำนวณ
  atk: number;  // เพิ่ม
  def: number;  // เพิ่ม
  cri: number;  // เพิ่ม (Critical Chance)

  // ข้อมูลที่เปลี่ยนแปลงระหว่างสู้ (Dynamic State)
  currentHp: number;
  shield: number;
  currentUlt: number;
  isDead: boolean;
  statuses: ActiveStatus[]; // หรือ StatusType[]
}


// 2. สร้าง State หลักที่แยกฝั่งชัดเจน
export interface BattleState {
  players: BattleUnit[]; // ทีมเรา (กี่คนก็ได้)
  enemies: BattleUnit[]; // ทีมศัตรู (กี่ตัวก็ได้)
  // ... ค่าอื่นๆ เช่น turn, phase
}



