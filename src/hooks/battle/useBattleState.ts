import { useState, useCallback } from 'react';
import { ActiveStatus} from '@/data/typesEffect';


export type BattleEntityState = {
  hp: number[];
  shield: number[];
  ult: number[];
  statuses: ActiveStatus[][];
};

export function useBattleState(initialBossHp: number) {
  const [battleState, setBattleState] = useState<BattleEntityState>({
    hp: [], shield: [], ult: [], statuses: [[], [], [], []]
  });

  const processTurnTick = useCallback((
    onEvent: (targetIdx: number, value: number, type: 'DOT' | 'HEAL') => void
  ) => {
    setBattleState(prev => {
      const newHp = [...prev.hp];
      const newStatuses = prev.statuses.map((charStatuses, idx) => {
        const nextStatuses: ActiveStatus[] = [];

        charStatuses.forEach(s => {
          // 1. จัดการ DOT (ลดเลือด)
          if (s.type === 'DOT') {
            newHp[idx] = Math.max(0, newHp[idx] - s.value);
            onEvent(idx, s.value, 'DOT'); // แจ้ง UI
          }
          
          // 2. จัดการ HOT (เพิ่มเลือด)
          else if (s.type === 'HOT') {
            const maxHp = idx < 2 ? 100 : (idx === 2 ? initialBossHp : 300); // (ตัวอย่าง Logic MaxHP)
            const healVal = Math.min(maxHp - newHp[idx], s.value);
            if (healVal > 0) {
                newHp[idx] += healVal;
                onEvent(idx, healVal, 'HEAL'); // แจ้ง UI
            }
          }

          // 3. ลด Duration (ถ้าเหลือ > 1 ให้เก็บไว้ต่อ)
          if (s.duration > 1) {
            nextStatuses.push({ ...s, duration: s.duration - 1 });
          }
        });

        return nextStatuses;
      });

      return { ...prev, hp: newHp, statuses: newStatuses };
    });
  }, [initialBossHp]); // dependency อาจต้องเพิ่มตาม logic maxHp

  // Helper สำหรับการ Reset หรือ Init ค่า
  const initBattleState = useCallback((teamStats: any[], bossHp: number) => {
    setBattleState({
      hp: [teamStats[0].stats.hp, teamStats[1].stats.hp, bossHp, 300],
      shield: [0, 0, 0, 0],
      ult: [0, 0, 0, 0],
      statuses: [[], [], [], []],
    });
  }, []);

  // Generic Function สำหรับปรับ HP (ใช้ได้ทั้ง Heal และ DMG)
  const modifyHp = useCallback((targetIdx: number, value: number, isHeal: boolean, maxHp?: number) => {
    setBattleState(prev => {
      const newHp = [...prev.hp];
      if (isHeal) {
        newHp[targetIdx] = Math.min((maxHp || 9999), newHp[targetIdx] + value);
      } else {
        newHp[targetIdx] = Math.max(0, newHp[targetIdx] - value);
      }
      return { ...prev, hp: newHp };
    });
  }, []);

  // Generic Function สำหรับปรับ Shield
  const modifyShield = useCallback((targetIdx: number, value: number) => {
    setBattleState(prev => {
      const newShield = [...prev.shield];
      newShield[targetIdx] = Math.max(0, newShield[targetIdx] + value);
      return { ...prev, shield: newShield };
    });
  }, []);

  return {
    battleState,
    setBattleState, // Export เผื่อกรณี Edge case ที่ต้องแก้ raw state
    initBattleState,
    modifyHp,
    modifyShield,
    processTurnTick
  };
}