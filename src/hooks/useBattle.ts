// src/hooks/useBattle.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/data/characters';
import { CARD_POOL, Card as CardType } from '@/data/cards';
import { ActiveStatus, EffectConfig, FloatingTextData, FloatingTextType } from '@/data/typesEffect';
import { calculateDamage, calculateCardBonus, calculateUltCharge } from '@/utils/battleLogic';

type GamePhase = 'PLAYER_THINKING' | 'PLAYER_EXECUTING' | 'ENEMY_TURN' | 'PLAYER_RESTOCK' | 'GAME_WON' | 'GAME_OVER';

type BattleState = { 
  hp: number[]; 
  shield: number[]; 
  ult: number[];
  statuses: ActiveStatus[][]; 
  floatingTexts: FloatingTextData[][];
  shaking: boolean[]; // ✅ เพิ่ม State Shaking (เก็บเป็น Array [T, F, F, T])
};

export function useBattle() {
  const router = useRouter();
  
  const [team, setTeam] = useState<Character[]>([]);
  // Init Shaking เป็น [false, false, false, false]
  const [battleState, setBattleState] = useState<BattleState>({ 
      hp: [], shield: [], ult: [], statuses: [[], [], [], []], floatingTexts: [[], [], [], []], shaking: [false, false, false, false]
  });
  const [bossMaxHp, setBossMaxHp] = useState(1500);
  const [hand, setHand] = useState<CardType[]>([]);
  const [phase, setPhase] = useState<GamePhase>('PLAYER_THINKING');
  const [playerActionCount, setPlayerActionCount] = useState(0);
  const [log, setLog] = useState<string>("เริ่มเกม! เลือกตัวละคร + เลือกการ์ด");
  const [enemyCardDisplay, setEnemyCardDisplay] = useState<CardType | null>(null);
  const [rewardOptions, setRewardOptions] = useState<CardType[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // --- Helpers ---
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const addFloatingText = (textsArr: FloatingTextData[][], targetIdx: number, text: string, type: FloatingTextType) => {
      textsArr[targetIdx].push({ id: `ft-${Date.now()}-${Math.random()}`, text, type });
  };

  const drawCards = (count: number, currentHand: CardType[] = []) => {
    const newCards: CardType[] = [];
    for (let i = 0; i < count; i++) {
      const proto = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      newCards.push({ ...proto, id: `${proto.id}-${Date.now()}-${i}` });
    }
    setHand([...currentHand, ...newCards]);
  };

  // ✅ Auto Reset Shaking: เมื่อมีการสั่นเกิดขึ้น ให้ตั้งเวลาลบออกใน 400ms
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    battleState.shaking.forEach((isShaking, idx) => {
        if (isShaking) {
            const timer = setTimeout(() => {
                setBattleState(prev => {
                    const newShaking = [...prev.shaking];
                    newShaking[idx] = false;
                    return { ...prev, shaking: newShaking };
                });
            }, 400); // 0.4s ตรงกับ CSS Animation
            timers.push(timer);
        }
    });
    return () => timers.forEach(clearTimeout);
  }, [battleState.shaking]);

  // --- Actions ---
  const initializeGame = () => {
    const savedTeam = localStorage.getItem('myTeam');
    if (savedTeam) {
      const parsedTeam = JSON.parse(savedTeam);
      if (!parsedTeam[0].ultimate) { localStorage.removeItem('myTeam'); router.push('/game'); return; }
      setTeam(parsedTeam);
      setBattleState({
        hp: [parsedTeam[0].stats.hp, parsedTeam[1].stats.hp, 1500, 300],
        shield: [0, 0, 0, 0],
        ult: [0, 0, 0, 0],
        statuses: [[], [], [], []],
        floatingTexts: [[], [], [], []],
        shaking: [false, false, false, false]
      });
      setBossMaxHp(1500);
      drawCards(5);
    } else { router.push('/game'); }
  };

  const handleFloatingTextComplete = useCallback((targetIdx: number, textId: string) => {
      setBattleState(prev => {
        const newTexts = prev.floatingTexts.map(arr => [...arr]);
        newTexts[targetIdx] = newTexts[targetIdx].filter(t => t.id !== textId);
        return { ...prev, floatingTexts: newTexts };
      });
  }, []);

  const selectChar = (id: number) => { if (phase === 'PLAYER_THINKING') setSelectedCharId(id === selectedCharId ? null : id); };
  const selectCard = (id: string) => { if (phase === 'PLAYER_THINKING' || phase === 'PLAYER_RESTOCK') setSelectedCardId(id === selectedCardId ? null : id); };

  // --- Logic ---
  const applyEffect = (effect: EffectConfig, sourceIndex: number) => {
    setBattleState(prev => {
        let newHp = [...prev.hp]; let newShield = [...prev.shield]; let newShaking = [...prev.shaking];
        let newStatuses = prev.statuses.map(arr => [...arr]); let newTexts = prev.floatingTexts.map(arr => [...arr]);

        const applyToTarget = (targetIdx: number) => {
             if (effect.duration === 0) {
                 if (effect.type === 'INSTANT_DMG') {
                     const oldShield = newShield[targetIdx];
                     const res = calculateDamage(newHp[targetIdx], newShield[targetIdx], effect.value);
                     newHp[targetIdx] = res.hp; newShield[targetIdx] = res.shield;
                     
                     // Text & Shake
                     if (oldShield > res.shield) addFloatingText(newTexts, targetIdx, `${oldShield - res.shield}`, 'BLOCK');
                     const hpDmg = effect.value - (oldShield - res.shield);
                     if (hpDmg > 0) {
                         addFloatingText(newTexts, targetIdx, `${hpDmg}`, 'DMG');
                         newShaking[targetIdx] = true; // ✅ Trigger Shake (Ultimate DMG)
                     }
                 } else if (effect.type === 'INSTANT_HEAL') {
                     const maxHp = targetIdx < 2 ? team[targetIdx].stats.hp : (targetIdx === 2 ? bossMaxHp : 300);
                     const healAmt = Math.min(maxHp - newHp[targetIdx], effect.value);
                     newHp[targetIdx] += healAmt;
                     if (healAmt > 0) addFloatingText(newTexts, targetIdx, `${healAmt}`, 'HEAL');
                 } else if (effect.type === 'DEFEND_UP') {
                     newShield[targetIdx] += effect.value;
                     addFloatingText(newTexts, targetIdx, `${effect.value}`, 'BLOCK');
                 }
             } else {
                 newStatuses[targetIdx].push({ id: `${effect.type}-${Date.now()}-${Math.random()}`, type: effect.type, value: effect.value, duration: effect.duration, icon: effect.icon || '✨' });
                 addFloatingText(newTexts, targetIdx, effect.type === 'DOT' ? 'Poison!' : 'Buff!', effect.type === 'DOT' ? 'DOT' : 'BUFF');
             }
        };
        if (effect.target === 'SELF') applyToTarget(sourceIndex);
        else if (effect.target === 'TEAM_ALL') { applyToTarget(0); applyToTarget(1); }
        else if (effect.target === 'ENEMY_SINGLE') { if (newHp[3] > 0) applyToTarget(3); else applyToTarget(2); }
        else if (effect.target === 'ENEMY_ALL') { if(newHp[3] > 0) applyToTarget(3); applyToTarget(2); }
        return { ...prev, hp: newHp, shield: newShield, statuses: newStatuses, floatingTexts: newTexts, shaking: newShaking };
    });
  };

  const processTurnStatuses = () => {
      setBattleState(prev => {
          let newHp = [...prev.hp]; let newShaking = [...prev.shaking];
          let newTexts = prev.floatingTexts.map(arr => [...arr]);
          let newStatuses = prev.statuses.map((charStatus, idx) => {
              const active: ActiveStatus[] = [];
              charStatus.forEach(s => {
                  if (s.type === 'DOT') {
                      newHp[idx] = Math.max(0, newHp[idx] - s.value);
                      addFloatingText(newTexts, idx, `${s.value}`, 'DOT');
                      newShaking[idx] = true; // ✅ Trigger Shake (DOT Damage)
                  } else if (s.type === 'HOT') { newHp[idx] += s.value; addFloatingText(newTexts, idx, `${s.value}`, 'HEAL'); }
                  if (s.duration > 1) active.push({ ...s, duration: s.duration - 1 });
              });
              return active;
          });
          return { ...prev, hp: newHp, statuses: newStatuses, floatingTexts: newTexts, shaking: newShaking };
      });
  };

  // --- Public Actions ---
  const executePlayerAction = async () => {
    if (!selectedCardId || !selectedCharId) return;
    const card = hand.find(c => c.id === selectedCardId);
    const actorIndex = team.findIndex(c => c.id === selectedCharId);
    const actor = team[actorIndex];
    if (!card || !actor) return;

    setPhase('PLAYER_EXECUTING');
    const bonus = calculateCardBonus(actor, card, battleState.statuses[actorIndex]);
    const finalValue = card.value + bonus;
    const chargeAmt = card.ultimateCharge || 10;
    setLog(`${actor.name} ใช้ ${card.name} (Value: ${finalValue})`);

    setBattleState(prev => {
        const newUlt = [...prev.ult]; 
        const maxUlt = actor.stats.maxUltimate || 100;
        newUlt[actorIndex] = calculateUltCharge(newUlt[actorIndex], maxUlt, chargeAmt);
        
        let newHp = [...prev.hp]; 
        let newShield = [...prev.shield]; 
        let newShaking = [...prev.shaking];
        let newTexts = prev.floatingTexts.map(arr => [...arr]);

        let newStatuses = prev.statuses.map(arr => [...arr]);

        if (card.type === 'Attack') {
             const target = (newHp[3] > 0 && card.effect !== 'Pierce') ? 3 : 2;
             const oldShield = newShield[target];
             
             // 🔥🔥 LOGIC ใหม่สำหรับ Ironclad (แทรกตรงนี้) 🔥🔥
             let calculatedDmg = finalValue; 
             if (card.id === 'blaze-1') {
                 // คำนวณ Dmg (100% Atk หรือตาม Base Card)
                 const burnDmg = actor.stats.atk; // เอา ATK ผู้ใช้เพียวๆ ตามโจทย์
                 
                 // ยัด Status DOT
                 newStatuses[target].push({
                     id: `burn-${Date.now()}`,
                     type: 'DOT',
                     value: burnDmg,
                     duration: 10, // ⏳ 10 เทิร์น!
                     icon: '🔥'
                 });
                 
                 addFloatingText(newTexts, target, "Burning (10t)!", "BUFF");
                 // การ์ดนี้อาจจะไม่มี Dmg ทันที (หรือมีนิดหน่อยตาม calculatedDmg)
             }

             if (card.effect === 'BurnDetonate') {
                 // ดึง Status ของเป้าหมายมาเช็ค
                 const targetStatus = newStatuses[target];
                 let totalExplodeDmg = 0;

                 // วนลูปหา DOT ทั้งหมด
                 targetStatus.forEach(s => {
                     if (s.type === 'DOT') {
                         // สูตร: Damage ต่อเทิร์น * เทิร์นที่เหลือ
                         const stackDmg = s.value * s.duration;
                         totalExplodeDmg += stackDmg;
                     }
                 });

                 calculatedDmg = totalExplodeDmg;
                 addFloatingText(newTexts, target, `Combustion! (${totalExplodeDmg})`, "BUFF");
                 
                 // (Optional: จะลบ Burn ออกไหมหลังระเบิด? ถ้าตามหลักเกมทั่วไปคือลบ แต่ถ้าตามโจทย์ไม่ได้บอกก็ปล่อยไว้)
                 // newStatuses[target] = targetStatus.filter(s => s.type !== 'DOT'); 
             }

             // 1. Shield Bash: (ATK + Shield ที่มี)
             if (card.effect === 'ShieldBased') {
                 const currentShield = newShield[actorIndex];
                 calculatedDmg = actor.stats.atk + currentShield;
                 addFloatingText(newTexts, actorIndex, "Shield Bash!", "BUFF");
             } 
             
             // 2. Shield Explosion: (ระเบิดเกราะ -> Dmg 300% ของเกราะ)
             if (card.effect === 'ShieldExplode') {
                 const currentShield = newShield[actorIndex];
                 calculatedDmg = currentShield * 3;
                 newShield[actorIndex] = 0; // เกราะหายหมด
                 addFloatingText(newTexts, actorIndex, "Shield Explode!", "BUFF");
             }

             // คำนวณดาเมจใส่ศัตรู
             const res = calculateDamage(newHp[target], newShield[target], calculatedDmg);
             newHp[target] = res.hp; 
             newShield[target] = res.shield;
             
             if (oldShield > res.shield) addFloatingText(newTexts, target, `${oldShield - res.shield}`, 'BLOCK');
             
             // ใช้ calculatedDmg แทน finalValue
             if (calculatedDmg > (oldShield - res.shield)) {
                 const hpDmg = calculatedDmg - (oldShield - res.shield);
                 addFloatingText(newTexts, target, `${hpDmg}`, 'DMG');
                 newShaking[target] = true; 
             }

             if (card.effect === 'Drain') {
                const healAmt = Math.floor(calculatedDmg * 0.5); 
                newHp[actorIndex] += healAmt;
                addFloatingText(newTexts, actorIndex, `${healAmt}`, 'HEAL');
             }
        } else if (card.type === 'Heal') {
             if (card.effect === 'AoE') { 
                newHp[0]+=finalValue; newHp[1]+=finalValue; 
                addFloatingText(newTexts, 0, `${finalValue}`, 'HEAL'); 
                addFloatingText(newTexts, 1, `${finalValue}`, 'HEAL');
             } else { 
                newHp[actorIndex] += finalValue; 
                addFloatingText(newTexts, actorIndex, `${finalValue}`, 'HEAL'); 
             }
        } else { // Defend
             newShield[actorIndex] += finalValue; 
             addFloatingText(newTexts, actorIndex, `${finalValue}`, 'BLOCK'); 
        }
        return { ...prev, hp: newHp.map(h=>Math.max(0,h)), shield: newShield, ult: newUlt, floatingTexts: newTexts, shaking: newShaking };
    });

    setHand(prev => prev.filter(c => c.id !== selectedCardId)); setSelectedCardId(null); setSelectedCharId(null);
    await delay(600);

    setBattleState(curr => {
        if (curr.hp[2] <= 0 && curr.hp[3] <= 0) { setPhase('GAME_WON'); const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` }))); return curr; }
        const newCount = playerActionCount + 1; setPlayerActionCount(newCount);
        if (newCount >= 2) { setPhase('ENEMY_TURN'); startEnemyTurn(); } else { setPhase('PLAYER_THINKING'); }
        return curr;
    });
  };

  const startEnemyTurn = async () => {
    setLog("Enemy Turn..."); await delay(1000); processTurnStatuses(); 
    for (let i = 1; i <= 2; i++) {
        const randType = Math.random();
        let enemyCardName = "Boss Attack";
        if(randType < 0.4) enemyCardName = "Dark Slash (หน้า)"; else if(randType < 0.7) enemyCardName = "Piercing Spear (ทะลุ)"; else enemyCardName = "Shadow Snipe (หลัง)";
        const mockEnemyCard: CardType = { id: 'e-atk', name: enemyCardName, type: "Attack", value: 40, cost: 0, description: "โจมตี!", icon: "👿", ultimateCharge: 0 };
        setEnemyCardDisplay(mockEnemyCard); setLog(`บอสใช้: ${enemyCardName}`); await delay(1500); 
        
        // Enemy Attack Logic
        setBattleState(prev => {
            let newHp = [...prev.hp]; let newShield = [...prev.shield]; let newShaking = [...prev.shaking];
            let newTexts = prev.floatingTexts.map(arr => [...arr]);
            const frontIdx = newHp[0] > 0 ? 0 : 1; const backIdx = 1;
            const applyDmg = (idx: number, dmg: number) => {
               if (newHp[idx] <= 0) return;
               const oldShield = newShield[idx];
               const res = calculateDamage(newHp[idx], newShield[idx], dmg);
               newHp[idx] = res.hp; newShield[idx] = res.shield;
               if (oldShield > res.shield) addFloatingText(newTexts, idx, `${oldShield - res.shield}`, 'BLOCK');
               
               const hpDmg = dmg - (oldShield - res.shield);
               if (hpDmg > 0) {
                   addFloatingText(newTexts, idx, `${hpDmg}`, 'DMG');
                   newShaking[idx] = true; // ✅ Trigger Shake (Enemy Attack)
               }
            };
            if (randType < 0.4) applyDmg(frontIdx, 40); else if (randType < 0.7) { applyDmg(frontIdx, 30); applyDmg(backIdx, 15); } else { if(newHp[backIdx] > 0) applyDmg(backIdx, 50); else applyDmg(frontIdx, 50); }
            return { ...prev, hp: newHp.map(h=>Math.max(0,h)), shield: newShield, floatingTexts: newTexts, shaking: newShaking };
        });
        setEnemyCardDisplay(null); await delay(800);
        
        let lost = false;
        setBattleState(curr => { if(curr.hp[0] <= 0 && curr.hp[1] <= 0) { setPhase('GAME_OVER'); lost=true; } return curr; });
        if(lost) return;
    }
    setPhase('PLAYER_RESTOCK'); setLog("จบเทิร์น! เลือกเก็บการ์ด 1 ใบ");
  };

  const handleUltimate = async (charId: number) => {
    if (phase !== 'PLAYER_THINKING') return;
    const charIndex = team.findIndex(c => c.id === charId);
    const char = team[charIndex];
    if (!char || !char.ultimate) return; 
    setPhase('PLAYER_EXECUTING'); setLog(`⚡ ${char.name} ใช้ท่าไม้ตาย: ${char.ultimate.name}!`);
    setBattleState(prev => { 
        const newUlt = [...prev.ult]; const newTexts = prev.floatingTexts.map(arr => [...arr]); 
        newUlt[charIndex] = 0; addFloatingText(newTexts, charIndex, "ULTIMATE!", "BUFF"); return { ...prev, ult: newUlt, floatingTexts: newTexts }; 
    });
    await delay(800); char.ultimate.effects.forEach(effect => applyEffect(effect, charIndex)); await delay(1000);
    setBattleState(curr => { if (curr.hp[2] <= 0 && curr.hp[3] <= 0) { setPhase('GAME_WON'); const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` }))); } else { setPhase('PLAYER_THINKING'); } return curr; });
  };

  const handleRestock = () => {
    const keptCard = hand.find(c => c.id === selectedCardId);
    const nextHand = keptCard ? [keptCard] : [];
    drawCards(5 - nextHand.length, nextHand);
    setPlayerActionCount(0); setSelectedCardId(null); setSelectedCharId(null);
    processTurnStatuses(); setPhase('PLAYER_THINKING'); setLog("เริ่มเทิร์นใหม่!");
  };

  const skipTurn = () => { setPhase('ENEMY_TURN'); startEnemyTurn(); };

  // Cheat
  const cheat = (cmd: string) => {
      if (cmd === 'killboss') { setBattleState(p => ({...p, hp:[p.hp[0], p.hp[1], 0, 0]})); setPhase('GAME_WON'); const shuffled = [...CARD_POOL].sort(() => 0.5 - Math.random()); setRewardOptions(shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `reward-${Date.now()}-${i}` }))); }
      if (cmd === 'killme') { setBattleState(p => ({...p, hp:[0, 0, p.hp[2], p.hp[3]]})); setPhase('GAME_OVER'); }
      if (cmd === 'heal') { setBattleState(p => ({...p, hp:[team[0].stats.hp, team[1].stats.hp, p.hp[2], p.hp[3]]})); }
      if (cmd === 'draw') { drawCards(5, hand); }
  };

  return {
    team, battleState, bossMaxHp, hand, phase, log, enemyCardDisplay, rewardOptions,
    selectedCharId, selectedCardId, playerActionCount,
    initializeGame, handleFloatingTextComplete, selectChar, selectCard,
    executePlayerAction, skipTurn, handleUltimate, handleRestock, cheat
  };
}