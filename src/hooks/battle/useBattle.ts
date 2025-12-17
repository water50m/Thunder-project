import { useState } from 'react';
import { useRouter } from 'next/navigation';


// Hooks
import { useBattleState } from '@/hooks/battle/useBattleState';
import { useBattleUI } from '@/hooks/battle/useBattleUI';
import { useCardSystem } from '@/hooks/battle/useCardSystem';
import { useEnemyAI } from '@/hooks/battle/useEnemyAI';

// Data & Types
import { Character } from '@/data/characters';
import { CARD_POOL, Card as CardType } from '@/data/cards';
import { BattleUnit } from '@/types/battles';

// Logic Utils
import { calculateCardBonus, calculateUltCharge, calculateDamage } from '@/utils/battleLogic';
import { calculateCardEffect } from '@/utils/cardLogic';

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


    const bossTemplate = enemyData.find(e => e.role === 'Boss') || enemyData[0];
    const minionTemplate = enemyData.find(e => e.role === 'Minion') || enemyData[0];

    // --- 2. สร้างข้อมูลฝั่ง Enemies (BattleUnit) ---
    const newEnemies: BattleUnit[] = [
        // 1. สร้าง Boss
        { 
            id: 'boss_01', 
            
            // ✅ 1. ยัดข้อมูลต้นฉบับเข้าไปทั้งก้อน (Role, Image, Name อยู่ในนี้หมดแล้ว)
            character: bossTemplate,

            // ✅ 2. ค่า Dynamic ที่ใช้ในการต่อสู้ (ต้องดึงออกมา)
            currentHp: bossTemplate.stats.hp,
            maxHp: bossTemplate.stats.hp,
            currentUlt: 0,
            maxUlt: bossTemplate.stats.maxUltimate,

            shield: 0, 
            statuses: [], 
            isDead: false,
            
            // ❌ ไม่ต้องใส่ atk, def, role แยกแล้ว (เพราะมันอยู่ใน character.stats.atk แล้ว)
        },

        // 2. สร้าง Minion
        { 
            id: 'minion_01',
            
            // ✅ ยัด Character
            character: minionTemplate, 

            // Dynamic Stats
            currentHp: minionTemplate.stats.hp,
            maxHp: minionTemplate.stats.hp,
            currentUlt: 0,
            maxUlt: minionTemplate.stats.maxUltimate,

            shield: 0, 
            statuses: [], 
            isDead: false,
        }
    ];


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
    // 1. Validation
    if (!selectedCardId || !selectedCharId) return;
    const card = hand.find(c => c.id === selectedCardId);
    
    // ✅ หาตัวละครจาก state.players โดยตรง
    const actorIdx = battleState.players.findIndex(c => c.id === selectedCharId);
    if (!card || actorIdx === -1) return;

    // 2. เริ่มทำงาน
    setPhase('PLAYER_EXECUTING');
    const actor = battleState.players[actorIdx]; // ดึง Object Player ตัวจริงมาใช้
    setLog(`${actor.character.name} ใช้ ${card.name}`);

    // --- 3. คำนวณ Logic (ทำงานกับ Local Variable ก่อน) ---
    // ✅ Copy State แบบแยกฝั่ง
    const nextPlayers = [...battleState.players];
    const nextEnemies = [...battleState.enemies];
    
    // Helper สำหรับดึง Target แบบง่าย
    const getUnit = (side: string, idx: number) => side === 'PLAYER' ? nextPlayers[idx] : nextEnemies[idx];

    // --- TARGET SELECTION SYSTEM (สำคัญมาก) 🎯 ---
    let targetSide: 'PLAYER' | 'ENEMY' = 'ENEMY';
    let targetIndex = 0;

    // Logic เลือกเป้าหมาย: ถ้ามี Minion (และไม่ใช่ท่าทะลุ) ให้ตี Minion ตัวแรกก่อน
    // (สมมติ Minion อยู่ Index 1, Boss อยู่ Index 0)
    // หรือถ้า Boss อยู่ Index 0, Minion อยู่ 1 
    const minionIndex = nextEnemies.findIndex(e => e.character.name !== 'Boss' && !e.isDead); // หา Minion ที่ไม่ตาย
    
    if (card.targetType === 'SELF') {
        targetSide = 'PLAYER';
        targetIndex = actorIdx;
    } else if (minionIndex !== -1 && card.effect !== 'Pierce') {
        targetSide = 'ENEMY';
        targetIndex = minionIndex;
    } else {
        targetSide = 'ENEMY';
        targetIndex = 0; // ตี Boss (สมมติ Boss อยู่ตัวแรกเสมอ)
    }

    // เตรียมข้อมูลสำหรับคำนวณ
    const targetUnit = getUnit(targetSide, targetIndex);
    const actorUnit = nextPlayers[actorIdx];
    
    const bonus = calculateCardBonus(actor, card, actorUnit.statuses);

    const result = calculateCardEffect(
        card, actor, 
        actorUnit.shield, 
        targetUnit.shield,
        targetUnit.statuses,
        bonus
    );

    // Charge Ultimate
    const chargeAmt = card.ultimateCharge || 10;
    const nextActor = { ...actorUnit }; // Copy เพื่อแก้ค่า
    nextActor.currentUlt = calculateUltCharge(nextActor.currentUlt, nextActor.maxUlt, chargeAmt);
    nextPlayers[actorIdx] = nextActor; // Save กลับ

    // --- APPLY EFFECTS ---
    
    // 1. Damage Logic ⚔️
    if (result.damage > 0) {
        // ดึงตัวเป้าหมายมาแก้
        const target = { ...getUnit(targetSide, targetIndex) };
        
        const res = calculateDamage(target.currentHp, target.shield, result.damage);
        const dmgDealt = result.damage - (target.shield - res.shield);
        
        target.currentHp = res.hp;
        target.shield = res.shield;
        if (target.currentHp === 0) target.isDead = true;

        // Save Target กลับ Array
        if (targetSide === 'ENEMY') nextEnemies[targetIndex] = target;
        else nextPlayers[targetIndex] = target;

        // UI Feedback
        if (dmgDealt > 0) {
            addFloatingText(targetSide, targetIndex, `${dmgDealt}`, 'DMG');
            triggerShake(targetSide, targetIndex);
        }
        if ((targetUnit.shield - res.shield) > 0) {
            addFloatingText(targetSide, targetIndex, `${targetUnit.shield - res.shield}`, 'BLOCK');
        }
    }

    // 2. Heal Logic 💚
    if (result.heal > 0) {
        const healee = { ...nextPlayers[actorIdx] };
        healee.currentHp = Math.min(healee.maxHp, healee.currentHp + result.heal);
        nextPlayers[actorIdx] = healee;
        
        addFloatingText('PLAYER', actorIdx, `${result.heal}`, 'HEAL');
    }

    // 3. Shield Logic 🛡️
    if (result.shield > 0) {
        const shieldee = { ...nextPlayers[actorIdx] };
        shieldee.shield += result.shield;
        nextPlayers[actorIdx] = shieldee;

        addFloatingText('PLAYER', actorIdx, `${result.shield}`, 'BLOCK');
    }
    
    // 4. Extra Texts & Effects
    // (ตรงนี้ต้องแก้ Logic ใน calculateCardEffect ให้ส่ง side มาด้วย ถ้าทำได้)
    // หรือใช้ Logic ง่ายๆ ว่าถ้าเป็น Debuff ลงศัตรู ถ้า Buff ลงตัวเอง
    
    result.effectsToAdd.forEach(e => {
        // Logic ง่ายๆ: ถ้า Debuff ให้ลงที่ Target, ถ้า Buff ให้ลงที่ Actor
        // (ในอนาคตควรแก้ e ให้มี field 'targetSide' มาด้วย)
        const isBuff = e.status.type === 'BUFF' || e.status.type === 'HOT';
        
        if (isBuff) {
            const p = { ...nextPlayers[actorIdx] };
            p.statuses.push(e.status);
            nextPlayers[actorIdx] = p;
        } else {
            // Debuff ใส่เป้าหมายที่เราตี
            if (targetSide === 'ENEMY') {
                const en = { ...nextEnemies[targetIndex] };
                en.statuses.push(e.status);
                nextEnemies[targetIndex] = en;
            }
        }
    });

    if (result.shouldExplodeShield) {
        const p = { ...nextPlayers[actorIdx] };
        p.shield = 0;
        nextPlayers[actorIdx] = p;
    }

    // --- 4. UPDATE STATE (ทีเดียวจบ) ---
    setBattleState(prev => ({
        ...prev,
        players: nextPlayers,
        enemies: nextEnemies
    }));

    // Cleanup Hand
    removeCardFromHand(selectedCardId);
    setSelectedCardId(null);
    
    await delay(600);

    // --- 5. CHECK PHASE (Win Condition) ---
    // เช็คว่าศัตรูตายหมดหรือยัง
    const allEnemiesDead = nextEnemies.every(e => e.isDead || e.currentHp <= 0);
    if (allEnemiesDead) {
        setPhase('GAME_WON');
        const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
        setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` })));
    } else {
        const nextCount = playerActionCount + 1;
        setPlayerActionCount(nextCount);

        if (nextCount >= 2) { // ครบ 2 Action เปลี่ยนเทิร์น
            setPhase('ENEMY_TURN');
            setTimeout(() => {
                 // ส่ง State ล่าสุดที่เพิ่งแก้เสร็จไปให้ AI
                 const newState = { players: nextPlayers, enemies: nextEnemies }; 
                 startEnemyTurn(); 
            }, 100);
        } else {
            setPhase('PLAYER_THINKING');
        }
    }
};

  // Action 2: ใช้ Ultimate
// Action 2: ใช้ Ultimate ⚡
  const handleUltimate = async (charId: number) => {
    // 1. Validation & Setup
    if (phase !== 'PLAYER_THINKING') return;

    const charIndex = battleState.players.findIndex(p => p.id === charId);
    if (charIndex === -1) return;

    const playerUnit = battleState.players[charIndex];
    const ultInfo = playerUnit.character.ultimate;

    // เช็คว่ามีท่าไม้ตาย และเกจเต็มไหม
    if (!ultInfo) return;
    if (playerUnit.currentUlt < playerUnit.maxUlt) return;

    // 2. เริ่ม Effect UI
    setPhase('PLAYER_EXECUTING');
    setLog(`⚡ ${playerUnit.character.name} ใช้ท่าไม้ตาย: ${ultInfo.name}!`);

    // 3. Reset Ult Gauge (Visual update ทันที)
    setBattleState(prev => {
        const newPlayers = [...prev.players];
        newPlayers[charIndex] = { ...newPlayers[charIndex], currentUlt: 0 };
        return { ...prev, players: newPlayers };
    });
    
    addFloatingText("PLAYER", charIndex, "ULTIMATE!", "BUFF");
    await delay(800); // รอ animation นิดหน่อย

    // ---------------------------------------------------------
    // 4. 🔥 สร้าง Mock Card (หัวใจสำคัญของการ Refactor นี้)
    // ---------------------------------------------------------
    const mockUltCard: CardType = {
        id: `ult-${playerUnit.id}-${Date.now()}`,
        name: ultInfo.name,
        description: ultInfo.description || "Ultimate Skill",
        type: 'Special', // หรือ 'Attack'
        
        // 🎯 กำหนดเป้าหมาย (ส่วนใหญ่ Ult มักจะหมู่ หรือคุณจะเช็คจาก ultInfo ก็ได้)
        targetType: 'ALL_ENEMIES', 
        
        cost: 0,
        // ความแรง: ดึงจาก stats ของท่าไม้ตาย หรือใช้สูตรคำนวณ
        value: playerUnit.character.stats.power || 50, 
        
        icon: '⚡',
        ultimateCharge: 0,
        effect: 'AoE' // ใส่ Effect ที่เหมาะสม (เช่น AoE, ApplyDot)
    };

    // ---------------------------------------------------------
    // 5. ⚔️ คำนวณ Damage และ Update State
    // ---------------------------------------------------------
    setBattleState(prev => {
        // Copy Enemies มาแก้ไข
        const newEnemies = prev.enemies.map(e => ({ ...e }));
        
        // หาเป้าหมาย (ในที่นี้สมมติว่าเป็นท่าหมู่ คือศัตรูทุกคนที่ยังไม่ตาย)
        // ถ้าอนาคตมีท่าเดี่ยว ให้เขียน logic เลือกเป้าหมายตรงนี้
        const targets = newEnemies.filter(e => !e.isDead && e.currentHp > 0);

        targets.forEach((targetUnit, idxInArray) => { // idxInArray คือ index จริงใน array enemies
             // A. คำนวณ Effect (ดาเมจดิบ)
             const effectResult = calculateCardEffect(
                mockUltCard,
                playerUnit,     // ผู้ใช้ท่า (Player)
                playerUnit.shield,
                targetUnit.shield,
                targetUnit.statuses
            );

            // B. หักลบเกราะ (Damage สุทธิ)
            const dmgResult = calculateDamage(
                targetUnit.currentHp,
                targetUnit.shield,
                effectResult.damage
            );

            // C. Update ค่าลงใน Unit
            const oldShield = targetUnit.shield;
            targetUnit.currentHp = dmgResult.hp;
            targetUnit.shield = dmgResult.shield;
            targetUnit.isDead = targetUnit.currentHp <= 0;

            // D. Visuals (Floating Text & Shake)
            // ต้องหา index จริงของศัตรูใน state เพื่อแสดงผลให้ถูกตัว
            const realEnemyIndex = prev.enemies.findIndex(e => e.id === targetUnit.id);
            
            const damageDealt = effectResult.damage - (oldShield - dmgResult.shield);

            if (damageDealt > 0) {
                addFloatingText("ENEMY", realEnemyIndex, `${damageDealt}`, 'DMG');
                triggerShake("ENEMY", realEnemyIndex);
            } else if ((oldShield - dmgResult.shield) > 0) {
                addFloatingText("ENEMY", realEnemyIndex, 'Block', 'BLOCK');
            }

            // แสดง Effect Text อื่นๆ
            effectResult.textsToAdd.forEach(t => 
                addFloatingText("ENEMY", realEnemyIndex, t.text, t.type as any)
            );
        });

        return { ...prev, enemies: newEnemies };
    });

    await delay(1000);

    // ---------------------------------------------------------
    // 6. Check End Game / Phase
    // ---------------------------------------------------------
    // เช็คจาก State ล่าสุด (ต้องดึงผ่าน setBattleState callback หรือเช็คแบบ manual)
    setBattleState(curr => {
        const allEnemiesDead = curr.enemies.every(e => e.isDead || e.currentHp <= 0);

        if (allEnemiesDead) {
            setPhase('GAME_WON');
            // Logic สุ่มของรางวัล
            const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random());
            setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` })));
        } else {
            // ใช้ Ult เสร็จแล้ว ยังไม่จบเทิร์น กลับไปให้ผู้เล่นคิดต่อ
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