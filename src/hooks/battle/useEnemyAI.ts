import { useState, useCallback } from 'react';
import { Card as CardType } from '@/data/cards';
import { calculateDamage } from '@/utils/battleLogic'; 
import { calculateCardEffect } from '@/utils/cardLogic'; // ✅ Import
import { BattleEntityState } from './useBattleState';
import { FloatingTextType, FloatingTextData } from '@/data/typesEffect';
import { Character } from '@/data/characters'; // ✅ Import Character Type
import { BattleState, BattleUnit } from '@/types/battles';

// ... (Interface เดิม UseEnemyAIProps เก็บไว้เหมือนเดิม) ...
type EnemyActionType = 'FRONT_SINGLE' | 'PIERCE' | 'BACK_SNIPE' | 'AOE';

interface EnemyMove {
  name: string;
  damage: number;
  type: EnemyActionType;
  description: string;
}

interface UseEnemyAIProps {
  setBattleState: React.Dispatch<React.SetStateAction<BattleState>>;
  setPhase: (phase: any) => void; // แนะนำให้เปลี่ยน any เป็น GamePhase ถ้าทำได้
  setLog: (msg: string) => void;
  
  // ✅ อันนี้ถูกแล้ว (รับ side, index, text, type)
  addFloatingText: (side: 'PLAYER' | 'ENEMY', index: number, text: string, type: FloatingTextType) => void;
  
  // ⚠️ แก้ตรงนี้: เพิ่ม side เข้าไปให้เหมือน addFloatingText
  triggerShake: (side: 'PLAYER' | 'ENEMY', index: number) => void;
  
  // ⚠️ เช็คชื่อฟังก์ชันว่าตรงกับที่ส่งมาไหม (processTurnTick หรือ processTurnStatuses)
  processTurnStatuses: () => void; 
}

// ✅ 1. สร้าง Mock ข้อมูลบอส (เพื่อให้มี Stats ATK ไปคำนวณ)
const BOSS_ACTOR: Character = {
    id: 999,
    name: "Boss",
    role: "Boss",
    description: "The Big Bad",
    avatar: "👿",
    color: "red",
    equipedSkillCard: [],
    stats: {
        hp: 9999, 
        atk: 15,  // Base ATK ของบอส (จะไปบวกกับ Damage ท่า)
        def: 10,
        cri: 0,
        power: 0,
        maxUltimate: 100
    },
  ultimate: {
      name: "Boss Ultimate",
      description: "Devastating Attack",
      effects: []
  }
};

export function useEnemyAI({
    setBattleState,
    setPhase,
    setLog,
    addFloatingText,
    triggerShake,
    processTurnStatuses
}: UseEnemyAIProps) {
    
    const [enemyCardDisplay, setEnemyCardDisplay] = useState<CardType | null>(null);
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // --- 1. The Brain ---
    const decideEnemyAction = (): EnemyMove => {
        const rand = Math.random();
        if (rand < 0.4) {
             return { name: "Dark Slash", damage: 30, type: 'FRONT_SINGLE', description: "โจมตีปกติ" };
        } else if (rand < 0.7) {
             // Damage ท่านี้อาจจะเบาหน่อย เพราะมันทะลุโดน 2 ตัว
             return { name: "Piercing Spear", damage: 20, type: 'PIERCE', description: "เจาะทะลุแนวหลัง" };
        } else {
             return { name: "Shadow Snipe", damage: 45, type: 'BACK_SNIPE', description: "ลอบสังหาร" };
        }
    };

    // --- 2. The Execution ---
    const startEnemyTurn = useCallback(async () => {
        setLog("Enemy Turn...");
        await delay(1000);
        processTurnStatuses(); // คำนวณ DOT/HOT
        
        const ACTION_COUNT = 2;
        
        for (let i = 0; i < ACTION_COUNT; i++) {
            let isGameOver = false;
            const move = decideEnemyAction();
            
            // 2.1 สร้าง Mock Card (Map Effect ให้ถูกต้อง)
            const mockEnemyCard: CardType = { 
                id: `e-act-${i}`, 
                name: move.name, 
                type: "Attack", 
                value: move.damage, 
                cost: 0, 
                description: move.description, 
                icon: "👿", 
                ultimateCharge: 0,
                // Map Effect: ถ้าเป็นท่า Pierce ให้ใส่ effect เพื่อให้ logic คำนวณถูก
                effect: move.type === 'PIERCE' ? 'Pierce' : undefined 
            };

            setEnemyCardDisplay(mockEnemyCard);
            setLog(`บอสใช้: ${move.name}`);
            await delay(1500);

            // 2.2 คำนวณ Damage และอัปเดต State
            setBattleState((prev) => {
                // 1. สร้างสำเนาของ Players (Deep Copy เพื่อไม่ให้กระทบ State เดิมโดยตรง)
                const newPlayers = prev.players.map(p => ({ ...p }));

                // เช็คว่าใครรอดบ้าง (ใช้ currentHp แทน array hp เดิม)
                const frontAlive = newPlayers[0] && newPlayers[0].currentHp > 0;
                const backAlive = newPlayers[1] && newPlayers[1].currentHp > 0;

                // ถ้าตายหมด ไม่ต้องทำอะไร (รอจบเกม)
                if (!frontAlive && !backAlive) {
                    // isGameOver = true; // (แนะนำให้จัดการที่ useEffect หรือส่วนเช็ค Phase แทน)
                    return prev;
                }

                // ✅ ฟังก์ชันโจมตีที่ปรับปรุงแล้ว
                const executeAttack = (targetIdx: number, card: CardType, damageMultiplier: number = 1) => {
                    const targetUnit = newPlayers[targetIdx];

                    // ถ้าไม่มีตัวนี้ หรือตายแล้ว ให้ข้าม
                    if (!targetUnit || targetUnit.currentHp <= 0) return;

                    // A. คำนวณผลลัพธ์ (ดึงค่าจาก Unit โดยตรง)
                    const effectResult = calculateCardEffect(
                        card,
                        BOSS_ACTOR,
                        999,
                        targetUnit.shield,       // ใช้ shield จาก unit
                        targetUnit.statuses      // ใช้ statuses จาก unit
                    );

                    // ปรับดาเมจตามตัวคูณ
                    const finalDamage = Math.floor(effectResult.damage * damageMultiplier);

                    // B. หักลบเกราะ
                    const dmgResult = calculateDamage(
                        targetUnit.currentHp,    // ใช้ hp จาก unit
                        targetUnit.shield,       // ใช้ shield จาก unit
                        finalDamage
                    );

                    // C. Update ค่าลงใน Unit ใหม่
                    const oldShield = targetUnit.shield;
                    targetUnit.currentHp = dmgResult.hp;       // อัปเดต HP
                    targetUnit.shield = dmgResult.shield;      // อัปเดต Shield
                    targetUnit.isDead = targetUnit.currentHp <= 0; // อัปเดตสถานะตาย

                    // D. Visuals (Floating Text & Shake)
                    const damageDealt = finalDamage - (oldShield - dmgResult.shield);

                    if (damageDealt > 0) {
                        // ✅ ใส่ "PLAYER" นำหน้า
                        addFloatingText("PLAYER", targetIdx, `${damageDealt}`, 'DMG');
                        
                        // ✅ ใส่ "PLAYER" นำหน้า
                        triggerShake("PLAYER", targetIdx);

                        // แสดง Text พิเศษ (ถ้ามี)
                        effectResult.textsToAdd.forEach(t => 
                            // ✅ ใส่ "PLAYER" นำหน้า
                            addFloatingText("PLAYER", targetIdx, t.text, t.type as FloatingTextType)
                        );

                    } else if ((oldShield - dmgResult.shield) > 0) {
                        // ✅ ใส่ "PLAYER" นำหน้า
                        addFloatingText("PLAYER", targetIdx, 'Block', 'BLOCK');
                    }
                };

                // ✅ Routing Actions (Logic เดิม แต่เรียก executeAttack ตัวใหม่)
                if (move.type === 'FRONT_SINGLE') {
                    executeAttack(frontAlive ? 0 : 1, mockEnemyCard);
                } 
                else if (move.type === 'BACK_SNIPE') {
                    executeAttack(backAlive ? 1 : 0, mockEnemyCard);
                } 
                else if (move.type === 'PIERCE') {
                    // 1. ตีตัวหน้าเต็มๆ
                    executeAttack(frontAlive ? 0 : 1, mockEnemyCard, 1.0);
                    
                    // 2. ถ้าตัวหน้าอยู่และมีตัวหลัง -> แทงทะลุไปโดนตัวหลัง 50%
                    if (frontAlive && backAlive) {
                        executeAttack(1, mockEnemyCard, 0.5);
                    }
                }

                // Return State ใหม่ (เปลี่ยนแค่ players)
                return { ...prev, players: newPlayers };
            });

            setEnemyCardDisplay(null);
            await delay(800);
            if (isGameOver) break; 
        }

        // 3. จบเทิร์น
        setBattleState((curr: BattleState) => {
            // เช็คว่าผู้เล่นตายหมดหรือยัง
            const p1Dead = curr.players[0].currentHp <= 0;
            // ถ้ามีตัวที่ 2 ให้เช็คด้วย, ถ้าไม่มีถือว่าตาย (true)
            const p2Dead = !curr.players[1] || curr.players[1].currentHp <= 0; 

            if (p1Dead && p2Dead) {
                setPhase('GAME_OVER');
            } else {
                setPhase('PLAYER_RESTOCK');
                setLog("จบเทิร์น! เลือกเก็บการ์ด 1 ใบ");
            }
            return curr;
        });

    }, [setBattleState, setPhase, setLog, addFloatingText, triggerShake, processTurnStatuses]);

    return { enemyCardDisplay, startEnemyTurn };
}