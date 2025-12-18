import { BattleUnit } from '@/types/battles'; // Import Unit ของคุณ

// 1. นิยาม Type ให้ชัดเจน
export type TargetType = 'SELF' | 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'SINGLE_ALLY' | 'TEAM_ALL';
export type TargetSide = 'PLAYER' | 'ENEMY';

// ผลลัพธ์ที่บอกว่า "เป้าหมายอยู่ที่ไหนบ้าง"
export interface TargetLocation {
  side: TargetSide;
  index: number;
  unit: BattleUnit; // ส่งตัว Unit ไปด้วยเลย จะได้ไม่ต้องไปค้นอีกรอบ
}

/**
 * ฟังก์ชันคำนวณเป้าหมายทั้งหมด (รองรับทั้ง เดี่ยว และ หมู่)
 */
export const resolveTargets = (
  targetType: TargetType,
  enemies: BattleUnit[],     // Array ศัตรูทั้งหมด
  players: BattleUnit[],     // Array ฝั่งเราทั้งหมด (หรือ allies)
  actorIdx: number,    // Index ของคนร่าย (ปกติคือ playerIndex)
  inputTargetIndex: number = -1 // เป้าที่ User จิ้มมา (ถ้ามี)
): TargetLocation[] => {

  const results: TargetLocation[] = [];

  switch (targetType) {
    // --- 1. เป้าหมายคือตัวเอง ---
    case 'SELF':
      if (players[actorIdx]) {
        results.push({ side: 'PLAYER', index: actorIdx, unit: players[actorIdx] });
      }
      break;

    // --- 2. เป้าหมายคือศัตรูเดี่ยว ---
    case 'SINGLE_ENEMY':
      // ถ้ามีการเลือกเป้ามา และเป้านั้นมีตัวตน
      if (inputTargetIndex !== -1 && enemies[inputTargetIndex]) {
         results.push({ side: 'ENEMY', index: inputTargetIndex, unit: enemies[inputTargetIndex] });
      } else {
         // Fallback: ถ้าไม่ได้เลือกเป้า (เช่น กด Double Click) -> ให้หา Boss หรือตัวแรกที่รอดชีวิต
         // สมมติ: หา Boss ก่อน ถ้าไม่มีเอาตัวแรกที่เลือด > 0
         const bossIdx = enemies.findIndex(e => e.character.role == 'Boss' && e.currentHp > 0);
         const firstAliveIdx = enemies.findIndex(e => e.currentHp > 0);
         
         const targetIdx = bossIdx !== -1 ? bossIdx : firstAliveIdx;
         
         if (targetIdx !== -1 && enemies[targetIdx]) {
             results.push({ side: 'ENEMY', index: targetIdx, unit: enemies[targetIdx] });
         }
      }
      break;

    // --- 3. เป้าหมายคือศัตรูทั้งหมด (AOE) ---
    case 'ALL_ENEMIES':
      enemies.forEach((enemy, idx) => {
        if (enemy.currentHp > 0) { // เอาเฉพาะตัวที่ยังไม่ตาย
          results.push({ side: 'ENEMY', index: idx, unit: enemy });
        }
      });
      break;

    // --- 4. เป้าหมายคือเพื่อนเดี่ยว (ฮีล/บัฟ) ---
    case 'SINGLE_ALLY':
      if (inputTargetIndex !== -1 && players[inputTargetIndex]) {
        results.push({ side: 'PLAYER', index: inputTargetIndex, unit: players[inputTargetIndex] });
      } else {
        // Fallback: เข้าตัวเอง
        if (players[actorIdx]) {
            results.push({ side: 'PLAYER', index: actorIdx, unit: players[actorIdx] });
        }
      }
      break;

    // --- 5. เป้าหมายคือทีมเราทั้งหมด ---
    case 'TEAM_ALL':
      players.forEach((player, idx) => {
        if (player.currentHp > 0) {
          results.push({ side: 'PLAYER', index: idx, unit: player });
        }
      });
      break;
  }

  return results;
};