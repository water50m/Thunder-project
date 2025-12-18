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
      
          // Fallback: ถ้าไม่ได้เลือกเป้าหมายมา
          // กฎใหม่: "ต้องหาตัวที่ยืนหน้าก่อนเสมอ"
          
          // ค้นหา Index แรกสุดที่มีชีวิต (นี่คือตัวที่อยู่หน้าสุดตามลำดับ Array)
          const frontUnitIdx = enemies.findIndex(e => e.currentHp > 0);
          
          // ถ้าเจอตัวเป็นๆ (ไม่คืนค่า -1) ก็ล็อกเป้าตัวนั้นเลย
          if (frontUnitIdx !== -1 && enemies[frontUnitIdx]) {
              results.push({ 
                  side: 'ENEMY', 
                  index: frontUnitIdx, 
                  unit: enemies[frontUnitIdx] 
              });
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
      // ค้นหา Index ของตัวละครที่:
      // 1. Index ไม่ตรงกับคนร่าย (ไม่ใช่ตัวเอง)
      // 2. ยังมีชีวิตอยู่ (currentHp > 0)
      const teammateIdx = players.findIndex((p, idx) => idx !== actorIdx && p.currentHp > 0);

      if (teammateIdx !== -1 && players[teammateIdx]) {
          results.push({ 
              side: 'PLAYER', 
              index: teammateIdx, 
              unit: players[teammateIdx] 
          });
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