import { useState, useCallback } from 'react';
import { FloatingTextData, FloatingTextType } from '@/data/typesEffect';

// Interface สำหรับ State การสั่น

export type ShakeType = 'NONE' | 'DAMAGE' | 'BLOCK';

export interface ShakingState {
    players: ShakeType[];
    enemies: ShakeType[];
}

export function useBattleUI() {
    const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
    const [log, setLog] = useState<string>("เริ่มเกม! เลือกตัวละคร + เลือกการ์ด");
    
    // ✅ 1. เปลี่ยน shaking เป็น Object แยกฝั่ง (ไม่ต้องกำหนด size ล่วงหน้าก็ได้)
    const [shaking, setShaking] = useState<ShakingState>({
        players: [],
        enemies: []
    });

    const addFloatingText = useCallback((
        side: 'PLAYER' | 'ENEMY', 
        index: number, 
        text: string, 
        type: FloatingTextType
    ) => {
        const newTextData: FloatingTextData = {
            id: Date.now().toString() + Math.random().toString(),
            side: side,
            targetIndex: index,
            text: text,
            type: type
        };

        setFloatingTexts((prev) => [...prev, newTextData]);
    }, []);

    // ✅ 2. Logic สั่น: สั่งเปิด -> รอ -> สั่งปิด (จบในตัว ไม่ต้องใช้ useEffect)
    const triggerShake = useCallback((
        side: 'PLAYER' | 'ENEMY', 
        index: number, 
        type: ShakeType = 'DAMAGE' // default เป็น DAMAGE
    ) => {
        const targetKey = side === 'PLAYER' ? 'players' : 'enemies';

        // 1. สั่งสั่นตาม Type ที่ส่งมา ('DAMAGE' หรือ 'BLOCK')
        setShaking(prev => {
            const newState = { ...prev };
            const newList = [...(newState[targetKey] || [])];
            
            newList[index] = type; // ✅ เก็บค่าเป็น string แทน true
            
            newState[targetKey] = newList;
            return newState;
        });

        // 2. ตั้งเวลา Reset กลับเป็น 'NONE'
        setTimeout(() => {
            setShaking(prev => {
                const newState = { ...prev };
                const newList = [...(newState[targetKey] || [])];
                
                newList[index] = 'NONE'; // ✅ Reset เป็น NONE แทน false
                
                newState[targetKey] = newList;
                return newState;
            });
        }, 500); // 0.5s เท่าเดิม

    }, []);

    const handleFloatingTextComplete = useCallback((targetIdx: number, textId: string) => {
        setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, []);

    // ❌ ลบ useEffect อันเก่าทิ้งได้เลยครับ ไม่จำเป็นแล้ว

    return {
        floatingTexts,
        shaking, // return เป็น Object { players: [], enemies: [] }
        log,
        setLog,
        addFloatingText,
        triggerShake,
        handleFloatingTextComplete
    };
}