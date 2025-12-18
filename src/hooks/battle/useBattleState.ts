import { useState, useCallback } from 'react';
import { ActiveStatus } from '@/data/typesEffect';
import { BattleUnit } from '@/types/battles';
import { enemyData } from '@/data/enemys';

export type BattleEntityState = {
  hp: number[];
  shield: number[];
  ult: number[];
  statuses: ActiveStatus[][];
};

export interface BattleState {
  players: BattleUnit[]; // เก็บ Hero ของเรา
  enemies: BattleUnit[]; // เก็บ Monster
}

export function useBattleState(initialTeam: any[]) { 
  
  // ✅ 1. Init State
  const [battleState, setBattleState] = useState<BattleState>(() => {
    // สร้างข้อมูลเริ่มต้น
    // --- 1.1 แปลงข้อมูล Team (Players) ---
    const initialPlayers: BattleUnit[] = initialTeam.map((char) => {
      // ดึงค่า stat ออกมาใช้เพื่อความสะดวก
      const maxHp = char.stats.hp || 100;
      const maxUlt = char.stats.maxUltimate || 100;

      return {
        id: char.id, // ID ของ Unit
        
        // ✅ CHANGE 1: ยัดข้อมูลต้นฉบับเข้าไป (เพื่อเอาไว้ใช้คำนวณ ATK/DEF/ROLE)
        character: char, 

        // --- Dynamic (ค่าเริ่มต้น) ---
        currentHp: maxHp,
        maxHp: maxHp,       // เก็บ maxHp ไว้ที่ระดับ Unit ด้วยก็ดีครับ ใช้ง่ายดี
        currentUlt: 0,
        maxUlt: maxUlt,
        
        shield: 0,
        statuses: [],
        isDead: false
      };
    });

    // --- 1.2 สร้างข้อมูล Enemy (Boss) ---
    // ดึงข้อมูล Boss จาก Data กลาง
    const bossData = enemyData.find(e => e.id === 999) || enemyData[0];
    
    // ✅ CHANGE 2: สร้าง BattleUnit ให้บอส และใส่ใน Array []
    const initialEnemies: BattleUnit[] = [
      {
        id: 'boss_unit', // ตั้ง ID ให้ Unit
        character: bossData, // ยัดข้อมูล Boss เข้าไป

        // Map Stats เริ่มต้น
        currentHp: bossData.stats.hp,
        maxHp: bossData.stats.hp,
        currentUlt: 0,
        maxUlt: bossData.stats.maxUltimate,
        
        shield: 0,
        statuses: [],
        isDead: false
      }
      // ถ้ามีลูกน้อง (Minions) ก็ comma , แล้วเพิ่ม object ต่อท้ายตรงนี้ได้เลย
    ];

    // Return State Object
    return {
      players: initialPlayers,
      enemies: initialEnemies // ตอนนี้เป็น BattleUnit[] ถูกต้องแล้ว
    };
  });

  // ✅ 2. Process Turn Logic
  const processTurnTick = useCallback((
    onEvent: (side: 'PLAYER' | 'ENEMY', index: number, value: number, type: 'DOT' | 'HEAL') => void
  ) => {
    
    setBattleState((prev) => { 
        
        // ฟังก์ชันย่อย
        const processUnit = (unit: BattleUnit, side: 'PLAYER' | 'ENEMY', idx: number): BattleUnit => {
            // ถ้าตายแล้ว ไม่ต้องทำอะไร
            if (unit.isDead) return unit;

            let newHp = unit.currentHp;
            let newShield = unit.shield; // ✅ 1. เอา Shield มาคำนวณด้วย
            const nextStatuses: ActiveStatus[] = [];

            unit.statuses.forEach((s) => {
                
                // --- กรณี DOT (Damage Over Time) ---
                if (s.type === 'DOT') {
                    let damage = s.value;

                    // ✅ Logic: ให้ DOT ลดเกราะก่อน (ถ้าอยากให้เจาะเกราะเลย ให้ลบบล็อกนี้ทิ้ง)
                    if (newShield > 0) {
                        const blocked = Math.min(newShield, damage);
                        newShield -= blocked;
                        damage -= blocked;
                    }

                    // ส่วนที่เหลือค่อยลดเลือด
                    if (damage > 0) {
                        newHp = Math.max(0, newHp - damage);
                    }

                    // ส่ง Event (อาจจะส่งค่า Damage จริงที่เข้าเนื้อ หรือ Total Damage ก็ได้)
                    onEvent(side, idx, s.value, 'DOT');
                } 
                
                // --- กรณี HOT (Heal Over Time) ---
                else if (s.type === 'HOT') {
                    // ✅ ใช้ maxHp จาก unit (ตาม Interface ล่าสุด)
                    const healVal = Math.min(unit.maxHp - newHp, s.value);
                    
                    if (healVal > 0) {
                        newHp += healVal;
                        onEvent(side, idx, healVal, 'HEAL');
                    }
                }

                // --- ลด Duration ---
                if (s.duration > 1) {
                    nextStatuses.push({ ...s, duration: s.duration - 1 });
                }
            });

            return { 
                ...unit, 
                currentHp: newHp,
                shield: newShield, // ✅ อย่าลืม update shield กลับไป
                statuses: nextStatuses,
                isDead: newHp === 0 
            };
        };

        const newPlayers = prev.players.map((p, i) => processUnit(p, 'PLAYER', i));
        const newEnemies = prev.enemies.map((e, i) => processUnit(e, 'ENEMY', i));

        return { 
            ...prev, 
            players: newPlayers, 
            enemies: newEnemies 
        };
    });
  }, []); // End useCallback

  // ✅ 3. Return ค่าออกไปใช้งาน
  return { 
    battleState, 
    setBattleState, 
    processTurnTick 
  };

} // End Function