'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBattle } from '@/hooks/useBattle'; // Import Hook Logic
import { calculateCardBonus } from '@/utils/battleLogic';

import Card from '@/components/Card';
import StatBar from '@/components/StatBar';
import UnitDisplay from '@/components/UnitDisplay';
import DebugConsole from '@/components/DebugConsole'; // Import Console

export default function BattleScene() {
  const router = useRouter();
  
  // ✅ เรียกใช้ Logic ทั้งหมดจาก Hook บรรทัดเดียว
  const {
    team, battleState, bossMaxHp, hand, phase, log, enemyCardDisplay, rewardOptions,
    selectedCharId, selectedCardId, playerActionCount,
    initializeGame, handleFloatingTextComplete, selectChar, selectCard,
    executePlayerAction, skipTurn, handleUltimate, handleRestock, cheat
  } = useBattle();

  useEffect(() => { initializeGame(); }, []);

  if (team.length === 0) return <div className="text-white text-center mt-20">Loading Battle...</div>;

  return (
    <div className="h-screen w-full bg-slate-900 overflow-hidden relative select-none font-sans">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />

      {/* ✅ Debug Console (F1) */}
      <DebugConsole onCommand={cheat} />

      {/* TOP UI */}
      <div className="absolute top-4 w-full flex justify-between px-6 z-20">
         <div className="bg-black/70 text-white px-4 py-2 rounded border border-gray-600 font-mono">LOG: {log}</div>
         <button onClick={() => router.push('/')} className="bg-red-900/80 hover:bg-red-700 text-white px-4 py-2 rounded border border-red-500 font-bold">🏳️ ยอมแพ้</button>
      </div>

      {/* BOSS HP */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] z-20 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-1 drop-shadow-md">💀 DARK LORD ({battleState.hp[2]})</h2>
        <div className="border-2 border-red-900 rounded bg-gray-900">
           <StatBar current={battleState.hp[2]} max={bossMaxHp} shield={battleState.shield[2]} type="HP" />
        </div>
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
                     <button onClick={() => handleUltimate(char.id)} className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-b from-yellow-300 to-yellow-600 text-black font-bold px-3 py-1 rounded-full border-2 border-white shadow-[0_0_20px_gold] animate-bounce whitespace-nowrap cursor-pointer hover:scale-110 transition-transform">⚡ ULT!</button>
                 )}
                 <UnitDisplay 
                    name={char.name} avatar={char.avatar} color={char.color}
                    hp={battleState.hp[idx]} maxHp={char.stats.hp}
                    shield={battleState.shield[idx]} ult={battleState.ult[idx]} maxUlt={char.stats.maxUltimate || 100}
                    variant="PLAYER" isSelected={selectedCharId === char.id} onClick={() => selectChar(char.id)}
                    statuses={battleState.statuses[idx]} floatingTexts={battleState.floatingTexts[idx]}
                    onFloatingTextComplete={(textId) => handleFloatingTextComplete(idx, textId)}
                    isShaking={battleState.shaking[idx]}
                 />
             </div>
           ))}
        </div>

        {/* ENEMY GROUP */}
        <div className="relative flex items-end gap-8 ml-auto pr-10 pointer-events-auto">
            {battleState.hp[3] > 0 && (
                <div className="relative z-20">
                    <UnitDisplay name="Minion" avatar="👿" color="purple" hp={battleState.hp[3]} maxHp={300} variant="MINION" 
                        statuses={battleState.statuses[3]} floatingTexts={battleState.floatingTexts[3]}
                        onFloatingTextComplete={(textId) => handleFloatingTextComplete(3, textId)}
                        isShaking={battleState.shaking[3]}
                    />
                </div>
            )}
            <div className="relative z-10">
                <UnitDisplay name="Dark Lord" avatar="👹" color="gray" hp={battleState.hp[2]} maxHp={bossMaxHp} variant="BOSS" 
                    statuses={battleState.statuses[2]} floatingTexts={battleState.floatingTexts[2]}
                    onFloatingTextComplete={(textId) => handleFloatingTextComplete(2, textId)}
                    isShaking={battleState.shaking[2]}
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

            {!enemyCardDisplay && phase !== 'GAME_WON' && phase !== 'GAME_OVER' && (
                <div className="flex justify-center items-end gap-4 px-10 h-full">
                    {hand.map((card) => (
                        <Card key={card.id} data={card} isSelected={selectedCardId === card.id} onClick={() => selectCard(card.id)} 
                            bonus={calculateCardBonus(team.find(t => t.id === selectedCharId) || team[0], card, selectedCharId ? battleState.statuses[team.findIndex(t => t.id === selectedCharId)] : [])} 
                            disabled={phase === 'ENEMY_TURN'} />
                    ))}
                </div>
            )}

            {/* BUTTONS: อยู่ครบ! */}
            <div className="absolute bottom-10 right-10 flex flex-col gap-3">
                {phase === 'PLAYER_THINKING' && (
                    <>
                        <button onClick={executePlayerAction} disabled={!selectedCardId || !selectedCharId}
                            className={`px-8 py-3 rounded-xl font-bold text-xl shadow-lg transition-all w-48 ${selectedCardId && selectedCharId ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:scale-105' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                            ACTION! 💥
                        </button>
                        <button onClick={skipTurn}
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

      {/* OVERLAY: WIN/LOSS */}
      {(phase === 'GAME_WON' || phase === 'GAME_OVER') && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
            {phase === 'GAME_WON' ? (
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-yellow-400 drop-shadow-[0_0_20px_gold] mb-4 animate-bounce">🏆 VICTORY! 🏆</h1>
                    <p className="text-white text-xl mb-8">Choose your reward!</p>
                    <div className="flex gap-6 justify-center">
                        {rewardOptions.map((card) => (
                            <div key={card.id} className="hover:scale-110 transition-transform cursor-pointer relative group">
                                <Card data={card} onClick={() => { console.log('Picked', card.name); router.push('/'); }} />
                                <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center">
                     <h1 className="text-6xl font-bold text-red-600 drop-shadow-[0_0_20px_red] mb-8">💀 DEFEAT 💀</h1>
                     <button onClick={() => router.push('/')} className="px-8 py-4 bg-red-800 hover:bg-red-700 text-white font-bold rounded-xl text-xl border-2 border-red-500 shadow-lg transition-all hover:scale-105">
                        Return to Menu
                     </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}