import { useState, useCallback } from 'react';
import { Card as CardType } from '@/data/cards';
import { calculateDamage } from '@/utils/battleLogic'; 
import { calculateCardEffect } from '@/utils/cardLogic';
import { FloatingTextType } from '@/data/typesEffect';
import { BattleState } from '@/types/battles';
import { enemyData } from '@/data/enemys';
import { DEMON_KING_CARDS } from '@/data/cards'; // ✅ 1. Import การ์ดบอสมาใช้

// (ลบ EnemyMove, EnemyActionType ทิ้งได้เลย เพราะเราใช้ CardType แล้ว)

interface UseEnemyAIProps {
  setBattleState: React.Dispatch<React.SetStateAction<BattleState>>;
  setPhase: (phase: any) => void;
  setLog: (msg: string) => void;
  addFloatingText: (side: 'PLAYER' | 'ENEMY', index: number, text: string, type: FloatingTextType) => void;
  triggerShake: (side: 'PLAYER' | 'ENEMY', index: number) => void;
  processTurnStatuses: () => void; 
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
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // ✅ ฟังก์ชันช่วยเลือกเป้าหมาย (แปลง targetType เป็น Index ของผู้เล่น)
    const getTargetIndices = (card: CardType, players: any[]): number[] => {
        const aliveIndices = players.map((p, i) => p.currentHp > 0 ? i : -1).filter(i => i !== -1);
        
        if (aliveIndices.length === 0) return [];

        if (card.targetType === 'ALL_ENEMIES') {
            return aliveIndices; // คืนค่าทุกคนที่รอด
        } 
        else if (card.targetType === 'SINGLE_ENEMY') {
            // สุ่มโจมตี 1 คนจากคนที่รอด
            const rand = Math.floor(Math.random() * aliveIndices.length);
            return [aliveIndices[rand]];
        }
        // กรณีอื่นๆ (เช่น SELF) อาจจะต้องจัดการแยก
        return [aliveIndices[0]]; 
    };

    // --- The Execution ---
    const startEnemyTurn = useCallback(async () => {
        setLog("Demon King's Turn...");
        await delay(1000);
        processTurnStatuses(); 
        
        const ACTION_COUNT = 2; // บอสขยับ 2 ที
        
        for (let i = 0; i < ACTION_COUNT; i++) {
            // -----------------------------------------------------------
            // ✅ 1. เลือกการ์ดจาก List (แทน decideEnemyAction)
            // -----------------------------------------------------------
            const randIdx = Math.floor(Math.random() * DEMON_KING_CARDS.length);
            const selectedCard = DEMON_KING_CARDS[randIdx];

            // แสดงการ์ดที่บอสใช้
            setEnemyCardDisplay(selectedCard);
            setLog(`บอสใช้ท่า: ${selectedCard.name}`);
            await delay(1500);

            // -----------------------------------------------------------
            // ✅ 2. คำนวณ Damage และอัปเดต State
            // -----------------------------------------------------------
            setBattleState((prev) => {
                const newPlayers = prev.players.map(p => ({ ...p }));

                // เช็คว่าจบเกมหรือยัง
                const anyAlive = newPlayers.some(p => p.currentHp > 0);
                if (!anyAlive) return prev;

                const actorUnit = prev.enemies.find(e => e.character.role === 'Boss') || prev.enemies[0];

                // หาเป้าหมายที่จะโดนโจมตี
                const targetIndices = getTargetIndices(selectedCard, newPlayers);

                // วนลูปโจมตีใส่เป้าหมายทั้งหมดที่เลือกมา
                targetIndices.forEach(targetIdx => {
                    const targetUnit = newPlayers[targetIdx];
                    if (!targetUnit || targetUnit.currentHp <= 0) return;

                    // A. คำนวณ Effect (ใช้ฟังก์ชันกลาง)
                    const effectResult = calculateCardEffect(
                        selectedCard,
                        actorUnit,       // ✅ แก้ตรงนี้: ส่ง BattleUnit
                        actorUnit.shield,
                        targetUnit.shield,       
                        targetUnit.statuses      
                    );

                    // B. หักลบเกราะ (ใช้ฟังก์ชันกลาง)
                    const dmgResult = calculateDamage(
                        targetUnit.currentHp,    
                        targetUnit.shield,       
                        effectResult.damage // ใช้ damage ที่คำนวณมา
                    );

                    // C. Update ค่าลงใน Unit
                    const oldShield = targetUnit.shield;
                    targetUnit.currentHp = dmgResult.hp;       
                    targetUnit.shield = dmgResult.shield;      
                    targetUnit.isDead = targetUnit.currentHp <= 0;

                    // D. Visuals
                    const damageDealt = effectResult.damage - (oldShield - dmgResult.shield);

                    if (damageDealt > 0) {
                        addFloatingText("PLAYER", targetIdx, `${damageDealt}`, 'DMG');
                        triggerShake("PLAYER", targetIdx);
                    } else if ((oldShield - dmgResult.shield) > 0) {
                        addFloatingText("PLAYER", targetIdx, 'Block', 'BLOCK');
                    }
                    
                    // แสดง Text Effect (Buff/Debuff/Stun)
                    effectResult.textsToAdd.forEach(t => 
                        addFloatingText("PLAYER", targetIdx, t.text, t.type as FloatingTextType)
                    );
                    
                    // (ตรงนี้คุณอาจจะต้องเพิ่ม logic เพื่อ push effectResult.effectsToAdd ลงใน statuses ของผู้เล่นด้วย)
                });

                return { ...prev, players: newPlayers };
            });

            setEnemyCardDisplay(null);
            await delay(800);
            
            // เช็คจบเกมระหว่าง Action
            // (ถ้าอยากให้ละเอียด ต้องเช็ค state ล่าสุดจริงๆ แต่ตรงนี้พอถูไถได้)
        }

        // 3. จบเทิร์น
        setBattleState((curr: BattleState) => {
            const allDead = curr.players.every(p => p.currentHp <= 0);
            if (allDead) {
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