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
  shouldCleanse?: boolean;
  statsModifier?: { 
      atk?: number;
      def?: number; 
      power?: number;
      criRate?:number; //%
      criDmg?:number; //%
  };
}

export function calculateCardEffect(
  card: CardType,
  actor: BattleUnit,
  actorShield: number,
  targetShield: number,
  targetStatuses: ActiveStatus[] = [], // Default []
  bonus: CardBonus = { damage: 0, block: 0 } // ✅ รับเป็น Object แทน number
): CardActionResult {
  console.log('use: ',card.effect,' type: ',card.type,'id: ',card.id);


  const result: CardActionResult = {
    damage: 0, heal: 0, shield: 0, selfDamage: 0,
    effectsToAdd: [], textsToAdd: [], shouldExplodeShield: false
  };
  if (card.type === 'Attack' ) {
      // 1. Base Calculation: (ค่าการ์ด + ATK ตัวละคร + โบนัส)
      let totalAtk = actor.character.stats.atk || 0;

        // วนลูปเช็ค Status ของตัวเรา
        if (actor.statuses) {
            actor.statuses.forEach(s => {
                // ถ้าเจอสถานะที่เป็น 'BUFF_ATK' ให้เอาค่า value มาบวกเพิ่ม
                if (s.type === 'ATK_UP') {
                    totalAtk += s.value;
                }
                // (อนาคต) ถ้ามี 'DEBUFF_ATK' (โดนลดพลัง) ก็เขียนลบตรงนี้ได้
                // else if (s.type === 'WEAK_ATK') totalAtk -= s.value;
            });
        }

        // 2. เข้าสูตรคำนวณ (ใช้ totalAtk ที่รวมบัฟแล้ว)
     
        let dmg = (card.value || 0) + totalAtk + bonus.damage;

        // ... (Logic Vulnerable / Critical ) ...
        const isVulnerable = targetStatuses.some(s => s.type === 'WEAK');
        if (isVulnerable) {
            dmg = Math.floor(dmg * 1.5);
            result.textsToAdd.push({ target: -2, text: "Crit!", type: "DMG" });
        }

        result.damage = dmg;
  } 
  else if (card.type === 'Heal') {
      // สูตร: ค่าการ์ด + Power
      result.heal = (card.value || 0) + (actor.character.stats.power || 0);
      
  } 
  else if (card.type === 'Barrier') {
      // สูตร: ค่าการ์ด + DEF + โบนัส Block
      result.shield = (card.value || 0) + (actor.character.stats.def || 0) + bonus.block;
  }


  if(card.effect && card.effect !== 'None') {
    // --- Logic แยกตาม Effect (โครงสร้างเดิมของคุณ) ---
    switch (card.effect) {
    // ---------------------------------------------------------
    // Shield
    // ---------------------------------------------------------
      case 'Barrier':      // ✅ เพิ่ม case Barrier  
          // 1. ใช้สูตรคำนวณเกราะเหมือนกัน
          result.shield = (card.value || 0) + (actor.character.stats.def || 0) + bonus.block;
          result.textsToAdd.push({ target: -1, text: "Barrier!", type: "BUFF" });
          break;
      
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

      // ---------------------------------------------------------
      // DAMAGE
      // ---------------------------------------------------------
      case 'DmgOneHit': 
    {
        // 1. คำนวณ ATK รวม (Base ATK + บัฟ ATK จาก Status)
        let totalAtk = actor.character.stats.atk || 0;
        if (actor.statuses) {
            actor.statuses.forEach(s => {
                if (s.type === 'ATK_UP') totalAtk += s.value;
            });
        }

        // 2. คำนวณดาเมจพื้นฐาน (ค่าการ์ด + ATK รวม + โบนัสของขลัง)
        let dmg = (card.value || 0) + totalAtk + bonus.damage;

        // 3. เช็คสถานะ Weak ของเป้าหมาย (แพ้ทาง/โดนเจาะเกราะ)
        const isVulnerable = targetStatuses.some(s => s.type === 'WEAK');
        if (isVulnerable) {
            dmg = Math.floor(dmg * 1.5); // แรงขึ้น 50%
            result.textsToAdd.push({ target: -2, text: "Crit!", type: "DMG" });
        }

        result.damage = dmg;
        break;
    }
    case 'DOT':
    {
        // การ์ด DOT มักจะไม่ทำดาเมจทันที (หรือทำนิดหน่อย) แต่เน้นยัดสถานะ
        
        // 1. (Optional) ถ้าอยากให้มีดาเมจเปิดหัวนิดหน่อย ให้เปิดบรรทัดนี้:
        // result.damage = Math.floor((actor.character.stats.atk || 0) * 0.5); 

        // 2. สร้าง Status Effect ส่งไปแปะศัตรู
        result.effectsToAdd.push({
            target: -2, // -2 คือเป้าหมายที่เราเลือก (Enemy)
            status: { 
                id: `dot-${Date.now()}`, 
                type: 'DOT',         // ⚠️ ต้องตรงกับระบบ Process Turn ของคุณ (เช่น 'POISON', 'BURN')
                value: card.value || 5,   // ลดเลือดเทิร์นละเท่าไหร่
                duration: card.duration || 3, // อยู่นานกี่เทิร์น
                icon: '☠️'           // ไอคอนหัวกะโหลก
            }
        });

        // 3. แจ้งเตือน UI
        result.textsToAdd.push({ target: -2, text: "Poisoned", type: "DEBUFF" });
        break;
    }

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
      // ---------------------------------------------------------
      // HEAL
      // ---------------------------------------------------------
      case 'CleanseHeal':
        // ---------------------------------------------------
        // 1. ส่วน HEAL (คำนวณยอดฮีล)
        // ---------------------------------------------------
        // สูตร: ค่าการ์ด + Power
        result.heal = (card.value || 0) + (actor.character.stats.power || 0);

        // ---------------------------------------------------
        // 2. ส่วน CLEANSE (ส่งคำสั่งให้ล้างสถานะ)
        // ---------------------------------------------------
        result.shouldCleanse = true; 

        // ---------------------------------------------------
        // 3. Visual (ข้อความเด้ง)
        // ---------------------------------------------------
        // แจ้งเตือนว่า "Cleanse" (ส่วนตัวเลขฮีล เดี๋ยวระบบ Heal จะเด้งให้เอง)
        result.textsToAdd.push({ target: -1, text: "Purify!", type: "BUFF" });
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

      case 'HealOverTime':
        // 1. คำนวณความแรงต่อเทิร์น (Base + Power)
        const hotValue = (card.value || 0) + (actor.character.stats.power || 0);

        // 2. ยัด Status 'HOT' (Heal Over Time) ใส่ตัวเรา (-1)
        result.effectsToAdd.push({
            target: -1, // -1 = ใส่ตัวคนร่าย
            status: { 
                id: `hot-${Date.now()}`, 
                type: 'HOT',         // ต้องตรงกับระบบ Status ของคุณ
                value: hotValue,     // ฮีลเทิร์นละเท่าไหร่
                duration: card.duration || 3, // นานกี่เทิร์น (Default 3)
                icon: '🌿'           // ไอคอนใบไม้ หรือหัวใจ
            }
        });

        // 3. แจ้งเตือน UI
        result.textsToAdd.push({ target: -1, text: "Regen", type: "BUFF" });
        break;

      case 'HealOneTime':
        // สูตร: ค่าการ์ด + Power (ฮีลตู้มเดียวจบ)
        result.heal = (card.value || 0) + (actor.character.stats.power || 0);
        
        // (Optional) ถ้าอยากให้มี Text เด้งบอกว่า Heal ก็ใส่เพิ่มได้
        // result.textsToAdd.push({ target: -1, text: "Heal", type: "HEAL" });
        break;

      // ---------------------------------------------------------
      // BUFF
      // ---------------------------------------------------------
      case 'BuffAttack':
        // 1. กำหนดค่าพลังที่จะเพิ่ม และระยะเวลา
        const buffAmount = card.value || 5; // เพิ่ม ATK เท่าไหร่ (Default 5)
        const buffDuration = card.duration || 3; // อยู่นานกี่เทิร์น (Default 3)

        // 2. ยัด Status 'ATK_UP' ใส่ตัวเรา (-1)
        result.effectsToAdd.push({
            target: -1, // -1 = ตัวเราเอง
            status: {
                id: `atkup-${Date.now()}`,
                type: 'ATK_UP',     // ⚠️ ตั้งชื่อ type ให้ไม่ซ้ำกับพวก DOT/STUN
                value: buffAmount,  // ค่าที่จะเอาไปบวกเพิ่มตอนตี
                duration: buffDuration,
                icon: '⚔️'        // ไอคอนดาบ
            }
        });

        // 3. แจ้งเตือน UI
        result.textsToAdd.push({ target: -1, text: `ATK +${buffAmount}`, type: "BUFF" });
        break;
      
      // ---------------------------------------------------------
      // CC
      // ---------------------------------------------------------
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
      
      case 'Drain':
            // ✅ ทำงานเฉพาะตอนมี Damage (ต้องเป็น Card Type: Attack มาก่อน)
            if (result.damage > 0) {
                const drainAmount = Math.floor(result.damage * 0.3);
                if (drainAmount > 0) {
                    result.heal = drainAmount;
                    result.textsToAdd.push({ target: -1, text: `Drain`, type: "HEAL" });
                }
        }
        break;



    }   
  }
  return result;
}