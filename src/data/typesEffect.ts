// src/data/types.ts

export type CardType = 'Attack' | 'Barrier' | 'Heal' | 'Special'  ;

export type Effect = 'Pierce' | 'Drain' | 'AoE' | 'None' | 'ShieldBased' 
| 'ShieldExplode' | 'BurnDetonate' | 'GroupHealDamage' | 'DmgOneHit'
| 'CleanseHeal' | 'ApplyStun' | 'ApplyDot' | 'ApplyRegen' | 'ShieldBreaker' 
| 'ShieldSteal' | 'DOT' | 'NormalAttack' | 'NormalDefend' |'HealOneTime'
| 'NormalHeal' | 'HealOverTime' | 'Barrier' | 'BuffAttack';

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
  | 'DEBUFF'
  | 'ATK_UP';    // เพิ่มเกราะต่อเนื่อง


export const EffectDebuff = [
  'DOT' ]        // Damage Over Time (เลือดลดต่อเนื่อง)

export type TargetType = 'SELF' | 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'SINGLE_ALLY' | 'TEAM_ALL';

export interface EffectDeteail {
  effect: Effect;
  value: number;       // ความแรง
  duration: number;    // จำนวนเทิร์น (0 = ทันที)
  target: TargetType;
  icon?: string;       // ไอคอนสถานะ
}

export interface UltimateSkill {
  name: string;
  description: string;
  effects: EffectDeteail[];
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
  side: 'ENEMY' | 'PLAYER';
  id: string;
  targetIndex: number;
  text: string;
  type: FloatingTextType;
}