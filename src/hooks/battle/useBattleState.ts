import { useState, useCallback } from 'react';
import { ActiveStatus } from '@/data/typesEffect';
import { BattleUnit } from '@/types/battles';

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
    
    // 1.1 แปลงข้อมูล Team (Players)
    const initialPlayers: BattleUnit[] = initialTeam.map((char) => {
      const maxHp = char.stats.hp || 100;
      const maxUlt = char.stats.maxUltimate || 100;

      return {
        // --- Static ---
        id: char.id,
        name: char.name,
        role: char.role,
        image: char.image,
        maxHp: maxHp,
        maxUlt: maxUlt,

        // --- Dynamic (ค่าเริ่มต้น) ---
        currentHp: maxHp,      
        shield: 0,            
        currentUlt: 0,        
        isDead: false,        
        statuses: []          
      };
    });

    // 1.2 สร้างข้อมูล Enemy (Boss)
    const initialEnemies: BattleUnit[] = [
      {
        id: 'boss_01',
        name: 'The Dark Lord',
        role: 'Boss',
        image: '/assets/boss.png',
        maxHp: 1500,
        maxUlt: 150,
        // --- Dynamic ---
        currentHp: 1500,
        shield: 0,
        currentUlt: 0,
        isDead: false,
        statuses: []
      }
    ];

    return {
      players: initialPlayers,
      enemies: initialEnemies
    };
  });

  // ✅ 2. Process Turn Logic
  const processTurnTick = useCallback((
    onEvent: (side: 'PLAYER' | 'ENEMY', index: number, value: number, type: 'DOT' | 'HEAL') => void
  ) => {
    
    setBattleState((prev) => { 
        
        // ฟังก์ชันย่อย
        const processUnit = (unit: BattleUnit, side: 'PLAYER' | 'ENEMY', idx: number): BattleUnit => {
            if (unit.isDead) return unit;

            let newHp = unit.currentHp; 
            const nextStatuses: ActiveStatus[] = [];

            unit.statuses.forEach((s) => { 
                // 1. DOT
                if (s.type === 'DOT') {
                    newHp = Math.max(0, newHp - s.value);
                    onEvent(side, idx, s.value, 'DOT');
                } 
                // 2. HOT
                else if (s.type === 'HOT') {
                    const healVal = Math.min(unit.maxHp - newHp, s.value);
                    if (healVal > 0) {
                        newHp += healVal;
                        onEvent(side, idx, healVal, 'HEAL');
                    }
                }

                // 3. ลด Duration
                if (s.duration > 1) {
                    nextStatuses.push({ ...s, duration: s.duration - 1 });
                }
            });

            return { 
                ...unit, 
                currentHp: newHp,
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