import { Card as CardType } from '@/data/cards';
import { ActiveStatus, EffectType } from '@/data/typesEffect';
import { BattleUnit } from '@/types/battles';

// ✅ 1. เพิ่ม Interface นี้เพื่อให้รับค่า Bonus แบบแยกสายได้
export interface CardBonus {
  damage: number;
  block: number;
}

export interface CardActionResult {
  damage: number;
  heal: number;
  shield: number;
  selfDamage: number;
  effectsToAdd: { target: number, status: ActiveStatus }[];
  textsToAdd: { target: number, text: string, type: EffectType | string }[]; // อนุโลม string เผื่อ type ไม่ตรง
  shouldExplodeShield: boolean;
}

export function calculateCardEffect(
  card: CardType,
  actor: BattleUnit,
  actorShield: number,
  targetShield: number,
  targetStatuses: ActiveStatus[] = [], // Default []
  bonus: CardBonus = { damage: 0, block: 0 } // ✅ รับเป็น Object แทน number
): CardActionResult {
  
  const result: CardActionResult = {
    damage: 0, heal: 0, shield: 0, selfDamage: 0,
    effectsToAdd: [], textsToAdd: [], shouldExplodeShield: false
  };

  // --- Logic แยกตาม Effect (โครงสร้างเดิมของคุณ) ---
  switch (card.effect) {
    case 'ShieldBased':
      // สูตร: ATK + เกราะปัจจุบัน
      result.damage = (actor.character.stats.atk || 0) + actorShield + bonus.damage;
      result.textsToAdd.push({ target: -1, text: "Shield Bash!", type: 'BUFF' });
      break;

    case 'ShieldExplode':
      result.damage = actorShield * 3;
      result.shouldExplodeShield = true;
      result.textsToAdd.push({ target: -1, text: "Explode!", type: 'BUFF' });
      break;

    case 'ShieldBreaker':
    // ถ้าศัตรูมีเกราะ ให้ตีแรงขึ้น 2 เท่า 
    let baseDmg = (card.value || 0) + (actor.character.stats.atk || 0);
    
    if (targetShield > 0) {
        baseDmg *= 2; // คูณ 2
        result.textsToAdd.push({ target: -2, text: "Break!", type: "DMG" });
    }
    
    result.damage = baseDmg;
    break;

    case 'ShieldSteal':
    // ขโมยเกราะ 50% ของศัตรูมาเป็นของเรา
    const stealAmount = Math.floor(targetShield * 0.5);
    
    if (stealAmount > 0) {
        result.shield = stealAmount; // เพิ่มเกราะให้เรา
        // คุณอาจต้องเพิ่ม field พิเศษใน result เพื่อบอกให้ไปลดเกราะศัตรูด้วย (เช่น damageShield: number)
        // หรือใช้วิธีทำ Damage เท่ากับเกราะที่ขโมย (แต่เป็น True Damage)
        result.damage = stealAmount; 
        result.textsToAdd.push({ target: -1, text: `Stole ${stealAmount}`, type: "BUFF" });
    }
    break;

    case 'BurnDetonate':
        let totalExplodeDmg = 0;
        targetStatuses.forEach(s => {
             if (s.type === 'DOT') totalExplodeDmg += (s.value * s.duration);
        });
        result.damage = totalExplodeDmg;
        result.textsToAdd.push({ target: -2, text: `Combustion! ${totalExplodeDmg}`, type: 'BUFF' });
        break;

    case 'ApplyDot': 
       result.effectsToAdd.push({
         target: -2,
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
         target: -1,
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
            type: 'DEBUFF',
            value: 0,
            duration: 1,
            icon: '❄️'
         }
       });
       result.textsToAdd.push({ target: -2, text: "Stunned!", type: "DEBUFF" });
       break;
       
    // เพิ่ม Effect พิเศษอื่นๆ เช่น Pierce
    case 'Pierce':
        // คำนวณดาเมจปกติ แต่เดี๋ยว battleLogic จะจัดการเรื่องทะลุเกราะเอง หรือเราจะเพิ่ม text บอกก็ได้
        result.damage = (card.value || 0) + (actor.character.stats.atk || 0) + bonus.damage;
        result.textsToAdd.push({ target: -2, text: "Pierce!", type: "DEBUFF" });
        break;

    default:
        
        if (card.type === 'Attack') {
            // 1. Base Calculation: (ค่าการ์ด + ATK ตัวละคร + โบนัส)
            let dmg = (card.value || 0) + (actor.character.stats.atk || 0) + bonus.damage;

            // 2. Vulnerable Check (เช็คว่าศัตรูอ่อนแอไหม)
            const isVulnerable = targetStatuses.some(s => s.type === 'WEAK' || s.type === 'DEBUFF');
            if (isVulnerable) {
                dmg = Math.floor(dmg * 1.5); // แรงขึ้น 50%
                result.textsToAdd.push({ target: -2, text: "Crit!", type: "DMG" });
            }

            result.damage = dmg;
        } 
        else if (card.type === 'Heal') {
            // สูตร: ค่าการ์ด + Power
            result.heal = (card.value || 0) + (actor.character.stats.power || 0);
        } 
        else if (card.type === 'Defend') {
            // สูตร: ค่าการ์ด + DEF + โบนัส Block
            result.shield = (card.value || 0) + (actor.character.stats.def || 0) + bonus.block;
        }
        break;
  }
  return result;
}