import { Card as CardType } from '@/data/cards';
import { Character } from '@/data/characters';
import { ActiveStatus, EffectType } from '@/data/typesEffect';

// Interface สำหรับผลลัพธ์การคำนวณการ์ด
export interface CardActionResult {
  damage: number;
  heal: number;
  shield: number;
  selfDamage: number;
  effectsToAdd: { target: number, status: ActiveStatus }[];
  textsToAdd: { target: number, text: string, type: EffectType}[];
  shouldExplodeShield: boolean;
}

export function calculateCardEffect(
  card: CardType,
  actor: Character,
  actorShield: number,
  targetShield: number,
  targetStatuses: ActiveStatus[],
  bonus: number
): CardActionResult {
  
  const result: CardActionResult = {
    damage: 0, heal: 0, shield: 0, selfDamage: 0,
    effectsToAdd: [], textsToAdd: [], shouldExplodeShield: false
  };
  
  let calculatedValue = card.value + bonus;

  // --- Logic แยกตาม Effect ---
  switch (card.effect) {
    case 'ShieldBased':
      result.damage = actor.stats.atk + actorShield;
      result.textsToAdd.push({ target: -1, text: "Shield Bash!", type: 'BUFF' }); // -1 หมายถึง Actor
      break;

    case 'ShieldExplode':
      result.damage = actorShield * 3;
      result.shouldExplodeShield = true;
      result.textsToAdd.push({ target: -1, text: "Explode!", type: 'BUFF' });
      break;

    case 'BurnDetonate':
        // Logic การระเบิด Burn (ย้ายจาก hook มาที่นี่)
        let totalExplodeDmg = 0;
        targetStatuses.forEach(s => {
             if (s.type === 'DOT') totalExplodeDmg += (s.value * s.duration);
        });
        result.damage = totalExplodeDmg;
        result.textsToAdd.push({ target: -2, text: `Combustion! ${totalExplodeDmg}`, type: 'BUFF' }); // -2 Target
        break;

    case 'ApplyDot': 
       result.effectsToAdd.push({
         target: -2, // ใส่ศัตรู
         status: { 
           id: `dot-${Date.now()}`, 
           type: 'DOT', 
           value: card.value, 
           duration: card.duration || 3, 
           icon: '☠️' 
         }
       });
       result.textsToAdd.push({ target: -2, text: "Poisoned!", type: "DEBUFF" });
       break;

    case 'ApplyRegen':
       result.effectsToAdd.push({
         target: -1, // ใส่ตัวเอง
         status: { 
            id: `hot-${Date.now()}`, 
            type: 'HOT', 
            value: card.value, 
            duration: card.duration || 3, 
            icon: '💖' 
         }
       });
       result.textsToAdd.push({ target: -1, text: "Regen!", type: "BUFF" });
       break;

    case 'ApplyStun':
       result.effectsToAdd.push({
         target: -2,
         status: {
            id: `stun-${Date.now()}`,
            type: 'DEBUFF', // หรือจะตั้ง Type เป็น 'STUN' ก็ได้ถ้า logic ซับซ้อน
            value: 0,
            duration: 1,
            icon: '❄️'
         }
       });
       result.textsToAdd.push({ target: -2, text: "Stunned!", type: "DEBUFF" });
       break;

    
    default:
        // Default Attack / Heal / Defend
        if (card.type === 'Attack') result.damage = calculatedValue;
        else if (card.type === 'Heal') result.heal = calculatedValue;
        else if (card.type === 'Defend') result.shield = calculatedValue;
        break;
  }

  return result;
}