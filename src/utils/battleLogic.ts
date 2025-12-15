import { Character } from '@/data/characters';
import { Card as CardType } from '@/data/cards';
import { ActiveStatus } from '@/data/typesEffect';

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
  actor: Character, 
  card: CardType, 
  activeStatuses: ActiveStatus[]
): number {
  let bonus = 0;

  // วนลูปเช็คสถานะที่มีผลต่อการโจมตี
  activeStatuses.forEach(status => {
    // ตัวอย่าง Logic:
    // ถ้ามีการ์ดประเภท Attack และมีสถานะ Strength -> เพิ่มดาเมจ
    if (card.type === 'Attack') {
      if (status.type === 'STRENGTH') {
        bonus += status.value;
      }
      if (status.type === 'WEAK') {
        bonus -= status.value;
      }
    }

    // ถ้ามีการ์ด Defend และมีสถานะ Fortify -> เพิ่มเกราะ
    if (card.type === 'Defend' && status.type === 'FORTIFY') {
      bonus += status.value;
    }
  });

  return bonus;
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