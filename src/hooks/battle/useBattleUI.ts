import { useState, useEffect, useCallback } from 'react';
import { FloatingTextData, FloatingTextType } from '@/data/typesEffect';

export function useBattleUI() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[][]>([[], [], [], []]);
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
      // 1. สร้าง Object ให้ตรงกับ Interface FloatingTextData
      const newTextData: FloatingTextData = {
          side: side,
          id: Date.now().toString(), // แปลงเป็น string ตาม interface
          text: text,
          type: type
      };

      // 2. Logic การอัปเดต State (แยกฝั่งตาม side)
      if (side === 'PLAYER') {
          setFloatingTexts((prev) => {
              const newState = [...prev];
              // ตรวจสอบว่ามี Array ของตัวละครนี้หรือยัง ถ้ายังให้สร้างใหม่
              if (!newState[index]) newState[index] = [];
              
              // เพิ่มข้อมูลใหม่เข้าไป
              newState[index].push(newTextData);
              return newState;
          });
      } else {
          // TODO: จัดการฝั่ง ENEMY (ถ้ามี State แยก)
          // setEnemyFloatingTexts(...) 
          console.log("Enemy Floating Text:", newTextData);
      }

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
      const newTexts = prev.map(arr => [...arr]);
      newTexts[targetIdx] = newTexts[targetIdx].filter(t => t.id !== textId);
      return newTexts;
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