import { BattleUnit } from '@/types/battles'; // แก้ path ตามจริง
import { Card } from '@/data/cards'
import { resolveTargets } from '@/utils/targetResolver';
import { calculateCardEffect } from '@/utils/cardLogic'; 
import { calculateDamage } from '@/utils/battleLogic';
import { FloatingTextType } from '@/data/typesEffect'
import { ShakeType  } from './useBattleUI';

// Interface สำหรับ Callbacks (เพื่อให้ฟังก์ชันนี้สั่ง UI ขยับได้)
export interface ActionCallbacks {
  addFloatingText: (side: "PLAYER" | "ENEMY", index: number, text: string, type: FloatingTextType) => void;
  triggerShake: (side: "PLAYER" | "ENEMY", index: number, type: ShakeType ) => void;
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
  console.log('-----------cal dmg----------------');

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
        console.log('dmg: ', result.damage);

        if (result.damage > 0) {
        // 1. คำนวณผลลัพธ์ (แต่ยังไม่อัปเดตค่าจริง)
        const res = calculateDamage(targetUnit.currentHp, targetUnit.shield, result.damage);

        // 2. คำนวณส่วนต่าง (สำคัญ: ต้องทำตอนที่ targetUnit ยังเป็นค่าเก่า)
        const hpLost = targetUnit.currentHp - res.hp;      // เลือดที่ลด
        const shieldLost = targetUnit.shield - res.shield; // เกราะที่หายไป
        console.log('shield lost: ', shieldLost);

        // 3. อัปเดตค่าลงตัวละคร (Update Values)
        targetUnit.currentHp = res.hp;
        targetUnit.shield = res.shield;
        targetUnit.isDead = res.hp <= 0;

        // 4. บันทึก (Save)
        if (target.side === 'ENEMY') nextEnemies[target.index] = targetUnit;
        else nextPlayers[target.index] = targetUnit;

        // 5. Visuals (ใช้ค่าส่วนต่างที่คำนวณไว้ข้อ 2)
        
        // --- กรณีเข้าเนื้อ (HP ลด) ---
        if (hpLost > 0) {
            callbacks.addFloatingText(target.side, target.index, `${hpLost}`, 'DMG');
            callbacks.triggerShake(target.side, target.index, 'DAMAGE'); // สั่นแดง
        }
        
        // --- กรณีเข้าเกราะ (Shield ลด) ---
        if (shieldLost > 0) {
            // แสดง Text ว่ากันได้ (หรือจะโชว์เลขเกราะที่ลดก็ได้)
            callbacks.addFloatingText(target.side, target.index, 'Block', 'BLOCK');

            // ⚠️ Logic การแสดงโล่:
            // ถ้าเลือดไม่ลด (กันได้หมดจด) -> ให้แสดงท่า BLOCK (โล่ขึ้น)
            if (hpLost === 0) {
                callbacks.triggerShake(target.side, target.index, 'BLOCK');
            }
            // แต่ถ้าเลือดลดด้วย (เกราะแตกแล้วโดนตีต่อ) -> เราให้ priority กับ DAMAGE (สั่นแดง) ไปแล้วใน if ข้างบน
        }
    }

    // ---------------------------------------------------------
    // ✨ CLEANSE LOGIC (ล้างสถานะผิดปกติ)
    // ---------------------------------------------------------
    if (result.shouldCleanse) {
        
        // กรองเอาเฉพาะ Status ที่ "ไม่ใช่" สิ่งไม่ดี
        // (สมมติว่า type ที่ไม่ดีคือ: 'DEBUFF', 'DOT', 'WEAK', 'STUN')
        const badStatuses = ['DEBUFF', 'DOT', 'WEAK', 'STUN', 'POISON'];
        
        // เก็บเฉพาะ status ที่ไม่อยู่ใน list ของเสีย (บัฟดีๆ จะยังอยู่)
        const originalCount = targetUnit.statuses.length;
        targetUnit.statuses = targetUnit.statuses.filter(s => !badStatuses.includes(s.type));
        
        // เช็คว่ามีการลบจริงไหม (เพื่อแสดง Effect)
        if (targetUnit.statuses.length < originalCount) {
             callbacks.addFloatingText(target.side, target.index, "Cleanse", "BUFF");
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

    // -----------------------------------------------------------
    // 💪 5. STAT MODIFICATION (เพิ่มพลังถาวรในการต่อสู้นี้)
    // -----------------------------------------------------------
        if (result.statsModifier) {
            
            // เช็คและเพิ่ม ATK
            if (result.statsModifier.atk) {
                targetUnit.character.stats.atk = (targetUnit.character.stats.atk || 0) + result.statsModifier.atk;
            }

            // เช็คและเพิ่ม DEF (เผื่ออนาคตมีการ์ดเพิ่มเกราะถาวร)
            if (result.statsModifier.def) {
                targetUnit.character.stats.def = (targetUnit.character.stats.def || 0) + result.statsModifier.def;
            }
        }

    // -------------------------------------------------------------
    //  💀6. เช็คตาย (DEATH CHECK) 
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