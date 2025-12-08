'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/data/characters';
import { CARD_POOL, Card as CardType } from '@/data/cards';
import { ActiveStatus, EffectConfig } from '@/data/typesEffect';

import Card from '@/components/Card';
import StatBar from '@/components/StatBar';
import UnitDisplay from '@/components/UnitDisplay';

// ✅ Import Logic ที่แยกออกมา
import { calculateDamage, calculateCardBonus, calculateUltCharge } from '@/utils/battleLogic';

type GamePhase = 'PLAYER_THINKING' | 'PLAYER_EXECUTING' | 'ENEMY_TURN' | 'PLAYER_RESTOCK';

type BattleState = { 
  hp: number[]; 
  shield: number[]; 
  ult: number[];
  statuses: ActiveStatus[][];
};

export default function BattleScene() {
  const router = useRouter();

  // --- State ---
  const [team, setTeam] = useState<Character[]>([]);
  const [battleState, setBattleState] = useState<BattleState>({ 
      hp: [], shield: [], ult: [], statuses: [[], [], [], []] 
  });
  const [bossMaxHp, setBossMaxHp] = useState(1500);
  const [hand, setHand] = useState<CardType[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>('PLAYER_THINKING');
  const [playerActionCount, setPlayerActionCount] = useState(0);
  const [log, setLog] = useState<string>("เริ่มเกม! เลือกตัวละคร + เลือกการ์ด");
  const [enemyCardDisplay, setEnemyCardDisplay] = useState<CardType | null>(null);

  // --- Init ---
  useEffect(() => {
    const savedTeam = localStorage.getItem('myTeam');
    if (savedTeam) {
      const parsedTeam = JSON.parse(savedTeam);
      
      if (!parsedTeam[0].ultimate) {
          console.warn("Found old data, resetting...");
          localStorage.removeItem('myTeam');
          router.push('/game');
          return;
      }

      setTeam(parsedTeam);
      const initHp = [parsedTeam[0].stats.hp, parsedTeam[1].stats.hp, 1500, 300];

      setBattleState({
        hp: initHp,
        shield: [0, 0, 0, 0],
        ult: [0, 0, 0, 0],
        statuses: [[], [], [], []]
      });
      setBossMaxHp(1500);
      drawCards(5);
    } else {
      router.push('/game');
    }
  }, [router]);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const drawCards = (count: number, currentHand: CardType[] = []) => {
    const newCards: CardType[] = [];
    for (let i = 0; i < count; i++) {
      const proto = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      newCards.push({ ...proto, id: `${proto.id}-${Date.now()}-${i}` });
    }
    setHand([...currentHand, ...newCards]);
  };

  // --- 🔥 ULTIMATE LOGIC ---
  const handleUltimate = async (charId: number) => {
    if (phase !== 'PLAYER_THINKING') return;

    const charIndex = team.findIndex(c => c.id === charId);
    const char = team[charIndex];
    if (!char || !char.ultimate) return; 

    const currentUlt = battleState.ult[charIndex];
    const maxUlt = char.stats.maxUltimate || 100;

    if (currentUlt < maxUlt) return;

    setPhase('PLAYER_EXECUTING');
    setLog(`⚡ ${char.name} ใช้ท่าไม้ตาย: ${char.ultimate.name}!`);

    setBattleState(prev => {
        const newUlt = [...prev.ult];
        newUlt[charIndex] = 0;
        return { ...prev, ult: newUlt };
    });

    await delay(800);
    char.ultimate.effects.forEach(effect => applyEffect(effect, charIndex));
    await delay(1000);
    setPhase('PLAYER_THINKING');
  };

  const applyEffect = (effect: EffectConfig, sourceIndex: number) => {
    setBattleState(prev => {
        let newHp = [...prev.hp];
        let newShield = [...prev.shield];
        let newStatuses = prev.statuses.map(arr => [...arr]); 

        const applyToTarget = (targetIdx: number) => {
             if (effect.duration === 0) {
                 if (effect.type === 'INSTANT_DMG') {
                     // ✅ ใช้ Logic ใหม่: calculateDamage
                     const result = calculateDamage(newHp[targetIdx], newShield[targetIdx], effect.value);
                     newHp[targetIdx] = result.hp;
                     newShield[targetIdx] = result.shield;
                 } else if (effect.type === 'INSTANT_HEAL') {
                     const maxHp = targetIdx < 2 ? team[targetIdx].stats.hp : (targetIdx === 2 ? bossMaxHp : 300);
                     newHp[targetIdx] = Math.min(maxHp, newHp[targetIdx] + effect.value);
                 } else if (effect.type === 'DEFEND_UP') {
                     newShield[targetIdx] += effect.value;
                 }
             } else {
                 newStatuses[targetIdx].push({
                     id: `${effect.type}-${Date.now()}-${Math.random()}`,
                     type: effect.type,
                     value: effect.value,
                     duration: effect.duration,
                     icon: effect.icon || '✨'
                 });
             }
        };

        if (effect.target === 'SELF') applyToTarget(sourceIndex);
        else if (effect.target === 'TEAM_ALL') { applyToTarget(0); applyToTarget(1); }
        else if (effect.target === 'ENEMY_SINGLE') { 
            if (newHp[3] > 0) applyToTarget(3); else applyToTarget(2); 
        }
        else if (effect.target === 'ENEMY_ALL') { 
            if(newHp[3] > 0) applyToTarget(3); 
            applyToTarget(2); 
        }

        return { ...prev, hp: newHp, shield: newShield, statuses: newStatuses };
    });
  };

  const processTurnStatuses = () => {
      setBattleState(prev => {
          let newHp = [...prev.hp];
          let newStatuses = prev.statuses.map((charStatus, idx) => {
              const active: ActiveStatus[] = [];
              charStatus.forEach(s => {
                  if (s.type === 'DOT') {
                      newHp[idx] = Math.max(0, newHp[idx] - s.value);
                  } else if (s.type === 'HOT') {
                      newHp[idx] += s.value; 
                  }
                  if (s.duration > 1) {
                      active.push({ ...s, duration: s.duration - 1 });
                  }
              });
              return active;
          });
          return { ...prev, hp: newHp, statuses: newStatuses };
      });
  };

  const handleCharClick = (id: number) => {
    if (phase !== 'PLAYER_THINKING') return;
    setSelectedCharId(id === selectedCharId ? null : id);
  };
  const handleCardClick = (id: string) => {
    if (phase !== 'PLAYER_THINKING' && phase !== 'PLAYER_RESTOCK') return;
    setSelectedCardId(id === selectedCardId ? null : id);
  };

  const handleSkipTurn = () => {
    setPhase('ENEMY_TURN');
    startEnemyTurn();
  };

  const handlePlayerAction = async () => {
    if (!selectedCardId || !selectedCharId) return;
    const card = hand.find(c => c.id === selectedCardId);
    const actorIndex = team.findIndex(c => c.id === selectedCharId);
    const actor = team[actorIndex];
    if (!card || !actor) return;

    setPhase('PLAYER_EXECUTING');
    
    // ✅ ใช้ Logic ใหม่: calculateCardBonus
    const bonus = calculateCardBonus(actor, card, battleState.statuses[actorIndex]);
    const finalValue = card.value + bonus;
    const chargeAmt = card.ultimateCharge || 10;

    setLog(`${actor.name} ใช้ ${card.name} (Value: ${finalValue})`);

    setBattleState(prev => {
        const newUlt = [...prev.ult];
        const maxUlt = actor.stats.maxUltimate || 100;
        // ✅ ใช้ Logic ใหม่: calculateUltCharge
        newUlt[actorIndex] = calculateUltCharge(newUlt[actorIndex], maxUlt, chargeAmt);
        
        let newHp = [...prev.hp];
        let newShield = [...prev.shield];

        if (card.type === 'Attack') {
             const target = (newHp[3] > 0 && card.effect !== 'Pierce') ? 3 : 2;
             
             // ✅ ใช้ Logic ใหม่: calculateDamage
             const dmgResult = calculateDamage(newHp[target], newShield[target], finalValue);
             newHp[target] = dmgResult.hp;
             newShield[target] = dmgResult.shield;

             if (card.effect === 'Drain') newHp[actorIndex] += Math.floor(finalValue * 0.5);
        } else if (card.type === 'Heal') {
             if (card.effect === 'AoE') { newHp[0]+=finalValue; newHp[1]+=finalValue; }
             else newHp[actorIndex] += finalValue;
        } else {
             newShield[actorIndex] += finalValue;
        }
        return { ...prev, hp: newHp.map(h=>Math.max(0,h)), shield: newShield, ult: newUlt };
    });

    setHand(prev => prev.filter(c => c.id !== selectedCardId));
    setSelectedCardId(null);
    setSelectedCharId(null);
    await delay(600);

    const newCount = playerActionCount + 1;
    setPlayerActionCount(newCount);
    if (newCount >= 2) { setPhase('ENEMY_TURN'); startEnemyTurn(); }
    else { setPhase('PLAYER_THINKING'); }
  };

  const startEnemyTurn = async () => {
    setLog("Enemy Turn...");
    await delay(1000);
    processTurnStatuses(); 
    
    for (let i = 1; i <= 2; i++) {
        const randType = Math.random();
        let enemyCardName = "Boss Attack";
        if(randType < 0.4) enemyCardName = "Dark Slash (หน้า)";
        else if(randType < 0.7) enemyCardName = "Piercing Spear (ทะลุ)";
        else enemyCardName = "Shadow Snipe (หลัง)";

        const mockEnemyCard: CardType = { 
            id: 'e-atk', name: enemyCardName, type: "Attack", 
            value: 40, cost: 0, description: "โจมตี!", icon: "👿", ultimateCharge: 0 
        };
        
        setEnemyCardDisplay(mockEnemyCard); 
        setLog(`บอสใช้: ${enemyCardName}`);
        await delay(1500); 
        performEnemyAttack(randType);
        setEnemyCardDisplay(null);
        await delay(800);
    }
    setPhase('PLAYER_RESTOCK');
    setLog("จบเทิร์น! เลือกเก็บการ์ด 1 ใบ");
  };

  const performEnemyAttack = (rand: number) => {
    setBattleState((prev) => {
      let newHp = [...prev.hp];
      let newShield = [...prev.shield];
      const frontIdx = newHp[0] > 0 ? 0 : 1; 
      const backIdx = 1;

      // Helper function เพื่อใช้ calculateDamage
      const applyDamage = (idx: number, dmg: number) => {
         if (newHp[idx] <= 0) return;
         // ✅ ใช้ Logic ใหม่: calculateDamage
         const res = calculateDamage(newHp[idx], newShield[idx], dmg);
         newHp[idx] = res.hp;
         newShield[idx] = res.shield;
      };

      if (rand < 0.4) { applyDamage(frontIdx, 40); } 
      else if (rand < 0.7) { applyDamage(frontIdx, 30); applyDamage(backIdx, 15); } 
      else { if(newHp[backIdx] > 0) applyDamage(backIdx, 50); else applyDamage(frontIdx, 50); }

      const finalHp = newHp.map(h => Math.max(0, h));
      if (finalHp.every(h => h <= 0)) { setTimeout(() => { alert("GAME OVER"); router.push('/'); }, 500); }
      return { ...prev, hp: finalHp, shield: newShield };
    });
  };
  
  const handleRestock = () => {
    const keptCard = hand.find(c => c.id === selectedCardId);
    const nextHand = keptCard ? [keptCard] : [];
    drawCards(5 - nextHand.length, nextHand);
    setPlayerActionCount(0);
    setSelectedCardId(null);
    setSelectedCharId(null);
    processTurnStatuses();
    setPhase('PLAYER_THINKING');
    setLog("เริ่มเทิร์นใหม่!");
  };

  if (team.length === 0) return <div>Loading...</div>;

  return (
    <div className="h-screen w-full bg-slate-900 overflow-hidden relative select-none font-sans">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />

      {/* TOP UI */}
      <div className="absolute top-4 w-full flex justify-between px-6 z-20">
         <div className="bg-black/70 text-white px-4 py-2 rounded border border-gray-600 font-mono">LOG: {log}</div>
         <button onClick={() => router.push('/')} className="bg-red-900/80 hover:bg-red-700 text-white px-4 py-2 rounded border border-red-500 font-bold">🏳️ ยอมแพ้</button>
      </div>

      {/* BOSS HP BAR (กลางจอด้านบน) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] z-20 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            💀 DARK LORD ({battleState.hp[2]})
        </h2>
        <div className="border-2 border-red-900 rounded bg-gray-900">
           <StatBar current={battleState.hp[2]} max={bossMaxHp} shield={battleState.shield[2]} type="HP" />
        </div>
        {/* Boss Statuses */}
        <div className="flex justify-center gap-1 mt-1 absolute -bottom-6 w-full">
             {battleState.statuses[2].map(s => <span key={s.id} className="bg-black text-white text-xs px-1 rounded border border-red-500 flex items-center">{s.icon} {s.duration}</span>)}
        </div>
      </div>

      {/* BATTLE FIELD */}
      <div className="absolute inset-0 flex items-center justify-center px-10 pb-32 z-10 pointer-events-none">
        
        {/* PLAYER TEAM */}
        <div className="flex flex-row-reverse gap-8 items-end pointer-events-auto mr-auto pl-10">
           {team.map((char, idx) => (
             <div key={char.id} className="relative">
                 {/* ULTIMATE BUTTON */}
                 {(battleState.ult[idx] >= (char.stats.maxUltimate || 100)) && phase === 'PLAYER_THINKING' && (
                     <button 
                        onClick={() => handleUltimate(char.id)}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-b from-yellow-300 to-yellow-600 text-black font-bold px-3 py-1 rounded-full border-2 border-white shadow-[0_0_20px_gold] animate-bounce whitespace-nowrap cursor-pointer hover:scale-110 transition-transform"
                     >
                        ⚡ ULT!
                     </button>
                 )}

                 <UnitDisplay 
                    name={char.name} avatar={char.avatar} color={char.color}
                    hp={battleState.hp[idx]} maxHp={char.stats.hp}
                    shield={battleState.shield[idx]}
                    ult={battleState.ult[idx]} maxUlt={char.stats.maxUltimate || 100}
                    variant="PLAYER"
                    isSelected={selectedCharId === char.id}
                    onClick={() => handleCharClick(char.id)}
                    statuses={battleState.statuses[idx]}
                 />
             </div>
           ))}
        </div>

        {/* ENEMY GROUP */}
        <div className="relative flex items-end gap-8 ml-auto pr-10 pointer-events-auto">
            {battleState.hp[3] > 0 && (
                <div className="relative z-20">
                    <UnitDisplay 
                        name="Minion"
                        avatar="👿"
                        color="purple"
                        hp={battleState.hp[3]} maxHp={300} variant="MINION" 
                        statuses={battleState.statuses[3]} 
                    />
                </div>
            )}
            <div className="relative z-10">
                <UnitDisplay 
                    name="Dark Lord"
                    avatar="👹"
                    color="gray"
                    hp={battleState.hp[2]} maxHp={bossMaxHp} variant="BOSS" 
                    statuses={battleState.statuses[2]} 
                />
            </div>
        </div>
      </div>

      {/* BOTTOM AREA */}
      <div className="absolute bottom-0 left-0 right-0 h-[280px] bg-gradient-to-t from-black via-slate-900 to-transparent z-30 pt-8">
         <div className="relative w-full h-full flex justify-center items-end pb-8">
            
            {phase === 'ENEMY_TURN' && enemyCardDisplay && (
                <div className="absolute bottom-10 z-50 animate-bounce-slow">
                   <Card data={enemyCardDisplay} disabled />
                </div>
            )}

            {!enemyCardDisplay && (
                <div className="flex justify-center items-end gap-4 px-10 h-full">
                    {hand.map((card) => (
                        <Card 
                          key={card.id} 
                          data={card} 
                          isSelected={selectedCardId === card.id}
                          onClick={() => handleCardClick(card.id)}
                          // ✅ ใช้ Logic ใหม่: calculateCardBonus (และส่ง statuses เข้าไป)
                          bonus={calculateCardBonus(team.find(t => t.id === selectedCharId) || team[0], card, selectedCharId ? battleState.statuses[team.findIndex(t => t.id === selectedCharId)] : [])}
                          disabled={phase === 'ENEMY_TURN'}
                        />
                    ))}
                </div>
            )}

            <div className="absolute bottom-10 right-10 flex flex-col gap-3">
                {phase === 'PLAYER_THINKING' && (
                    <>
                        <button onClick={handlePlayerAction} disabled={!selectedCardId || !selectedCharId}
                            className={`px-8 py-3 rounded-xl font-bold text-xl shadow-lg transition-all w-48 ${selectedCardId && selectedCharId ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:scale-105' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                            ACTION! 💥
                        </button>
                        
                        <button onClick={handleSkipTurn}
                            className="px-8 py-2 rounded-xl font-bold text-md border-2 border-red-500 text-red-400 hover:bg-red-900/50 hover:text-white transition-all w-48">
                            END TURN ⏭️
                        </button>
                        
                        <div className="text-xs text-gray-400 text-center">Actions: {playerActionCount}/2</div>
                    </>
                )}
                
                {phase === 'PLAYER_RESTOCK' && (
                    <button onClick={handleRestock} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold w-48 shadow-lg hover:scale-105">
                        CONFIRM ♻️
                    </button>
                )}
            </div>
         </div>
      </div>
    </div>
  );
}