// src/utils/battleLogic.ts
import { Character } from '@/data/characters';
import { Card } from '@/data/cards';
import { ActiveStatus } from '@/data/typesEffect';

// 1. สูตรคำนวณความเสียหาย (หักลบเกราะ)
export const calculateDamage = (currentHp: number, currentShield: number, damage: number) => {
  let newHp = currentHp;
  let newShield = currentShield;

  if (newShield >= damage) {
    newShield -= damage;
  } else {
    const remainingDmg = damage - newShield;
    newShield = 0;
    newHp = Math.max(0, newHp - remainingDmg);
  }

  return { hp: newHp, shield: newShield };
};

// 2. สูตรคำนวณโบนัสการ์ด (Role + Status Buff)
export const calculateCardBonus = (
  character: Character, 
  card: Card, 
  statuses: ActiveStatus[] = []
): number => {
  // 2.1 หา Buff Power จาก Status
  let powerBuff = 0;
  statuses.forEach(s => {
    if (s.type === 'BUFF_POWER') powerBuff += s.value;
  });

  // 2.2 หา Bonus จาก Role
  let roleBonus = 0;
  if (
    (character.role === 'Attacker' && card.type === 'Attack') ||
    (character.role === 'Defender' && card.type === 'Defend') ||
    (character.role === 'Support' && card.type === 'Heal')
  ) {
    roleBonus = character.stats.power;
  } else if (character.role === 'Balanced') {
    roleBonus = Math.floor(character.stats.power / 2);
  }

  return roleBonus + powerBuff;
};

// 3. สูตรคำนวณ Ultimate Charge (ไม่ให้เกิน Max)
export const calculateUltCharge = (currentUlt: number, maxUlt: number, chargeAmt: number) => {
  return Math.min(maxUlt, currentUlt + chargeAmt);
};