'use client';

import { useState, useEffect } from 'react';
import { useBattle } from '@/hooks/battle/useBattle';
import EnemyField from '@/components/battle/EnemyField';
import { Character } from '@/data/characters'
import UnitCard from '@/components/UnitCard'

// --- Main Component ---
export default function BattlePage() {
  const {
    team, 
    battleState, 
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
    cheat,
  } = useBattle();

  // Helper สำหรับเรียงลำดับการแสดงผลทีม (Back Row -> Front Row)
  // เราต้องการแสดง: [Team 1 (Back)] [Team 0 (Front)] --- VS --- [Boss]
  // ดังนั้นเราจะ map จาก array ที่ reverse แล้ว (หรือเรียงตาม logic นี้)
  const displayTeam = [...team].reverse(); // ถ้ามี 2 ตัว: [Char2, Char1] -> Char2 อยู่ซ้ายสุด(หลัง), Char1 อยู่ขวา(หน้า)
  const [loading, setLoading] = useState(true);
  const [isCheatOpen, setCheatOpen] = useState(false);
  const [cheatInput, setCheatInput] = useState('');

  useEffect(() => {
    const setupBattle = async () => {
        try {
            const savedDeckId = JSON.parse(localStorage.getItem('playerDeck') || 'null');
             //  ดึงข้อมูล Deck ทั้งหมด
            const deckRes = await fetch(`/api/decks?id=${savedDeckId}`);
            if (!deckRes.ok) throw new Error("Failed to fetch decks");
            const decks = await deckRes.json();
            const savedCharacter = localStorage.getItem('myTeam');

            let myChar: Character[] = [];
            let allSkillCards: string[] = [];
            if (savedCharacter) {
                try {
                    const parsedTeam = JSON.parse(savedCharacter);
                    
                    // ตอนนี้ parsedTeam เป็น Array จริงๆ แล้ว เช็คได้เลย
                    if (Array.isArray(parsedTeam) && parsedTeam.length > 0) {
                        myChar = parsedTeam; // เอาตัวแรกในทีมมาเล่น


                        // 3. รวมการ์ดทั้งหมดเข้าด้วยกัน (ใช้ flatMap คือวิธีที่ง่ายที่สุด)
                        // flatMap จะดึง array ย่อยออกมาแล้วแบให้เป็น array เดียวชั้นเดียว
                        allSkillCards = parsedTeam.flatMap(char => char.equipedSkillCard || []);
                        
                        // หมายเหตุ: ถ้า TypeScript บ่นว่าไม่มี flatMap ให้ใช้แบบนี้แทน:
                        // allSkillCards = myTeam.reduce((a
                    }
                } catch (error) {
                    console.error("Error parsing team data:", error);
                }
            }
           
            // เพิ่ม cardskill ลง deck
            // สมมติใน characters.json มี field "selectedDeckId": "deck-001"
            // ถ้าไม่มี ให้ใช้ Deck แรกสุดเป็น Default
            
            // สมมติว่าเราจะแก้ที่ Deck ตัวแรก (index 0)
            
            const targetDeck = decks;

            // ตรวจสอบว่ามี key 'cardIDs' อยู่ไหม ถ้าไม่มีให้เริ่มด้วย array ว่าง
            // (หมายเหตุ: เช็คชื่อ key ดีๆ นะครับ ใน database คุณใช้ 'cards' หรือ 'cardIDs')
            const existingCards = targetDeck.cardIds || targetDeck.cards || []; 

            // 🔥 รวมร่าง! (Deck หลัก + Skill Cards)
            targetDeck.cardIds = [...existingCards, ...allSkillCards];
            

                       
            // ได้รายชื่อการ์ดมาแล้ว (Array of IDs)
            const cardList = targetDeck.cardIds // Fallback

            // 4. ส่งเข้า initializeGame
            if (myChar) {
                initializeGame(myChar, cardList);
            } else {
                console.error("No character found!");
            }

        } catch (error) {
            console.error("Setup failed:", error);
        } finally {
            setLoading(false);
        }
    };

    setupBattle();
  }, []);

  // ฟังก์ชันเวลากด Enter หรือปุ่ม Run
const handleSubmitCheat = (e: React.FormEvent) => {
    e.preventDefault(); // กันหน้าเว็บ Refresh
    if (cheatInput.trim()) {
        cheat(cheatInput.trim()); // ส่งค่าไปฟังก์ชัน cheat
        setCheatInput(''); // ล้างช่อง
    }
};

  if (!team || team.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="animate-pulse text-xl">Loading Battle...</div>
        </div>
    );
  }
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
      <div className="absolute top-16 right-4 z-50 flex flex-col items-end font-mono">
    
        {/* 1. ปุ่ม Toggle เปิด/ปิด (จะจางๆ ถ้าไม่ได้เอาเมาส์ไปชี้) */}
        <button 
            onClick={() => setCheatOpen(!isCheatOpen)}
            className="mb-2 bg-black/50 hover:bg-black/90 text-white p-2 rounded-full border border-gray-600 transition-all shadow-lg backdrop-blur-sm"
            title="Open Developer Console"
        >
            {isCheatOpen ? '❌' : '💻_'}
        </button>

        {/* 2. ช่องพิมพ์คำสั่ง (แสดงเฉพาะตอนเปิด) */}
        {isCheatOpen && (
            <div className="bg-black/90 p-3 rounded-lg border border-gray-700 shadow-2xl animate-in slide-in-from-right-5 fade-in duration-200">
                
                {/* Form สำหรับพิมพ์แล้วกด Enter ได้เลย */}
                <form onSubmit={handleSubmitCheat} className="flex gap-2">
                    <input 
                        type="text" 
                        value={cheatInput}
                        onChange={(e) => setCheatInput(e.target.value)}
                        placeholder="cmd: killboss, fullult..."
                        className="bg-gray-800 text-green-400 text-xs px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none w-48 placeholder-gray-500"
                        autoFocus // เปิดมาแล้วพิมพ์ได้เลย
                    />
                    <button 
                        type="submit"
                        className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2 rounded font-bold"
                    >
                        RUN
                    </button>
                </form>

                {/* (Optional) ปุ่มลัดสำหรับคำสั่งที่ใช้บ่อย */}
                <div className="mt-2 flex gap-2 justify-end">
                    <button onClick={() => cheat('killboss')} className="text-[10px] text-red-400 hover:text-red-300 underline">KillBoss</button>
                    <button onClick={() => cheat('fullult')} className="text-[10px] text-yellow-400 hover:text-yellow-300 underline">FullUlt</button>
                    <button onClick={() => cheat('draw')} className="text-[10px] text-blue-400 hover:text-blue-300 underline">Draw</button>
                </div>
            </div>
        )}
    </div>

      {/* --- BATTLE AREA (Center Stage) --- */}
      <div className="flex-1 flex items-center justify-between px-8 md:px-16 lg:px-24 w-full max-w-[1600px] mx-auto pb-32">
        
        {/* === LEFT SIDE: PLAYERS === */}
       <div className="flex items-center gap-4 md:gap-8 lg:gap-12 perspective-1000">
    {displayTeam.map((char) => {
        // 1. หา Unit ตัวจริงจาก State ก่อน (สำคัญที่สุด!)
        const realIndex = team.findIndex(c => c.id === char.id);
        const unit = battleState.players[realIndex];

        // ⚠️ กันเหนียว: ถ้ายังโหลดไม่เสร็จ หรือหาไม่เจอ ให้ return null ไปก่อน
        if (!unit) return null; 

        // 3. UI States (พวกการแสดงผล)
        const isSelected = selectedCharId === char.id;
        
        // เช็ค Shaking (ต้องดูว่า shaking เก็บเป็น array ธรรมดาหรือแยก side)
        // สมมติว่าเก็บแบบ index ตรงตัว
        const isShaking = shaking[realIndex]; 


        return (
            <UnitCard
                key={char.id}
                index={realIndex}
                name={char.name}
                role={char.role}
                
                // ✅ แก้จุดที่ 1: ใส่ Stats ให้ครบ และดึงจาก unit
                currentHp={unit.currentHp}     // 
                maxHp={unit.maxHp}             // 
                shield={unit.shield}           // 
                currentUlt={unit.currentUlt}   // 
                maxUlt={unit.maxUlt}           
                
                isDead={unit.isDead}           // ใช้จาก unit ชัวร์สุด
                isSelected={isSelected}
                isShaking={isShaking}

                // ✅ แก้จุดที่ 2: Statuses ไม่ได้อยู่แยกแล้ว แต่อยู่ใน unit
                statuses={unit.statuses} 
                
                // ✅ แก้จุดที่ 3: Floating Texts (ต้องเช็คว่าคุณเก็บ state นี้ยังไง)
                // ถ้าคุณแก้ floatingTexts เป็น Array เดียวรวมกันหมดแล้ว (ตามที่แนะนำเรื่อง side)
                // ต้อง filter เอาเฉพาะของตัวเอง:
                floatingTexts={floatingTexts.filter(ft => ft.side === 'PLAYER' && ft.targetIndex === realIndex)}
                
                position={realIndex === 0 ? 'FRONT' : 'BACK'}

                // ... Event Handlers เดิม ใช้ได้ครับ ...
                onSelect={() => selectChar(char.id)}
                onShowFloatingText={(idx, text, type) => console.log(text)}
                onUltimate={() => handleUltimate(char.id)}
                
                // ถ้า handleFloatingTextComplete ของคุณรับแค่ (index, id) อาจต้องแก้ให้รับ side ด้วยในอนาคต
                // แต่ตอนนี้ใช้แบบนี้ไปก่อนได้ครับ
                onFloatingTextComplete={(id) => handleFloatingTextComplete(realIndex, id)}
            />
        );
    })}
</div>

        {/* === VS VISUAL (Optional) === */}
        {/* <div className="text-6xl font-black text-white/5 italic opacity-30 select-none">VS</div> */}

        {/* === RIGHT SIDE: BOSS === */}
        <EnemyField 
             enemies={battleState.enemies} 
             shaking={shaking}
             floatingTexts={floatingTexts}
             enemyCardDisplay={enemyCardDisplay}
             onFloatingTextComplete={handleFloatingTextComplete}
          />

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