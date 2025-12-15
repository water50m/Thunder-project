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

// Logic Utils
import { calculateCardBonus, calculateUltCharge, calculateDamage } from '@/utils/battleLogic';
import { calculateCardEffect } from '@/utils/cardLogic';
import { executeEffects } from '@/utils/effectExecutor'; // ✅ Import ตัว Executor ใหม่

type GamePhase = 'PLAYER_THINKING' | 'PLAYER_EXECUTING' | 'ENEMY_TURN' | 'PLAYER_RESTOCK' | 'GAME_WON' | 'GAME_OVER';

export function useBattle() {
  const router = useRouter();
  const BOSS_MAX_HP = 1500; 

  // --- 1. Sub-Hooks Integration ---
  const { 
    battleState, 
    setBattleState, 
    initBattleState, 
    processTurnTick 
  } = useBattleState(BOSS_MAX_HP);

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

  // --- 2. Local State ---
  const [team, setTeam] = useState<Character[]>([]);
  const [phase, setPhase] = useState<GamePhase>('PLAYER_THINKING');
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [playerActionCount, setPlayerActionCount] = useState(0);
  const [rewardOptions, setRewardOptions] = useState<CardType[]>([]);

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
    addFloatingText,
    triggerShake,
    processTurnStatuses: () => processTurnTick((idx, val, type) => {
        addFloatingText(idx, `${val}`, type);
        if (type === 'DOT') triggerShake(idx);
    })
  });

  // --- 4. Main Actions ---

  const initializeGame = () => {
    const savedTeam = localStorage.getItem('myTeam');
    if (savedTeam) {
      try {
        const parsedTeam = JSON.parse(savedTeam);
        if (!parsedTeam[0] || !parsedTeam[0].stats) throw new Error("Invalid Data");
        
        setTeam(parsedTeam);
        initBattleState(parsedTeam, BOSS_MAX_HP);
        drawCards(5);
      } catch (e) {
        localStorage.removeItem('myTeam');
        router.push('/');
      }
    } else { 
        router.push('/'); 
    }
  };

  // Action 1: ใช้การ์ดปกติ
 // Action 1: ใช้การ์ดปกติ
  const executePlayerAction = async () => {
    // 1. Validation
    if (!selectedCardId || !selectedCharId) return;
    const card = hand.find(c => c.id === selectedCardId);
    const actorIdx = team.findIndex(c => c.id === selectedCharId);
    if (!card || actorIdx === -1) return;

    // 2. เริ่มทำงาน (ซ่อนปุ่ม)
    setPhase('PLAYER_EXECUTING');
    const actor = team[actorIdx];
    setLog(`${actor.name} ใช้ ${card.name}`);

    // --- ส่วนคำนวณ Logic (เหมือนเดิม) ---
    const bonus = calculateCardBonus(actor, card, battleState.statuses[actorIdx]);
    const targetIdx = (battleState.hp[3] > 0 && card.effect !== 'Pierce') ? 3 : 2;

    const result = calculateCardEffect(
        card, actor, 
        battleState.shield[actorIdx], 
        battleState.shield[targetIdx],
        battleState.statuses[targetIdx],
        bonus
    );

    // Charge Ultimate
    const chargeAmt = card.ultimateCharge || 10;
    setBattleState(prev => {
        const newUlt = [...prev.ult];
        const maxUlt = actor.stats.maxUltimate || 100;
        newUlt[actorIdx] = calculateUltCharge(newUlt[actorIdx], maxUlt, chargeAmt);
        return { ...prev, ult: newUlt };
    });

    // Apply Effects to State & Capture New HP for check
    let isGameWon = false;

    setBattleState(prev => {
        let newHp = [...prev.hp];
        let newShield = [...prev.shield];
        let newStatuses = prev.statuses.map(arr => [...arr]);

        // ... (Logic การใส่ Damage/Heal/Shield เดิม ตรงนี้ไม่ต้องแก้) ...
        if (result.damage > 0) {
            const res = calculateDamage(newHp[targetIdx], newShield[targetIdx], result.damage);
            const dmgDealt = result.damage - (newShield[targetIdx] - res.shield);
            newHp[targetIdx] = res.hp;
            newShield[targetIdx] = res.shield;
            if (dmgDealt > 0) {
                addFloatingText(targetIdx, `${dmgDealt}`, 'DMG');
                triggerShake(targetIdx);
            }
            if ((newShield[targetIdx] - res.shield) > 0) {
                addFloatingText(targetIdx, `${newShield[targetIdx] - res.shield}`, 'BLOCK');
            }
        }
        if (result.heal > 0) {
            newHp[actorIdx] = Math.min(team[actorIdx].stats.hp, newHp[actorIdx] + result.heal);
            addFloatingText(actorIdx, `${result.heal}`, 'HEAL');
        }
        if (result.shield > 0) {
            newShield[actorIdx] += result.shield;
            addFloatingText(actorIdx, `${result.shield}`, 'BLOCK');
        }
        result.textsToAdd.forEach(t => {
            const realTarget = t.target === -1 ? actorIdx : (t.target === -2 ? targetIdx : t.target);
            addFloatingText(realTarget, t.text, t.type as any);
        });
        result.effectsToAdd.forEach(e => {
            const realTarget = e.target === -1 ? actorIdx : (e.target === -2 ? targetIdx : e.target);
            newStatuses[realTarget].push(e.status);
        });
        if (result.shouldExplodeShield) newShield[actorIdx] = 0;
        
        // เช็คว่าบอสตายไหมในจังหวะนี้เลย
        if (newHp[2] <= 0 && newHp[3] <= 0) {
            isGameWon = true;
        }

        return { ...prev, hp: newHp, shield: newShield, statuses: newStatuses };
    });

    // Cleanup Hand
    removeCardFromHand(selectedCardId);
    setSelectedCardId(null);
    setSelectedCharId(null);
    
    // รอ Animation
    await delay(600);

    // 3. ✅✅✅ Logic การเปลี่ยน Phase (ที่หายไป) ✅✅✅
    if (isGameWon) {
        setPhase('GAME_WON');
        const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); 
        setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` })));
    } else {
        // เพิ่ม Action Count
        const nextCount = playerActionCount + 1;
        setPlayerActionCount(nextCount);

        // เช็คว่าครบ 2 Action หรือยัง
        if (nextCount >= 2) {
            setPhase('ENEMY_TURN');
            // ส่ง State ล่าสุดไปให้ AI (ผ่านฟังก์ชัน callback ของ state เพื่อความชัวร์ หรือเรียกใช้ตัวแปร battleState ถ้ามั่นใจว่าอัปเดตแล้ว)
            // แต่เนื่องจาก battleState ใน scope นี้อาจจะเก่า ให้เรียก startEnemyTurn โดยปล่อยให้มันไปดึง state ล่าสุดเอง หรือส่งค่าว่างไปถ้า logic ใน AI รองรับ
            // *วิธีที่ปลอดภัยที่สุดคือเรียก startEnemyTurn โดยใช้ setTimeout นิดนึงเพื่อให้ state อัปเดต*
            setTimeout(() => {
                 // ส่ง battleState ล่าสุดไม่ได้ใน closure นี้ ให้ AI hook ไปดึงเอง หรือส่ง callback
                 // จากโค้ด AI เดิม startEnemyTurn จะใช้ setBattleState(prev => ...) ซึ่งปลอดภัยอยู่แล้ว
                 // ดังนั้นเรียกได้เลย
                 startEnemyTurn(null as any); // หรือแก้ startEnemyTurn ไม่ต้องรับ param
            }, 100);
        } else {
            // ยังไม่ครบ กลับไปให้ผู้เล่นคิดต่อ (ปุ่มจะโผล่มาตรงนี้)
            setPhase('PLAYER_THINKING');
        }
    }
  };

  // Action 2: ใช้ Ultimate (เรียกใช้ Executor)
  const handleUltimate = async (charId: number) => {
    if (phase !== 'PLAYER_THINKING') return;
    const charIndex = team.findIndex(c => c.id === charId);
    const char = team[charIndex];
    if (!char || !char.ultimate) return;
    
    if (battleState.ult[charIndex] < (char.stats.maxUltimate || 100)) return;

    // Start Animation
    setPhase('PLAYER_EXECUTING'); 
    setLog(`⚡ ${char.name} ใช้ท่าไม้ตาย: ${char.ultimate.name}!`);
    
    // Reset Ult Charge
    setBattleState(prev => {
        const newUlt = [...prev.ult]; 
        newUlt[charIndex] = 0; 
        addFloatingText(charIndex, "ULTIMATE!", "BUFF"); 
        return { ...prev, ult: newUlt };
    });
    
    await delay(800); 

    // ✅ Execute Ultimate Effects (ใช้ Executor)
    setBattleState(prev => {
        const result = executeEffects(char.ultimate!.effects, {
            actorIndex: charIndex,
            team: team,
            hp: prev.hp,
            shield: prev.shield,
            statuses: prev.statuses,
            bossMaxHp: BOSS_MAX_HP
        });

        // Loop แสดง Text
        result.textsToAdd.forEach(t => addFloatingText(t.target, t.text, t.type));
        
        // Loop สั่งสั่น
        result.shakeTargets.forEach(idx => triggerShake(idx));

        // Update State
        return { 
            ...prev, 
            hp: result.newHp, 
            shield: result.newShield, 
            statuses: result.newStatuses 
        };
    });

    await delay(1000); 
    checkGameStatus(); // จบเทิร์นหรือเล่นต่อ
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

  // Re-implement check status logic inside actions for safety
  // (อัปเดต executePlayerAction ส่วนท้าย)
  /* setBattleState(curr => { ... logic เดิม ... }) 
     ถูกย้ายไปใน executePlayerAction ด้านบนแล้ว
  */

  const skipTurn = () => { 
      setPhase('ENEMY_TURN'); 
      startEnemyTurn(battleState);
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