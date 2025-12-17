import { Character } from '@/data/characters';
import { Card as CardType } from '@/data/cards';
import { ActiveStatus } from '@/data/typesEffect';
import { CardBonus } from '@/utils/cardLogic';
import { BattleUnit } from '@/types/battles';

// --- Types สำหรับ Return Value ---
interface DamageResult {
  hp: number;
  shield: number;
  damageDealtToHp: number; // เอาไว้แสดงตัวเลขสีแดง
  damageBlocked: number;   // เอาไว้แสดงตัวเลขสีเทา (Block)
}

/**
 * คำนวณความเสียหายเมื่อโจมตีใส่เป้าหมายที่มีเกราะ
 * @param currentHp เลือดปัจจุบัน
 * @param currentShield เกราะปัจจุบัน
 * @param incomingDamage ดาเมจที่เข้ามา
 */
export function calculateDamage(
  currentHp: number, 
  currentShield: number, 
  incomingDamage: number
): DamageResult {
  let remainingDamage = incomingDamage;
  let damageBlocked = 0;

  // 1. คำนวณดาเมจที่เข้าเกราะก่อน
  if (currentShield > 0) {
    if (currentShield >= remainingDamage) {
      // เกราะรับได้หมด
      damageBlocked = remainingDamage;
      return {
        hp: currentHp,
        shield: currentShield - remainingDamage,
        damageDealtToHp: 0,
        damageBlocked: damageBlocked
      };
    } else {
      // เกราะแตก และดาเมจล้นไปเข้าเลือด
      damageBlocked = currentShield;
      remainingDamage -= currentShield;
      return {
        hp: Math.max(0, currentHp - remainingDamage),
        shield: 0,
        damageDealtToHp: remainingDamage,
        damageBlocked: damageBlocked
      };
    }
  }

  // 2. ถ้าไม่มีเกราะ เข้าเนื้อเต็มๆ
  return {
    hp: Math.max(0, currentHp - remainingDamage),
    shield: 0,
    damageDealtToHp: remainingDamage,
    damageBlocked: 0
  };
}

/**
 * คำนวณโบนัสการ์ดจาก Buff/Debuff
 * เช่น: ถ้ามี Buff 'STRENGTH' ให้เพิ่ม Attack +3
 */
export function calculateCardBonus(
  actor: BattleUnit, // ✅ เปลี่ยนจาก Character เป็น BattleUnit
  card: CardType, 
  activeStatuses: ActiveStatus[]
): CardBonus {
  
  let bonusDmg = 0;
  let bonusBlock = 0;

  // --- 1. ใช้ actor เช็ค Passive Skill (ตัวอย่าง) ---
  if (actor.character.name === 'Berserker' && actor.currentHp < actor.maxHp * 0.3) {
      // ถ้าเป็น Berserker และเลือดน้อยกว่า 30% -> ตีแรงขึ้น 5
      if (card.type === 'Attack') bonusDmg += 5;
  }

  // --- 2. เช็ค Status (Logic เดิม) ---
  activeStatuses.forEach(status => {
    if (card.type === 'Attack') {
      if (status.type === 'STRENGTH') {
        bonusDmg += status.value;
      }
      if (status.type === 'WEAK') {
        // ตัวอย่าง: ถ้า Weak ลดดาเมจลง 25% ของ ATK ตัวละคร
        // bonusDmg -= Math.floor(actor.atk * 0.25); 
        bonusDmg -= status.value;
      }
    }

    if (card.type === 'Defend' && status.type === 'FORTIFY') {
      bonusBlock += status.value;
    }
  });

  return { damage: bonusDmg, block: bonusBlock };
}
/**
 * คำนวณการเพิ่มเกจไม้ตาย (Ultimate Charge)
 * ไม่ให้เกินค่า Max
 */
export function calculateUltCharge(
  currentCharge: number, 
  maxCharge: number, 
  amount: number
): number {
  return Math.min(maxCharge, currentCharge + amount);
}

/**
 * (แถม) คำนวณการฮีล
 * เผื่ออนาคตมี Logic "โดนคำสาปห้ามฮีล" หรือ "ฮีลแรงขึ้น"
 */
export function calculateHeal(
  currentHp: number,
  maxHp: number,
  healAmount: number,
  activeStatuses: ActiveStatus[] = [] // เผื่อใช้ในอนาคต
): number {
  // เช็คสถานะ "ZOMBIE" หรือ "CURSED" ที่อาจจะทำให้ฮีลกลายเป็นดาเมจ (ตัวอย่าง)
  const isCursed = activeStatuses.some(s => s.type === 'CURSE_HEAL');
  if (isCursed) return currentHp; // ฮีลไม่เข้า หรือจะ return ลดเลือดก็ได้

  return Math.min(maxHp, currentHp + healAmount);
}