import { useState, useEffect, useCallback } from 'react';
import { FloatingTextData, FloatingTextType } from '@/data/typesEffect';

export function useBattleUI() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[][]>([[], [], [], []]);
  const [shaking, setShaking] = useState<boolean[]>([false, false, false, false]);
  const [log, setLog] = useState<string>("เริ่มเกม! เลือกตัวละคร + เลือกการ์ด");

  const addFloatingText = useCallback((targetIdx: number, text: string, type: FloatingTextType) => {
    setFloatingTexts(prev => {
      const newTexts = prev.map(arr => [...arr]);
      newTexts[targetIdx].push({ id: `ft-${Date.now()}-${Math.random()}`, text, type });
      return newTexts;
    });
  }, []);

  const triggerShake = useCallback((targetIdx: number) => {
    setShaking(prev => {
      const newShake = [...prev];
      newShake[targetIdx] = true;
      return newShake;
    });
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