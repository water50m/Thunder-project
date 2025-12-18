import { BattleUnit } from '@/types/battles'; // แก้ path ตามจริง
import { Card } from '@/data/cards'
import { resolveTargets } from '@/utils/targetResolver';
import { calculateCardEffect } from '@/utils/cardLogic'; 
import { calculateDamage } from '@/utils/battleLogic';
import { FloatingTextType } from '@/data/typesEffect'

// Interface สำหรับ Callbacks (เพื่อให้ฟังก์ชันนี้สั่ง UI ขยับได้)
interface ActionCallbacks {
  addFloatingText: (side: "PLAYER" | "ENEMY", index: number, text: string, type: FloatingTextType) => void;
  triggerShake: (side: "PLAYER" | "ENEMY", index: number) => void;
}

/**
 * ฟังก์ชันกลางสำหรับประมวลผล Action (ใช้ได้ทั้ง Card และ Ultimate)
 */
export const processAction = (
  card: Card,           // การ์ด (จริง หรือ Mock)
  actorIndex: number,       // index คนร่าย (ใน array players)
  currentPlayers: BattleUnit[], // state ปัจจุบัน
  currentEnemies: BattleUnit[], // state ปัจจุบัน
  callbacks: ActionCallbacks
) => {
  // 1. Clone Array เพื่อเตรียมแก้ไข (Important!)
  const nextPlayers = [...currentPlayers];
  const nextEnemies = [...currentEnemies];

  // Helper ดึง Unit
  const getUnit = (side: string, idx: number) => side === 'PLAYER' ? nextPlayers[idx] : nextEnemies[idx];

  // 2. หาเป้าหมาย (ใช้ Logic เดียวกันเสมอ)
  const targets = resolveTargets(
    card.targetType,
    nextEnemies,
    nextPlayers,
    actorIndex,
  );


  // 3. วนลูปทำงาน
  targets.forEach((target) => {
    const targetUnit = getUnit(target.side, target.index);
    const actorUnit = nextPlayers[actorIndex]; // ดึงตัวล่าสุดเสมอ

    // A. คำนวณ Effect
    const result = calculateCardEffect(
       card, actorUnit, 
       actorUnit.shield, targetUnit.shield, targetUnit.statuses
    );
    
    // B. Apply Damage / Heal / Shield
    // --- DAMAGE ---
    if (result.damage > 0) {
        const res = calculateDamage(targetUnit.currentHp, targetUnit.shield, result.damage);
        const dmgDealt = result.damage - (targetUnit.shield - res.shield);

        // Update Values
        targetUnit.currentHp = res.hp;
        targetUnit.shield = res.shield;
        targetUnit.isDead = res.hp <= 0;

        // Save (สำคัญมาก: บันทึกลง Array ที่ Clone มา)
        if (target.side === 'ENEMY') nextEnemies[target.index] = targetUnit;
        else nextPlayers[target.index] = targetUnit;

        // Visuals
        if (dmgDealt > 0) {
            callbacks.addFloatingText(target.side, target.index, `${dmgDealt}`, 'DMG');
            callbacks.triggerShake(target.side, target.index);
        }
        if ((targetUnit.shield - res.shield) > 0) {
            callbacks.addFloatingText(target.side, target.index, 'Block', 'BLOCK');
        }
    }

    // -----------------------------------------------------
    // 💚 2. HEAL Logic (ฮีลเลือด)
    // -----------------------------------------------------
    if (result.heal > 0) {
        // คำนวณเลือดที่จะฮีล (ห้ามเกิน Max HP)
        const missingHp = targetUnit.maxHp - targetUnit.currentHp;
        const healAmount = Math.min(missingHp, result.heal);

        if (healAmount > 0) {
            targetUnit.currentHp += healAmount;
            
            // แสดงตัวเลขสีเขียว
            callbacks.addFloatingText(target.side, target.index, `+${healAmount}`, 'HEAL');
        }
    }

    // -----------------------------------------------------
    // 🛡️ 3. SHIELD Logic (เพิ่มเกราะ)
    // -----------------------------------------------------
    if (result.shield > 0) {
        targetUnit.shield += result.shield;
        
        // แสดงตัวเลขหรือข้อความ (เลือก Type เป็น BUFF หรือ BLOCK ตามที่คุณตั้งไว้)
        callbacks.addFloatingText(target.side, target.index, `+${result.shield}🛡️`, 'BUFF');
    }

    // -----------------------------------------------------
    // 💫 4. STATUS EFFECT Logic (บัฟ/ดีบัฟ)
    // -----------------------------------------------------
    // ถ้าการ์ดมี effect status (เช่น ติดพิษ, เพิ่มพลังโจมตี)
    if (result.effectsToAdd && result.effectsToAdd.length > 0) {
        
        // ดึงเฉพาะตัว Status ออกมาจาก Object (เพราะโครงสร้างมันคือ { target: number, status: ActiveStatus })
        const newStatuses = result.effectsToAdd.map(e => e.status);

        // 1. ยัด Status ใหม่เข้าไปในตัวละคร
        targetUnit.statuses = [...targetUnit.statuses, ...newStatuses];
        
        // 2. แจ้งเตือนผู้เล่นว่าติดสถานะอะไรบ้าง
        newStatuses.forEach(status => {
             // status.type คือชื่อสถานะ เช่น "POISON", "STUN"
             callbacks.addFloatingText(target.side, target.index, status.type, 'BUFF');
        });
    }

    // -------------------------------------------------------------
    //  💀 เช็คตาย (DEATH CHECK) 
    // -------------------------------------------------------------
    if (targetUnit.currentHp <= 0) {
        // ล็อคเลือดไว้ที่ 0 (กันติดลบ เช่น -50)
        targetUnit.currentHp = 0;
        
        // ถ้ายังไม่ตาย ให้ระบุว่าตายแล้ว
        if (!targetUnit.isDead) {
            targetUnit.isDead = true;
            targetUnit.shield = 0;    // ตายแล้วเกราะแตก
            targetUnit.statuses = []; // ล้างสถานะทั้งหมด (ถ้าต้องการ)

            // แจ้ง UI ว่าตาย (ตัวอักษรสีแดงเข้ม หรือสีเทา)
            callbacks.addFloatingText(target.side, target.index, "DEAD", "DMG");
        }
    }
    // -----------------------------------------------------
    // 💾 Save Changes (บันทึกค่าลง Array)
    // -----------------------------------------------------
    // สำคัญ! ต้องยัด Object ที่แก้ค่าแล้ว กลับเข้าไปใน Array ต้นฉบับ
    if (target.side === 'ENEMY') {
        nextEnemies[target.index] = targetUnit;
    } else {
        nextPlayers[target.index] = targetUnit;
    }
    // แนะนำ: พยายามเขียนให้มันแก้ค่าใน nextPlayers / nextEnemies โดยตรง
  });

  // 4. Return Array ใหม่ออกไป
  return {
    nextPlayers,
    nextEnemies
  };
};