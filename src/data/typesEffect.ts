// src/data/types.ts

export type EffectType = 
  | 'INSTANT_DMG'   // โจมตีทันที
  | 'INSTANT_HEAL'  // ฮีลทันที
  | 'DOT'           // Damage Over Time (เลือดลดต่อเนื่อง)
  | 'HOT'           // Heal Over Time (เลือดเด้งต่อเนื่อง)
  | 'BUFF_POWER'    // เพิ่มพลัง Power
  | 'DEFEND_UP'
  | 'STRENGTH' // เพิ่ม
  | 'WEAK'     // เพิ่ม
  | 'FORTIFY'
  | 'CURSE_HEAL'
  | 'BUFF'
  | 'DEBUFF';    // เพิ่มเกราะต่อเนื่อง
  
export const EffectDebuff = [
  'DOT' ]        // Damage Over Time (เลือดลดต่อเนื่อง)

export interface UltimateEffect {
  type: EffectType;
  value: number;       // ความแรง
  duration: number;    // จำนวนเทิร์น (0 = ทันที)
  target: 'SELF' | 'ENEMY_ALL' | 'ENEMY_SINGLE' | 'TEAM_ALL';
  icon?: string;       // ไอคอนสถานะ
}

export interface UltimateSkill {
  name: string;
  description: string;
  effects: UltimateEffect[];
}

// สถานะที่กำลังทำงานอยู่ (Active Status)
export interface ActiveStatus {
  id: string;
  type: EffectType;
  value: number;
  duration: number;
  icon: string;
}

export type FloatingTextType = 'DMG' | 'HEAL' | 'BLOCK' | 'BUFF' | 'DOT' | 'MISS' | 'DEBUFF' | 'BUFF';

export interface FloatingTextData {
  id: string;
  text: string;
  type: FloatingTextType;
}