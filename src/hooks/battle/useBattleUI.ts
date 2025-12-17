import { useState, useEffect, useCallback } from 'react';
import { FloatingTextData, FloatingTextType } from '@/data/typesEffect';

export function useBattleUI() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
  const [shaking, setShaking] = useState<boolean[]>([false, false, false, false]);
  const [log, setLog] = useState<string>("เริ่มเกม! เลือกตัวละคร + เลือกการ์ด");
  const [shakeState, setShakeState] = useState<{
      players: boolean[];
      enemies: boolean[];
  }>({
      players: [],
      enemies: []
  });

    const addFloatingText = useCallback((
        side: 'PLAYER' | 'ENEMY', 
        index: number, 
        text: string, 
        type: FloatingTextType
    ) => {
        // 1. สร้าง Object (เพิ่ม targetIndex เข้าไป)
        const newTextData: FloatingTextData = {
            id: Date.now().toString() + Math.random().toString(), // กัน id ซ้ำ
            side: side,
            targetIndex: index, // ✅ ใส่ index ของเป้าหมายลงไป
            text: text,
            type: type
        };

        // 2. Logic การอัปเดต State (รวมกันถังเดียว ไม่ต้องแยก if)
        setFloatingTexts((prev) => {
            // แค่เติมของใหม่ต่อท้าย Array ไปเลย ง่ายและรองรับทั้ง PLAYER/ENEMY
            return [...prev, newTextData];
        });

    }, []);


  const triggerShake = useCallback((side: 'PLAYER' | 'ENEMY', index: number) => {
    setShakeState(prev => {
        const targetKey = side === 'PLAYER' ? 'players' : 'enemies';
        
        // Copy state เดิมมาแก้ไข
        const newObj = { ...prev };
        const newList = [...newObj[targetKey]];
        
        newList[index] = true; // สั่งให้สั่น
        newObj[targetKey] = newList;
        
        return newObj;
    });

    // ตั้งเวลาให้หยุดสั่น (Reset)
    setTimeout(() => {
        setShakeState(prev => {
            const targetKey = side === 'PLAYER' ? 'players' : 'enemies';
            const newObj = { ...prev };
            const newList = [...newObj[targetKey]];
            
            newList[index] = false; // หยุดสั่น
            newObj[targetKey] = newList;
            
            return newObj;
        });
    }, 500); // 0.5 วินาที
}, []);

  // Auto Reset Shaking logic
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    shaking.forEach((isShaking, idx) => {
      if (isShaking) {
        const timer = setTimeout(() => {
          setShaking(prev => {
            const newShaking = [...prev];
            newShaking[idx] = false;
            return newShaking;
          });
        }, 400);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [shaking]);

  const handleFloatingTextComplete = useCallback((targetIdx: number, textId: string) => {
    
      setFloatingTexts(prev => {
          // ✅ Logic ใหม่: "กรอง" เอาเฉพาะตัวที่ ID ไม่ตรงกับอันที่จะลบ
          // (พูดง่ายๆ คือ เก็บตัวอื่นไว้ ลบตัวนี้ทิ้ง)
          return prev.filter(t => t.id !== textId);
      });

  }, []);

  return {
    floatingTexts,
    shaking,
    log,
    setLog,
    addFloatingText,
    triggerShake,
    handleFloatingTextComplete
  };
}