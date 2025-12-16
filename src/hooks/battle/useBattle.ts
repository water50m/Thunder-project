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
import { executeEffects } from '@/utils/effectExecutor'; // ✅ Import ตัว Executor ใหม่

// Card
import { AVAILABLE_CARDS } from '@/data/cards'


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
        name: c.name,
        role: c.role,
        
        maxHp: c.stats.hp,
        maxUlt: c.stats.maxUltimate || 100,

        // Dynamic Stats
        currentHp: c.stats.hp,
        shield: 0,
        currentUlt: 0,
        statuses: [],
        isDead: false
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


    // --- 2. สร้างข้อมูลฝั่ง Enemies (BattleUnit) ---
    const newEnemies: BattleUnit[] = [
        { 
            id: 'boss', name: 'Demon King', role: 'Boss',
            maxHp: 1000, currentHp: 1000, maxUlt: 100,
            shield: 0, statuses: [], currentUlt: 0, isDead: false 
        },
        { 
            id: 'minion1', name: 'Slime', role: 'Minion',
            maxHp: 200, currentHp: 200, maxUlt: 50,
            shield: 0, statuses: [], currentUlt: 0, isDead: false 
        }
    ];


    // --- 3. จัดการ Deck (Card Logic) ---
    const safeDeckIds = Array.isArray(initialDeckIds) ? initialDeckIds : [];
    let deckObjects = [];

    if (safeDeckIds.length > 0) {
        // Map IDs -> Card Objects
        deckObjects = safeDeckIds.map((id, index) => {
            // หาการ์ดต้นฉบับ
            const found = CARD_POOL.find(c => c.id === id) || AVAILABLE_CARDS.find(c => c.id === id);
            
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
    setLog(`${actor.name} ใช้ ${card.name}`);

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
    const minionIndex = nextEnemies.findIndex(e => e.name !== 'Boss' && !e.isDead); // หา Minion ที่ไม่ตาย
    
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
    nextActor.ultCharge = calculateUltCharge(nextActor.ultCharge, nextActor.maxUltimate, chargeAmt);
    nextPlayers[actorIdx] = nextActor; // Save กลับ

    // --- APPLY EFFECTS ---
    
    // 1. Damage Logic ⚔️
    if (result.damage > 0) {
        // ดึงตัวเป้าหมายมาแก้
        const target = { ...getUnit(targetSide, targetIndex) };
        
        const res = calculateDamage(target.hp, target.shield, result.damage);
        const dmgDealt = result.damage - (target.shield - res.shield);
        
        target.hp = res.hp;
        target.shield = res.shield;
        if (target.hp === 0) target.isDead = true;

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
        healee.hp = Math.min(healee.maxHp, healee.hp + result.heal);
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
    const allEnemiesDead = nextEnemies.every(e => e.isDead || e.hp <= 0);

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
  const handleUltimate = async (charId: number) => {
    if (phase !== 'PLAYER_THINKING') return;
    const charIndex = team.findIndex(c => c.id === charId);
    const char = team[charIndex];
    if (!char || !char.ultimate) return;
    
    // Check cost
    if (battleState.ult[charIndex] < (char.stats.maxUltimate || 100)) return;

    setPhase('PLAYER_EXECUTING'); 
    setLog(`⚡ ${char.name} ใช้ท่าไม้ตาย: ${char.ultimate.name}!`);
    
    // Reset Ult Charge ทันที เพื่อ feedback UI
    setBattleState(prev => {
        const newUlt = [...prev.ult]; 
        newUlt[charIndex] = 0; 
        addFloatingText("PLAYER", charIndex, "ULTIMATE!", "BUFF"); 
        return { ...prev, ult: newUlt };
    });
    
    await delay(800); 

    // --- CALCULATION ---
    // ดึง State ล่าสุด ณ ตอนนี้ (หลังจาก reset ult) แต่จริงๆ ใช้ battleState ก็ได้เพราะ ult ไม่เกี่ยวกับ damage
    // แต่เพื่อความชัวร์เรื่อง HP ล่าสุด เรา clone มาใช้
    let nextHp = [...battleState.hp];
    let nextShield = [...battleState.shield];
    let nextStatuses = battleState.statuses.map(arr => [...arr]);

    // เรียก Executor
    const result = executeEffects(char.ultimate!.effects, {
        actorIndex: charIndex,
        team: team,
        hp: nextHp,
        shield: nextShield,
        statuses: nextStatuses,
        bossMaxHp: BOSS_MAX_HP
    });

    // Update Local Variables จาก Result
    nextHp = result.newHp;
    nextShield = result.newShield;
    nextStatuses = result.newStatuses;

    // Show Texts & Shake
    result.textsToAdd.forEach(t => {
    
        const playerCount = battleState.players.length;
        
        if (t.target < playerCount) {
            // ✅ ยังอยู่ในช่วงผู้เล่น (เช่น 0, 1)
            addFloatingText('PLAYER', t.target, t.text, t.type);
        } else {
            // ✅ เกินจำนวนผู้เล่น แปลว่าเป็นศัตรู (เช่น 2, 3)
            // ต้องลบออกด้วย playerCount เพื่อให้เริ่มนับ 0 ใหม่
            addFloatingText('ENEMY', t.target - playerCount, t.text, t.type);
        }
        
    });
    result.shakeTargets.forEach(idx => triggerShake(idx));

    // --- UPDATE STATE ---
    setBattleState(prev => ({ 
        ...prev, 
        hp: nextHp, 
        shield: nextShield, 
        statuses: nextStatuses 
    }));

    await delay(1000); 
    
    // --- CHECK PHASE ---
    // ✅ ใช้ nextHp เช็ค
    const bossDead = nextHp[2] <= 0;
    const minionDead = nextHp[3] === undefined || nextHp[3] <= 0;

    if (bossDead && minionDead) { 
        setPhase('GAME_WON'); 
        const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
        setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` })));
    } else {
        // Ultimate ไม่นับ Action Count ให้กลับมาคิดต่อ
        setPhase('PLAYER_THINKING'); 
    }
  };

  // Helper: เช็คสถานะเกมหลังจากทำ Action
  const checkGameStatus = () => {
    setBattleState(curr => {
        if (curr.hp[2] <= 0 && curr.hp[3] <= 0) { 
            setPhase('GAME_WON'); 
            const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
            setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` })));
            return curr; 
        }
        
        // ถ้าเป็น Ult ให้กลับมา Thinking เหมือนเดิม (ไม่นับ Action Count)
        // หรือถ้าอยากให้นับ Action ก็ใส่ logic เพิ่มตรงนี้
        if (phase === 'PLAYER_EXECUTING' && playerActionCount < 2) { 
           // *ในที่นี้สมมติว่า Ult ไม่นับ Action Count
        }

        // Logic การนับ Action สำหรับการ์ดปกติ
        // (เนื่องจากเราเรียก checkGameStatus ใน handleUltimate ด้วย ต้องระวัง logic ชนกัน)
        // วิธีง่ายสุด: แยก function หรือเช็ค flag. ในที่นี้ขอใช้ logic เดิมของ executePlayerAction
        
        // หมายเหตุ: เพื่อความง่ายในการรวมโค้ด ผมจะเขียน logic นับ turn ไว้ใน executePlayerAction แทน
        // ดังนั้น function นี้ทำหน้าที่แค่เช็คตายกับ set phase กลับ
        return curr;
    });

    // Logic การเปลี่ยน Phase (ต้องอยู่นอก setBattleState เพื่ออ่านค่าล่าสุดได้แม่นยำกว่า หรือใช้ functional update)
    // ตรงนี้ขอใช้แบบ Manual ในแต่ละ Action Function เพื่อความชัวร์
  };


  const skipTurn = () => { 
      setPhase('ENEMY_TURN'); 
      startEnemyTurn();
  };

  const handleRestock = () => {
    const keptCard = hand.find(c => c.id === selectedCardId);
    const nextHand = keptCard ? [keptCard] : [];
    drawCards(5 - nextHand.length, nextHand);
    setPlayerActionCount(0); 
    setSelectedCardId(null); 
    setSelectedCharId(null);
    setPhase('PLAYER_THINKING'); 
    setLog("เริ่มเทิร์นใหม่!");
    
    // Process DOT/HOT Player Side
    processTurnTick((idx, val, type) => {
        addFloatingText(idx, `${val}`, type);
        if (type === 'DOT') triggerShake(idx);
    });
  };

  const cheat = (cmd: string) => {
      if (cmd === 'killboss') { 
          setBattleState(p => ({...p, hp:[p.hp[0], p.hp[1], 0, 0]})); 
          setPhase('GAME_WON'); 
          const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
          setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` }))); 
      }
      if (cmd === 'draw') { drawCards(5, hand); }
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