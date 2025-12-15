import { Character} from '@/data/characters';
import { ActiveStatus, UltimateEffect} from '@/data/typesEffect';
import { calculateDamage } from '@/utils/battleLogic';

// Structure สำหรับสิ่งที่ต้องส่งเข้าไปคำนวณ
interface ExecuteContext {
  actorIndex: number;
  team: Character[];
  hp: number[];
  shield: number[];
  statuses: ActiveStatus[][];
  bossMaxHp: number;
}

// Structure สำหรับผลลัพธ์ที่ได้กลับมา
interface ExecutionResult {
  newHp: number[];
  newShield: number[];
  newStatuses: ActiveStatus[][];
  textsToAdd: { target: number; text: string; type: 'DMG'|'HEAL'|'BLOCK'|'BUFF'|'DEBUFF' }[];
  shakeTargets: number[];
}

export function executeEffects(
  effects: UltimateEffect[],
  context: ExecuteContext
): ExecutionResult {
  
  // Clone ข้อมูลเพื่อไม่ให้กระทบต้นฉบับโดยตรง (Immutability)
  let newHp = [...context.hp];
  let newShield = [...context.shield];
  let newStatuses = context.statuses.map(arr => [...arr]);
  
  const textsToAdd: ExecutionResult['textsToAdd'] = [];
  const shakeTargets: number[] = [];

  // เริ่มวนลูป Effect
  effects.forEach(effect => {
    // A. ระบุเป้าหมาย (Logic เดิม)
    let targetIndices: number[] = [];
    
    if (effect.target === 'SELF') {
        targetIndices = [context.actorIndex];
    } else if (effect.target === 'TEAM_ALL') {
        if (newHp[0] > 0) targetIndices.push(0);
        if (newHp[1] > 0) targetIndices.push(1);
    } else if (effect.target === 'ENEMY_SINGLE') {
        const target = (newHp[2] > 0) ? 2 : 3; 
        targetIndices = [target];
    } else if (effect.target === 'ENEMY_ALL') {
        if (newHp[2] > 0) targetIndices.push(2);
        // if (newHp[3] > 0) targetIndices.push(3);
    }

    // B. ลงมือทำ Effect
    targetIndices.forEach(tIdx => {
        // 1. INSTANT DMG
        if (effect.type === 'INSTANT_DMG') {
            const res = calculateDamage(newHp[tIdx], newShield[tIdx], effect.value);
            const dmgDealt = effect.value - (newShield[tIdx] - res.shield);
            
            if (dmgDealt > 0) {
                textsToAdd.push({ target: tIdx, text: `${dmgDealt}`, type: 'DMG' });
                if (!shakeTargets.includes(tIdx)) shakeTargets.push(tIdx);
            }
            if (newShield[tIdx] > res.shield) {
                textsToAdd.push({ target: tIdx, text: `${newShield[tIdx] - res.shield}`, type: 'BLOCK' });
            }
            
            newHp[tIdx] = res.hp;
            newShield[tIdx] = res.shield;
        }
        // 2. INSTANT HEAL
        else if (effect.type === 'INSTANT_HEAL') {
            const maxHp = tIdx < 2 ? context.team[tIdx].stats.hp : context.bossMaxHp;
            const healAmt = Math.min(maxHp - newHp[tIdx], effect.value);
            
            if (healAmt > 0) {
                newHp[tIdx] += healAmt;
                textsToAdd.push({ target: tIdx, text: `${healAmt}`, type: 'HEAL' });
            }
        }
        // 3. DEFEND UP
        else if (effect.type === 'DEFEND_UP') {
            newShield[tIdx] += effect.value;
            textsToAdd.push({ target: tIdx, text: `+${effect.value}`, type: 'BLOCK' });
        }
        // 4. STATUS
        else if (['DOT', 'HOT', 'BUFF_POWER', 'BUFF'].includes(effect.type)) {
            let statusType = effect.type;
            if (statusType === 'BUFF_POWER') statusType = 'STRENGTH';

            newStatuses[tIdx].push({
                id: `ult-${effect.type}-${Date.now()}-${Math.random()}`,
                type: statusType as any,
                value: effect.value,
                duration: effect.duration,
                icon: effect.icon || '✨'
            });

            const textMsg = statusType === 'DOT' ? 'BURN!' : (statusType === 'HOT' ? 'REGEN!' : 'BUFF!');
            const textType = statusType === 'DOT' ? 'DEBUFF' : 'BUFF';
            textsToAdd.push({ target: tIdx, text: textMsg, type: textType });
        }
        
        // ... ถ้ามี Type ใหม่ในอนาคต (เช่น 'REVIVE', 'STUN') ก็มาเพิ่ม else if ตรงนี้ที่เดียว
    });
  });

  return { newHp, newShield, newStatuses, textsToAdd, shakeTargets };
}