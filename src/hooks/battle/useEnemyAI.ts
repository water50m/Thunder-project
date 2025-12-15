import { useState, useCallback } from 'react';
import { Card as CardType } from '@/data/cards';
import { calculateDamage } from '@/utils/battleLogic';
import { BattleEntityState } from './useBattleState';
import { FloatingTextType } from '@/data/typesEffect';

// --- Type Definitions ---
type EnemyActionType = 'FRONT_SINGLE' | 'PIERCE' | 'BACK_SNIPE' | 'AOE';

interface EnemyMove {
  name: string;
  damage: number;
  type: EnemyActionType;
  description: string;
}

// --- Dependencies Interface ---
// เรารับ Function จาก Hook อื่นๆ เข้ามา เพื่อให้ AI สั่งงานได้
interface UseEnemyAIProps {
  setBattleState: React.Dispatch<React.SetStateAction<BattleEntityState>>;
  setPhase: (phase: any) => void; // ใช้ type จริงตาม GamePhase
  setLog: (msg: string) => void;
  addFloatingText: (targetIdx: number, text: string, type: FloatingTextType) => void;
  triggerShake: (targetIdx: number) => void;
  processTurnStatuses: () => void; // ฟังก์ชันคำนวณ DOT/HOT
}

export function useEnemyAI({
  setBattleState,
  setPhase,
  setLog,
  addFloatingText,
  triggerShake,
  processTurnStatuses
}: UseEnemyAIProps) {
  
  const [enemyCardDisplay, setEnemyCardDisplay] = useState<CardType | null>(null);

  // Helper: Delay
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // --- 1. The Brain: ส่วนตัดสินใจ (แยกออกมาเพื่อให้ปรับสมดุลเกมง่าย) ---
  const decideEnemyAction = (): EnemyMove => {
    const rand = Math.random();
    // ตัวอย่าง: ถ้า HP บอสน้อยกว่า 30% อาจจะตีแรงขึ้น (Logic เพิ่มเติมในอนาคต)
    
    if (rand < 0.4) {
      return { name: "Dark Slash", damage: 40, type: 'FRONT_SINGLE', description: "โจมตีแถวหน้า" };
    } else if (rand < 0.7) {
      return { name: "Piercing Spear", damage: 30, type: 'PIERCE', description: "โจมตีทะลุ" };
    } else {
      return { name: "Shadow Snipe", damage: 50, type: 'BACK_SNIPE', description: "ลอบสังหารแถวหลัง" };
    }
  };

  // --- 2. The Execution: ส่วนการทำงาน ---
  const startEnemyTurn = useCallback(async (currentBattleState: BattleEntityState) => {
    setLog("Enemy Turn...");
    
    // 1. ประมวลผล Status Effect (DOT/HOT) ก่อนเริ่ม
    await delay(1000);
    processTurnStatuses();
    
    // 2. Loop การกระทำ (สมมติว่าบอสทำ 2 Action เสมอ)
    const ACTION_COUNT = 2;
    
    for (let i = 0; i < ACTION_COUNT; i++) {
        // เช็คก่อนว่าผู้เล่นตายหมดยัง ถ้าตายหมดแล้วหยุดทันที
        // (ต้องเช็ค Realtime แต่ใน Loop นี้เราใช้ State ล่าสุดผ่าน func setBattleState ได้)
        let isGameOver = false;
        
        // 2.1 AI คิด
        const move = decideEnemyAction();
        
        // 2.2 UI แสดงผล: บอสโชว์การ์ด
        const mockEnemyCard: CardType = { 
            id: `e-act-${i}`, 
            name: move.name, 
            type: "Attack", 
            value: move.damage, 
            cost: 0, 
            description: move.description, 
            icon: "👿", 
            ultimateCharge: 0 
        };
        setEnemyCardDisplay(mockEnemyCard);
        setLog(`บอสใช้: ${move.name}`);
        
        await delay(1500); // รอให้ผู้เล่นอ่านการ์ด

        // 2.3 คำนวณ Damage และอัปเดต State
        setBattleState(prev => {
            const newHp = [...prev.hp];
            const newShield = [...prev.shield];
            
            // Logic การเลือกเป้าหมาย
            // 0 = Front, 1 = Back
            const frontAlive = newHp[0] > 0;
            const backAlive = newHp[1] > 0;
            
            // ถ้าตายหมดแล้วไม่ต้องทำอะไร (เพื่อความชัวร์)
            if (!frontAlive && !backAlive) {
                isGameOver = true;
                return prev;
            }

            const applyDamageToTarget = (targetIdx: number, dmg: number) => {
                if (newHp[targetIdx] <= 0) return; // ตีศพไม่ได้

                const oldShield = newShield[targetIdx];
                const res = calculateDamage(newHp[targetIdx], newShield[targetIdx], dmg);
                
                newHp[targetIdx] = res.hp;
                newShield[targetIdx] = res.shield;

                // Visual Feedback
                if (oldShield > res.shield) {
                    addFloatingText(targetIdx, `${oldShield - res.shield}`, 'BLOCK');
                }
                
                const trueDmg = dmg - (oldShield - res.shield);
                if (trueDmg > 0) {
                    addFloatingText(targetIdx, `${trueDmg}`, 'DMG');
                    triggerShake(targetIdx);
                }
            };

            // Route Damage ตาม Type ของท่า
            if (move.type === 'FRONT_SINGLE') {
                applyDamageToTarget(frontAlive ? 0 : 1, move.damage);
            } else if (move.type === 'BACK_SNIPE') {
                applyDamageToTarget(backAlive ? 1 : 0, move.damage);
            } else if (move.type === 'PIERCE') {
                applyDamageToTarget(frontAlive ? 0 : 1, move.damage);
                if (frontAlive && backAlive) {
                    // ถ้าตัวหน้ายังอยู่ ตัวหลังโดนดาเมจครึ่งนึง (ตัวอย่าง Logic)
                    applyDamageToTarget(1, Math.floor(move.damage * 0.5));
                }
            }

            return { ...prev, hp: newHp, shield: newShield };
        });

        setEnemyCardDisplay(null);
        await delay(800);

        // เช็ค Game Over ใน Loop
        if (isGameOver) break; 
    }

    // 3. จบเทิร์น
    setBattleState(curr => {
        if (curr.hp[0] <= 0 && curr.hp[1] <= 0) {
            setPhase('GAME_OVER');
        } else {
            setPhase('PLAYER_RESTOCK');
            setLog("จบเทิร์น! เลือกเก็บการ์ด 1 ใบ");
        }
        return curr;
    });

  }, [setBattleState, setPhase, setLog, addFloatingText, triggerShake, processTurnStatuses]);

  return {
    enemyCardDisplay,
    startEnemyTurn
  };
}