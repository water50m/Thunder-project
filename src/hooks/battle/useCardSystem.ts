import { useState } from 'react';
import { CARD_POOL, Card as CardType } from '@/data/cards';

export function useCardSystem() {
  const [hand, setHand] = useState<CardType[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const drawCards = (count: number, currentHand: CardType[] = []) => {
    const newCards: CardType[] = [];
    for (let i = 0; i < count; i++) {
      const proto = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      newCards.push({ ...proto, id: `${proto.id}-${Date.now()}-${i}` });
    }
    setHand([...currentHand, ...newCards]);
  };

  const removeCardFromHand = (cardId: string) => {
    setHand(prev => prev.filter(c => c.id !== cardId));
    setSelectedCardId(null);
  };

  const selectCard = (id: string, phase: string) => {
    if (phase === 'PLAYER_THINKING' || phase === 'PLAYER_RESTOCK') {
      setSelectedCardId(id === selectedCardId ? null : id);
    }
  };

  return {
    hand,
    setHand,
    selectedCardId,
    setSelectedCardId,
    drawCards,
    removeCardFromHand,
    selectCard
  };
}