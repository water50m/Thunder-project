'use client';

import { useEffect } from 'react';
import { useBattle } from '@/hooks/battle/useBattle';

// --- Main Component ---
export default function BattlePage() {
  const {
    team, 
    battleState, 
    bossMaxHp, 
    hand, 
    phase, 
    log, 
    enemyCardDisplay, 
    rewardOptions,
    selectedCharId, 
    selectedCardId, 
    playerActionCount,
    shaking,
    floatingTexts,
    initializeGame, 
    handleFloatingTextComplete, 
    selectChar, 
    selectCard,
    executePlayerAction, 
    skipTurn, 
    handleUltimate, 
    handleRestock,
    cheat
  } = useBattle();

  useEffect(() => {
    initializeGame();
  }, []);

  if (!team || team.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="animate-pulse text-xl">Loading Battle...</div>
        </div>
    );
  }

  // Helper สำหรับเรียงลำดับการแสดงผลทีม (Back Row -> Front Row)
  // เราต้องการแสดง: [Team 1 (Back)] [Team 0 (Front)] --- VS --- [Boss]
  // ดังนั้นเราจะ map จาก array ที่ reverse แล้ว (หรือเรียงตาม logic นี้)
  const displayTeam = [...team].reverse(); // ถ้ามี 2 ตัว: [Char2, Char1] -> Char2 อยู่ซ้ายสุด(หลัง), Char1 อยู่ขวา(หน้า)

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden select-none font-sans flex flex-col">
      
      {/* --- Top Bar --- */}
      <div className="absolute top-0 w-full bg-black/60 p-3 text-center z-10 backdrop-blur-md border-b border-gray-700 shadow-lg flex justify-between px-8 items-center">
        <div className={`font-mono font-bold px-3 py-1 rounded text-sm ${phase === 'ENEMY_TURN' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
            PHASE: {phase.replace('_', ' ')}
        </div>
        <div className="text-gray-200 animate-pulse font-bold text-lg drop-shadow-md">{log}</div>
        <div className="text-xs text-gray-500 w-24 text-right">TURN: {playerActionCount + 1}/2</div>
      </div>

      {/* --- Cheat Button (Optional) --- */}
      <div className="absolute top-16 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
          <button onClick={() => cheat('killboss')} className="bg-red-800 text-xs p-1 rounded mr-2">Kill Boss</button>
          <button onClick={() => cheat('draw')} className="bg-blue-800 text-xs p-1 rounded">Draw</button>
      </div>

      {/* --- BATTLE AREA (Center Stage) --- */}
      <div className="flex-1 flex items-center justify-between px-8 md:px-16 lg:px-24 w-full max-w-[1600px] mx-auto pb-32">
        
        {/* === LEFT SIDE: PLAYERS === */}
        <div className="flex items-center gap-4 md:gap-8 lg:gap-12 perspective-1000">
            {displayTeam.map((char) => {
                // หา index จริงๆ ใน array หลัก (เพราะเรา reverse มาแสดงผล)
                const realIndex = team.findIndex(c => c.id === char.id);
                
                const isSelected = selectedCharId === char.id;
                const isShaking = shaking[realIndex];
                const hp = battleState.hp[realIndex];
                const shield = battleState.shield[realIndex];
                const ult = battleState.ult[realIndex];
                const maxUlt = char.stats.maxUltimate || 100;
                const isDead = hp <= 0;

                return (
                    <div key={char.id} className={`relative flex flex-col items-center transition-all duration-300 group ${isDead ? 'opacity-50 grayscale' : ''}`}>
                         
                         {/* Status & HP Above Head */}
                         <div className="mb-2 flex flex-col items-center gap-1">
                            {/* Status Icons */}
                            <div className="flex justify-center gap-1 min-h-[20px]">
                                {battleState.statuses[realIndex] && battleState.statuses[realIndex].map((s, i) => (
                                    <StatusIcon key={`${s.id}-${i}`} status={s} />
                                ))}
                            </div>
                            {/* HP Bar */}
                            <div className="w-32">
                                <HealthBar current={hp} max={char.stats.hp} shield={shield} />
                            </div>
                         </div>

                         {/* Character Sprite */}
                         <div 
                           onClick={() => !isDead && selectChar(char.id)}
                           className={`
                             relative w-32 h-44 md:w-40 md:h-56 rounded-xl border-4 cursor-pointer transition-all duration-200
                             flex flex-col items-center justify-center bg-gray-800 overflow-visible shadow-xl
                             ${isSelected ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)] scale-105 z-10' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700'}
                             ${isShaking ? 'translate-x-[-10px] bg-red-900/50' : ''} 
                           `}
                         >
                            {/* Role Icon Bg */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 text-9xl pointer-events-none">
                                {char.role === 'Defender' ? '🛡️' : '⚔️'}
                            </div>

                            {/* Main Icon */}
                            <div className="z-10 text-6xl mb-2 drop-shadow-2xl transform transition-transform group-hover:scale-110">
                                {char.role === 'Defender' ? '🛡️' : '⚔️'}
                            </div>
                            
                            {/* Name Tag */}
                            <div className="z-10 font-bold text-sm bg-black/60 px-3 py-0.5 rounded-full border border-gray-600 shadow-md">
                                {char.name}
                            </div>
                            
                            {/* Position Badge (Front/Back) */}
                            <div className="absolute -bottom-3 text-[10px] font-bold bg-gray-700 px-2 rounded text-gray-400 border border-gray-500 uppercase">
                                {realIndex === 0 ? 'FRONT' : 'BACK'}
                            </div>

                            {/* Floating Texts */}
                            <FloatingTextOverlay 
                                texts={floatingTexts[realIndex]} 
                                onComplete={(id) => handleFloatingTextComplete(realIndex, id)} 
                            />
                         </div>

                         {/* Ultimate Bar (Below) */}
                         <div 
                           onClick={() => !isDead && ult >= maxUlt && handleUltimate(char.id)}
                           className={`
                                mt-3 w-full h-3 bg-gray-900 rounded-full border border-gray-600 relative overflow-hidden
                                ${!isDead && ult >= maxUlt ? 'cursor-pointer ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
                           `}
                         >
                            <div 
                                className={`h-full transition-all duration-500 ${ult >= maxUlt ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 animate-pulse' : 'bg-blue-600'}`} 
                                style={{ width: `${Math.min(100, (ult / maxUlt) * 100)}%` }}
                            />
                         </div>
                    </div>
                );
            })}
        </div>

        {/* === VS VISUAL (Optional) === */}
        {/* <div className="text-6xl font-black text-white/5 italic opacity-30 select-none">VS</div> */}

        {/* === RIGHT SIDE: BOSS === */}
        <div className="flex flex-col items-center">
            {/* Boss Stats */}
            <div className="mb-4 flex flex-col items-center gap-2">
                <div className="text-red-500 font-bold text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-widest">BOSS</div>
                {/* Boss Status */}
                <div className="flex justify-center gap-1 min-h-[20px]">
                    {battleState.statuses[2] && battleState.statuses[2].map((s, i) => (
                        <StatusIcon key={`${s.id}-${i}`} status={s} />
                    ))}
                </div>
                <div className="w-64">
                    <HealthBar current={battleState.hp[2]} max={bossMaxHp} shield={battleState.shield[2]} />
                </div>
            </div>

            {/* Boss Sprite */}
            <div className={`
                relative w-56 h-56 md:w-64 md:h-64 
                bg-gradient-to-br from-red-950 to-black rounded-full border-4 border-red-700 
                flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.3)]
                transition-transform duration-100
                ${shaking[2] ? 'translate-x-[10px] translate-y-[5px]' : ''}
            `}>
                 <span className="text-8xl md:text-9xl filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)] animate-pulse-slow">👿</span>
                 
                 {/* Floating Text */}
                 <FloatingTextOverlay 
                    texts={floatingTexts[2]} 
                    onComplete={(id) => handleFloatingTextComplete(2, id)} 
                 />

                 {/* Enemy Card Display (Popup) */}
                 {enemyCardDisplay && (
                     <div className="absolute -left-48 top-0 z-30 bg-red-950/90 border-2 border-red-500 p-4 rounded-xl w-48 shadow-[0_0_30px_rgba(255,0,0,0.5)] text-center animate-[bounce_1s_infinite]">
                        <div className="text-4xl mb-2">{enemyCardDisplay.icon}</div>
                        <div className="font-bold text-red-300 text-lg leading-tight">{enemyCardDisplay.name}</div>
                        <div className="text-xs text-red-200 mt-2 font-mono bg-black/30 p-1 rounded">{enemyCardDisplay.description}</div>
                     </div>
                 )}
            </div>
        </div>

      </div>

      {/* --- BOTTOM: CONTROLS & HAND --- */}
      <div className="fixed bottom-0 w-full bg-gradient-to-t from-black via-gray-900/95 to-transparent pt-8 pb-4 px-4 flex flex-col items-center z-20">
        
        {/* Buttons Row */}
        <div className="mb-4 flex gap-4 items-center">
             {phase === 'PLAYER_THINKING' && (
                 <>
                    <button 
                        onClick={executePlayerAction}
                        disabled={!selectedCardId || !selectedCharId}
                        className={`
                            px-10 py-3 rounded-full font-bold text-lg transition-all transform duration-200 border-2
                            ${(!selectedCardId || !selectedCharId) 
                                ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed' 
                                : 'bg-yellow-500 border-yellow-300 text-black hover:bg-yellow-400 hover:scale-105 shadow-[0_0_25px_rgba(250,204,21,0.5)]'}
                        `}
                    >
                        EXECUTE
                    </button>
                    <button 
                        onClick={skipTurn} 
                        className="px-6 py-3 rounded-full border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors font-mono text-sm"
                    >
                        SKIP ({playerActionCount}/2)
                    </button>
                 </>
             )}
             {phase === 'PLAYER_RESTOCK' && (
                 <button 
                    onClick={handleRestock}
                    className="px-10 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg animate-bounce border-2 border-green-400 text-lg"
                 >
                    {selectedCardId ? 'KEEP CARD & DRAW' : 'DISCARD ALL & DRAW'}
                 </button>
             )}
        </div>

        {/* Cards Row */}
        <div className="flex gap-4 overflow-x-auto px-4 w-full max-w-6xl justify-center items-end min-h-[260px] pb-2 pt-12">
            {hand.map((card) => {
                const isSelected = selectedCardId === card.id;
                
                // เช็คว่ามีการ์ดนี้มีค่า ultimateCharge หรือไม่ (ถ้าไม่มี หรือเป็น 0 อาจจะไม่โชว์ก็ได้)
                const ultCharge = card.ultimateCharge || 0;

                return (
                    <div
                        key={card.id}
                        onClick={() => selectCard(card.id)}
                        className={`
                            flex-shrink-0 w-32 h-48 rounded-xl p-3 cursor-pointer border-2 transition-all duration-200 relative
                            flex flex-col justify-between select-none group
                            ${isSelected 
                                ? 'bg-gray-800 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)] -translate-y-8 z-10 scale-110' 
                                : 'bg-gray-900 border-gray-600 hover:border-gray-400 hover:bg-gray-800 hover:-translate-y-4'}
                        `}
                    >
                        {/* 1. Cost Bubble (มุมซ้ายบน - สีฟ้า) */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-900 border-2 border-blue-400 flex items-center justify-center text-sm font-bold text-white shadow-lg z-20">
                            {card.cost}
                        </div>

                        {/* 2. ✅ Ultimate Charge Bubble (มุมขวาบน - สีเหลือง) */}
                        {ultCharge > 0 && (
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-900 border-2 border-yellow-400 flex flex-col items-center justify-center text-yellow-400 shadow-lg z-20" title={`Gain ${ultCharge} Ultimate Charge`}>
                                <div className="text-[8px] -mb-0.5">⚡</div> {/* ไอคอนสายฟ้าเล็กๆ ด้านบน */}
                                <div className="text-xs font-bold leading-none">{ultCharge}</div>
                            </div>
                        )}

                        {/* Card Content */}
                        <div className="flex flex-col items-center mt-2">
                            <div className="text-4xl filter drop-shadow-md mb-2 transform group-hover:scale-110 transition-transform">{card.icon}</div>
                            <div className="font-bold text-sm text-white text-center leading-tight">{card.name}</div>
                        </div>
                        
                        <div className="text-[10px] text-gray-400 text-center leading-tight line-clamp-3 my-1">
                            {card.description}
                        </div>

                        {/* Value Badge */}
                        <div className={`
                            text-center font-mono font-bold text-xl py-1 rounded bg-black/20
                            ${card.type === 'Attack' ? 'text-red-400' : card.type === 'Defend' ? 'text-blue-400' : 'text-green-400'}
                        `}>
                            {card.value > 0 ? card.value : (card.type === 'Special' ? 'BUFF' : '-')}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- OVERLAYS --- */}
      {/* Game Won */}
      {phase === 'GAME_WON' && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-500">
              <div className="bg-gray-800 p-8 rounded-2xl text-center border-2 border-yellow-500 max-w-4xl w-full shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                  <h2 className="text-6xl font-bold text-yellow-400 mb-2 drop-shadow-lg">VICTORY!</h2>
                  <p className="mb-8 text-gray-300 text-xl">Choose your reward:</p>
                  <div className="flex gap-6 justify-center mb-10 flex-wrap">
                      {rewardOptions.map(card => (
                          <div key={card.id} className="group relative w-40 h-56 bg-gray-900 border-2 border-gray-600 hover:border-yellow-400 rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer transition-transform hover:scale-105">
                              <div className="text-4xl">{card.icon}</div>
                              <div className="font-bold text-white text-lg">{card.name}</div>
                              <div className="text-xs text-gray-400">{card.description}</div>
                              <button className="w-full py-1 bg-gray-700 group-hover:bg-yellow-500 group-hover:text-black rounded text-xs font-bold mt-2">SELECT</button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => window.location.href = '/'} className="px-10 py-3 bg-transparent border-2 border-yellow-500 text-yellow-500 font-bold rounded-full hover:bg-yellow-500 hover:text-black transition-colors">
                      BACK TO MENU
                  </button>
              </div>
          </div>
      )}

      {/* Game Over */}
      {phase === 'GAME_OVER' && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
              <h2 className="text-8xl font-bold text-red-600 mb-4 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,1)]">DEFEAT</h2>
              <p className="text-gray-400 mb-8 text-xl">Your party has fallen...</p>
              <button onClick={() => window.location.href = '/'} className="px-12 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 border border-gray-600 text-xl transition-all hover:scale-105">
                  TRY AGAIN
              </button>
          </div>
      )}

    </div>
  );
}

// --- Sub Components ---

function HealthBar({ current, max, shield }: { current: number, max: number, shield: number }) {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));
    return (
        <div className="relative w-full h-4 bg-gray-950 rounded-full border border-gray-700 overflow-visible shadow-inner">
            <div className="absolute inset-0 bg-red-900/40 rounded-full"></div>
            <div 
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 rounded-l-full relative" 
                style={{ width: `${percent}%` }}
            >
                <div className="absolute top-0 left-0 w-full h-[50%] bg-white/20 rounded-t-full"></div>
            </div>
            
            {shield > 0 && (
                <div className="absolute -top-3 -right-2 bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10 border border-blue-400 flex items-center gap-1 animate-pulse">
                    <span>🛡</span> {shield}
                </div>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold drop-shadow-md text-white tracking-wider">
                {current} / {max}
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: any }) {
    return (
        <div className="relative group/tooltip">
            <div className="w-5 h-5 rounded-full bg-black/80 border border-gray-500 flex items-center justify-center text-[10px] shadow-md cursor-help">
                {status.icon}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-[10px] rounded border border-gray-600 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                {status.type} ({status.value}) - {status.duration}t
            </div>
        </div>
    )
}

function FloatingTextOverlay({ texts, onComplete }: { texts: any[], onComplete: (id: string) => void }) {
    return (
        <>
            {texts.map((ft) => (
                <FloatingTextItem key={ft.id} ft={ft} onComplete={onComplete} />
            ))}
        </>
    );
}

function FloatingTextItem({ ft, onComplete }: { ft: any, onComplete: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete(ft.id);
        }, 1000);
        return () => clearTimeout(timer);
    }, [ft.id, onComplete]);

    let colorClass = 'text-white';
    if (ft.type === 'DMG') colorClass = 'text-red-500 scale-125 font-black drop-shadow-[0_2px_0_#000]';
    if (ft.type === 'HEAL') colorClass = 'text-green-400 drop-shadow-[0_1px_0_#000]';
    if (ft.type === 'BLOCK') colorClass = 'text-blue-300';
    if (ft.type === 'BUFF') colorClass = 'text-yellow-300';
    if (ft.type === 'DEBUFF') colorClass = 'text-purple-400';

    return (
        <div
            className={`
                absolute top-0 left-1/2 -translate-x-1/2 font-bold text-2xl z-50 pointer-events-none whitespace-nowrap
                ${colorClass}
            `}
            style={{ 
                animation: 'floatUp 1s ease-out forwards' 
            }}
        >
            {ft.text}
            <style jsx>{`
                @keyframes floatUp {
                    0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
                    20% { transform: translate(-50%, -30px) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -80px) scale(1); opacity: 0; }
                }
            `}</style>
        </div>
    );
}