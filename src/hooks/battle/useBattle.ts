import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { processAction } from '@/hooks/battle/battleActionSystem'; 

// Hooks
import { useBattleState } from '@/hooks/battle/useBattleState';
import { useBattleUI } from '@/hooks/battle/useBattleUI';
import { useCardSystem } from '@/hooks/battle/useCardSystem';
import { useEnemyAI } from '@/hooks/battle/useEnemyAI';

// Data & Types
import { Character } from '@/data/characters';
import { CARD_POOL, Card as CardType } from '@/data/cards';
import { BattleUnit } from '@/types/battles';
import { Card } from '@/data/cards'

// Logic Utils
import { calculateCardBonus, calculateUltCharge, calculateDamage } from '@/utils/battleLogic';
import { calculateCardEffect } from '@/utils/cardLogic';
import { resolveTargets } from '@/utils/targetResolver'

// Card
import { AVAILABLE_CARDS_PLAYER } from '@/data/cards'

import { enemyData } from '@/data/enemys'
type GamePhase = 'PLAYER_THINKING' | 'PLAYER_EXECUTING' | 'ENEMY_TURN' | 'PLAYER_RESTOCK' | 'GAME_WON' | 'GAME_OVER';

export function useBattle() {
    // --- 2. Local State ---
  const [team, setTeam] = useState<Character[]>([]);
  const [phase, setPhase] = useState<GamePhase>('PLAYER_THINKING');
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [playerActionCount, setPlayerActionCount] = useState(0);
  const [rewardOptions, setRewardOptions] = useState<CardType[]>([]);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  
  const router = useRouter();
  const BOSS_MAX_HP = 1500; 

  // --- 1. Sub-Hooks Integration ---
  const { 
    battleState, 
    setBattleState, 
    processTurnTick 
  } = useBattleState(team);

  const { 
    floatingTexts, 
    shaking, 
    log, 
    setLog, 
    addFloatingText, 
    triggerShake, 
    
    handleFloatingTextComplete 
  } = useBattleUI();

  const { 
    hand, 
    setHand, 
    selectedCardId, 
    setSelectedCardId, 
    drawCards, 
    removeCardFromHand, 
    
    selectCard: baseSelectCard 
  } = useCardSystem();



  // --- 3. Helpers ---
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const selectCard = (id: string) => {
      baseSelectCard(id, phase); 
  };
  
  const selectChar = (id: number) => { 
    if (phase === 'PLAYER_THINKING') setSelectedCharId(id === selectedCharId ? null : id); 
  };

  // Setup AI
const { enemyCardDisplay, startEnemyTurn } = useEnemyAI({
    setBattleState,
    setPhase: (p) => setPhase(p as GamePhase),
    setLog,
    
    // ✅ ส่งฟังก์ชันตัวใหม่ (ที่รับ side, index) เข้าไป
    addFloatingText,
    triggerShake,

    // ✅ แก้ Callback ตรงนี้: ไม่ต้องคำนวณ uiIndex แล้ว ส่งต่อได้เลย
    processTurnStatuses: () => processTurnTick((side, index, val, type) => {
        
        // 1. ส่งค่า side และ index ไปให้ UI ตรงๆ
        addFloatingText(side, index, `${val}`, type);
        
        // 2. ถ้าเป็น DOT ก็สั่งสั่นตาม side และ index
        if (type === 'DOT') {
            triggerShake(side, index);
        }
    })
});

  // --- 4. Main Actions ---

// 2. แก้ไขบรรทัดรับค่า (ใส่ Default parameter ไว้ด้วยกัน Error)
const initializeGame = (characterData: Character[], initialDeckIds: string[] = []) => { 
    
    // --- 1. สร้างข้อมูลฝั่ง Players (BattleUnit) ---
    // (แปลงจาก Character Data ให้เป็น BattleUnit สำหรับต่อสู้)
    const newPlayers: BattleUnit[] = characterData.map(c => ({
        id: c.id,
        
        // ✅ ยัดข้อมูลต้นฉบับเข้าไปทั้งก้อน (แทนที่จะแตก atk, def, role ออกมา)
        character: c, 

        // Dynamic Stats (ดึงจาก c.stats มาใช้เป็นค่าเริ่มต้น)
        currentHp: c.stats.hp,
        maxHp: c.stats.hp,      // ควรมี maxHp ที่ชั้นนี้ด้วยเพื่อความสะดวก
        maxUlt: c.stats.maxUltimate || 100,
        
        shield: 0,
        currentUlt: 0,
        statuses: [],
        isDead: false,
        
        // ❌ ไม่ต้องมี atk, def, role, name, image ตรงนี้แล้ว 
        // เพราะมันอยู่ใน 'character' หมดแล้ว
    }));

    // กรณีไม่มีข้อมูลส่งมา (Fallback Mock Data)
    if (newPlayers.length === 0) {
        newPlayers.push({
             id: 999, name: "Test Player", role: "Warrior", maxHp: 100, maxUlt: 100,
             currentHp: 100, shield: 0, currentUlt: 0, statuses: [], isDead: false
        } as any);
    }
    
    // อัปเดต UI ทีม (ถ้าแยก State กัน)
    setTeam(characterData);


        const templates = [
            enemyData.find(e => e.role === 'Minion' ) || enemyData[0],
            enemyData.find(e => e.role === 'Boss' ) || enemyData[0]
        ];

        // 2. แปลง Template เป็น BattleUnit ด้วย .map() (Factory Pattern)
        const newEnemies: BattleUnit[] = templates.map((tmpl, index) => ({
            // Auto Gen ID: เช่น boss_0, minion_1
            id: `${tmpl.role.toLowerCase()}_${index}`, 
            
            character: tmpl,
            
            // Dynamic Stats
            currentHp: tmpl.stats.hp,
            maxHp: tmpl.stats.hp,
            currentUlt: 0,
            maxUlt: tmpl.stats.maxUltimate,
            
            // Default Values
            shield: 0, 
            statuses: [], 
            isDead: false
        }));
    


    // --- 3. จัดการ Deck (Card Logic) ---
    const safeDeckIds = Array.isArray(initialDeckIds) ? initialDeckIds : [];
    let deckObjects = [];

    if (safeDeckIds.length > 0) {
        // Map IDs -> Card Objects
        deckObjects = safeDeckIds.map((id, index) => {
            // หาการ์ดต้นฉบับ
            const found = CARD_POOL.find(c => c.id === id) || AVAILABLE_CARDS_PLAYER.find(c => c.id === id);
            
            if (found) {
                return { 
                    ...found, 
                    // Generate Unique ID
                    id: `${found.id}-${index}-${Date.now()}` 
                };
            }
            
            // Fallback case
            return { 
                ...CARD_POOL[0], 
                id: `fallback-${index}-${Math.random()}` 
            };
        });
    } else {
        // Fallback Default Deck
        deckObjects = [
            { ...CARD_POOL[0] }, { ...CARD_POOL[0] }, 
            { ...CARD_POOL[1] }, { ...CARD_POOL[1] }, 
            { ...CARD_POOL[2] }
        ].map((c, i) => ({ ...c, id: `${c.id}-${i}-${Date.now()}` })); // อย่าลืม unique id ให้ default deck ด้วย
    }

    // 4. Shuffle & Draw
    const shuffledDeck = [...deckObjects].sort(() => Math.random() - 0.5);
    const initialHand = shuffledDeck.splice(0, 5);

    // 5. Update Card States
    setDeck(shuffledDeck); 
    setHand(initialHand);  
    setDiscardPile([]);    

    // --- 6. ✅ Update Battle State (โครงสร้างใหม่) ---
    // ใช้ newPlayers และ newEnemies ที่สร้างไว้ข้างบน ใส่เข้าไปเลย
    setBattleState({
        players: newPlayers,
        enemies: newEnemies
    });
    
    // 7. Reset Turn Phase
    setPhase('PLAYER_THINKING');
    setPlayerActionCount(0);
    setLog("Battle Start!");
  };

// Action 1: ใช้การ์ดปกติ
const executePlayerAction = async () => {
    // ------------------------------------------------
    // 1. Validation & Setup (เหมือนเดิม)
    // ------------------------------------------------
    if (!selectedCardId || !selectedCharId) return;
    
    const card = hand.find(c => c.id === selectedCardId);
    const actorIdx = battleState.players.findIndex(c => c.id === selectedCharId); // หา Index คนร่าย

    if (!card || actorIdx === -1) return;

    // UI Feedback
    setPhase('PLAYER_EXECUTING');
    setLog(`${battleState.players[actorIdx].character.name} ใช้ ${card.name}`);

    // ------------------------------------------------
    // 2. เรียกใช้ Process Action (พระเอกของเรา) 🔥
    // ------------------------------------------------
    setBattleState(prev => {
        // ส่งทุกอย่างให้ processAction จัดการ
        const { nextPlayers, nextEnemies } = processAction(
            card,
            actorIdx,
            prev.players,
            prev.enemies,
            { addFloatingText, triggerShake } // ส่ง UI Function เข้าไป
        );

        // ------------------------------------------------
        // 3. จัดการ "ค่าใช้จ่าย" ของ Player (Ult Charge / Mana)
        // (ส่วนนี้อยู่นอก processAction เพราะเป็นเรื่องของ Player Management)
        // ------------------------------------------------
        
        // A. เพิ่มเกจไม้ตาย (Ult Charge)
        // ทำตรงนี้ เพื่อให้ได้ Charge แค่ครั้งเดียว (ไม่คูณตามจำนวนเป้าหมาย)
        const chargeAmt = card.ultimateCharge || 10;
        const finalActor = { ...nextPlayers[actorIdx] };
        
        // ใช้สูตรคำนวณ Ult (ถ้ามี function แยก) หรือบวกตรงๆ
        // finalActor.currentUlt = Math.min(finalActor.maxUlt, finalActor.currentUlt + chargeAmt);
        if (typeof calculateUltCharge === 'function') {
             finalActor.currentUlt = calculateUltCharge(finalActor.currentUlt, finalActor.maxUlt, chargeAmt);
        } else {
             finalActor.currentUlt = Math.min(finalActor.maxUlt, finalActor.currentUlt + chargeAmt);
        }

        nextPlayers[actorIdx] = finalActor;

        // B. Return State ใหม่กลับไป
        return {
            ...prev,
            players: nextPlayers,
            enemies: nextEnemies
        };
    });

    // ------------------------------------------------
    // 4. Cleanup & Phase Control (เหมือนเดิม)
    // ------------------------------------------------
    removeCardFromHand(selectedCardId);
    setSelectedCardId(null);
    
    await delay(600); // รอ Animation

    // เช็คเงื่อนไขจบเกม
    // (ดึงค่าล่าสุดมาเช็ค ไม่ใช่ battleState เก่า)
    setBattleState(curr => {
        const allEnemiesDead = curr.enemies.every(e => e.isDead || e.currentHp <= 0);

        if (allEnemiesDead) {
            setPhase('GAME_WON');
            // ... Logic สร้างของรางวัล ...
        } else {
            // นับ Action และเปลี่ยนเทิร์น
            const nextCount = playerActionCount + 1;
            setPlayerActionCount(nextCount);

            if (nextCount >= 2) { 
                setPhase('ENEMY_TURN');
                setTimeout(() => startEnemyTurn(), 100);
            } else {
                setPhase('PLAYER_THINKING');
            }
        }
        return curr; // คืนค่าเดิม (แค่แอบมาเช็ค)
    });
};



// Action 2: ใช้ Ultimate ⚡
const handleUltimate = async (charId: number) => {
    console.log("🔥 1. กดปุ่ม Ulti แล้ว!");
    // ---------------------------------------------------------
    // 1. Validation & Setup (เหมือนเดิม)
    // ---------------------------------------------------------
    if (phase !== 'PLAYER_THINKING') return;
    const charIndex = battleState.players.findIndex(p => p.id === charId);
    if (charIndex === -1) return;

    const playerUnit = battleState.players[charIndex];
    
    // ดึงข้อมูลท่าไม้ตาย
    const ultInfo = playerUnit.character.ultimate;
    
    // เช็คตัวละครนี้มีท่าไม้ตายไหม? ถ้าไม่มีให้จบการทำงาน
    if (!ultInfo) return;
    // เช็คเกจเต็มหรือยัง? (ถ้า current น้อยกว่า max ให้จบการทำงาน)
    if (playerUnit.currentUlt < playerUnit.maxUlt) return;
    // ---------------------------------------------------------
    // 2. UI & Reset Gauge (เหมือนเดิม)
    // ---------------------------------------------------------
    setPhase('PLAYER_EXECUTING');
    setLog(`⚡ ${playerUnit.character.name} ใช้ท่าไม้ตาย!`);
    
    // Reset Ult Gauge
    setBattleState(prev => {
        const newPlayers = [...prev.players];
        newPlayers[charIndex] = { ...newPlayers[charIndex], currentUlt: 0 };

        return { ...prev, players: newPlayers };
    });
    
    await delay(800);

    // ---------------------------------------------------------
    // 3. 🔥 สร้าง Mock Card (เหมือนเดิม)
    // ---------------------------------------------------------
    const playerUltimate = playerUnit.character.ultimate;
    const mockUltCards:  Card[] = playerUltimate.effects.map((effectItem, index) => ({
        id: `ult-${Date.now()}`,
        name: playerUltimate.name,
        type: 'Special',
        value: effectItem.value,
        cost: 0,
        description: playerUltimate.description,
        icon: effectItem.icon,
        effect: effectItem.effect,
        ultimateCharge: 0,
        duration: effectItem.duration,
        targetType: effectItem.target
        }));


    // ---------------------------------------------------------
    // 4. ⚔️ เรียกใช้ processAction (ส่วนที่แก้ใหม่) 🛠️
    // ---------------------------------------------------------
    setBattleState(prev => {
        // 1. สร้างตัวแปรชั่วคราว เพื่อเก็บ State ล่าสุดในขณะวนลูป
        let tempPlayers = [...prev.players];
        let tempEnemies = [...prev.enemies];
        // เรียกใช้ Logic กลาง (ไม่ต้องเขียน loop เองแล้ว!)
        
        // 2. วนลูปการ์ดทุกใบใน Array
        mockUltCards.forEach((card, index) => {
            
            // เรียก Logic กลาง (ส่ง temp state เข้าไป)
            const result = processAction(
                card,
                charIndex,
                tempPlayers, // 👈 ใช้ state ล่าสุด (ที่ถูกแก้จากรอบก่อนหน้า)
                tempEnemies, // 👈 ใช้ state ล่าสุด
                {
                    addFloatingText,
                    triggerShake
                }
            );

            // 3. อัปเดตตัวแปรชั่วคราว เตรียมไว้ให้รอบถัดไปใช้
            tempPlayers = result.nextPlayers;
            tempEnemies = result.nextEnemies;
        });
        console.log("Enemy HP Before:", prev.enemies[0].currentHp);
        console.log("Enemy HP After:", tempEnemies[0].currentHp);
        // คืนค่า State ใหม่กลับไป
        return {
            ...prev,
            players: tempPlayers,
            enemies: tempEnemies
        };
    });

    await delay(1000);

    // ---------------------------------------------------------
    // 5. Check End Game (เหมือนเดิม)
    // ---------------------------------------------------------
    setBattleState(curr => {
        const allEnemiesDead = curr.enemies.every(e => e.isDead || e.currentHp <= 0);
        if (allEnemiesDead) {
            setPhase('GAME_WON');
            // ... logic ของรางวัล ...
        } else {
            setPhase('PLAYER_THINKING');
        }
        return curr;
    });
  };

  const skipTurn = () => { 
      setPhase('ENEMY_TURN'); 
      startEnemyTurn();
  };

  const handleRestock = () => {
        const keptCard = hand.find(c => c.id === selectedCardId);
        const nextHand = keptCard ? [keptCard] : [];
        
        // จั่วการ์ดใหม่
        drawCards(5 - nextHand.length, nextHand);
        
        // Reset ค่าต่างๆ
        setPlayerActionCount(0); 
        setSelectedCardId(null); 
        setSelectedCharId(null);
        setPhase('PLAYER_THINKING'); 
        setLog("เริ่มเทิร์นใหม่!");
        
        // Process DOT/HOT Player Side
        // ⚠️ ต้องเช็คว่า processTurnTick ของคุณ ส่งค่ามาเรียงแบบไหน?
        // สมมติว่าเรียงเป็น: (index, value, type)
        processTurnTick((side, idx, val, type) => {
            
            // ✅ แก้ไข 1: เพิ่ม 'PLAYER' เป็นตัวแรก
            addFloatingText(side, idx, `${val}`, type);
            
            // ✅ แก้ไข 2: เพิ่ม 'PLAYER' เป็นตัวแรก
            if (type === 'DOT') {
                triggerShake(side, idx);
            }
        });
    };

const cheat = (cmd: string) => {
      if (cmd === 'killboss') { 
          setBattleState(prev => {
              // ✅ แก้ไข: สร้าง enemies ใหม่ที่ HP = 0 และ isDead = true
              const deadEnemies = prev.enemies.map(e => ({
                  ...e,
                  currentHp: 0,
                  isDead: true
              }));

              return { ...prev, enemies: deadEnemies };
          }); 

          setPhase('GAME_WON'); 
          
          // Logic สุ่มของรางวัลเหมือนเดิม
          const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
          setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` }))); 
      }

      if (cmd === 'draw') { 
          // ถ้า drawCards ของคุณรองรับ logic นี้อยู่แล้วก็ใช้ได้เลย
          // หรือถ้าต้องแก้ อาจจะต้องเช็คว่า drawCards รับ parameter อะไรบ้าง
          drawCards(5, hand); 
      }
      if (cmd === 'fullult') { // หรือจะใช้ 'maxult' ก็ได้
          setBattleState(prev => {
              // ✅ วนลูป Player ทุกคนแล้วปรับเกจ Ult ให้เต็ม Max
              const poweredUpPlayers = prev.players.map(p => ({
                  ...p,
                  currentUlt: p.maxUlt // ปรับค่าปัจจุบันเท่ากับค่าสูงสุด
              }));

              return { ...prev, players: poweredUpPlayers };
          });
          
          setLog('⚡ Cheat Activated: พลังเต็มเปี่ยม!'); // แจ้งเตือนนิดหน่อย
      }
      if (cmd === 'help') {
          setLog("📜 คำสั่งที่ใช้ได้: killboss, fullult, draw");
          return;
      }
  };

  return {
    // State
    team, 
    battleState, 
    bossMaxHp: BOSS_MAX_HP, // ✅ Export
    hand, 
    phase, 
    log, 
    enemyCardDisplay, 
    rewardOptions, 
    selectedCharId, 
    selectedCardId, 
    playerActionCount,
    
    // UI State (จาก Sub-Hook)
    shaking,          // ✅ Export
    floatingTexts,    // ✅ Export

    // Functions
    initializeGame, 
    handleFloatingTextComplete, 
    selectChar, 
    selectCard,
    executePlayerAction, 
    skipTurn, 
    handleUltimate, 
    handleRestock, 
    cheat
  };
}