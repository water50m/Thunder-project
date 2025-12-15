// src/logic/blazeLogic.ts

// 1. นำเข้า Types ที่เกี่ยวข้องกับสถานะการต่อสู้ (Battle State, Status)
// ⚠️ คุณต้องปรับพาธการ Import ตามโครงสร้างโฟลเดอร์จริงของคุณ
import { 
    ActiveStatus, 
    FloatingTextData, 
    FloatingTextType 
} from '@/data/typesEffect'; // หรือไฟล์อื่นที่คุณเก็บ Type เหล่านี้

// 2. นำเข้า Types ข้อมูลตัวละคร (ถ้าจำเป็นต้องใช้)
import { Character } from '@/data/characters'; // สำหรับ type ของ team array

// 3. นำเข้า Helper Function สำหรับคำนวณ Damage
import { 
    calculateDamage 
} from '@/utils/battleLogic'; 


// 4. กำหนด Interface สำหรับ Battle State (ถ้าคุณไม่ได้ Import ตรงๆ)
//    (เหมือนที่เราทำใน luminaLogic เพื่อให้ฟังก์ชันทำงานได้)
interface BattleState { 
    hp: number[]; 
    shield: number[]; 
    statuses: ActiveStatus[][]; 
    floatingTexts: FloatingTextData[][];
    shaking: boolean[]; 
    ult: number[];
}

interface CharacterTeamData extends Character {} // เพื่อให้ง่ายต่อการใช้งานใน Logic

// ------------------------------------------------------------------
// Logic Functions
// ------------------------------------------------------------------

/**
 * BurnDetonate: ระเบิดสถานะ DOT ทั้งหมดบนเป้าหมายเดียว
 */
export const handleBurnDetonate = (
    prev: BattleState, 
    team: CharacterTeamData[], // ใช้ Team Data เพื่อดึง stat เช่น ATK ถ้า Logic อื่นต้องการ
    actorIndex: number, 
    target: number, // Target Index (0-3)
    finalValue: number, 
    addFloatingText: (textsArr: FloatingTextData[][], targetIdx: number, text: string, type: FloatingTextType) => void
    // ⚠️ calculateDamage ต้องถูกนำเข้า หรือส่งมาเป็น Argument (แนะนำให้ Import ตรงๆ)
): BattleState => { 
    
    // ... (โค้ด Logic ที่ใช้ calculateDamage และ Type ที่ Import) ...

    let newHp = [...prev.hp]; 
    let newShield = [...prev.shield]; 
    let newShaking = [...prev.shaking];
    let newTexts = prev.floatingTexts.map(arr => [...arr]);
    let newStatuses = prev.statuses.map(arr => [...arr]);

    // ... (Logic การคำนวณและระเบิด DOT) ...

    // คำนวณดาเมจใส่ศัตรู
    const oldShield = newShield[target];
    const res = calculateDamage(newHp[target], newShield[target], calculatedDmg); // ✅ ใช้ calculateDamage ที่ Import มา
    newHp[target] = res.hp; newShield[target] = res.shield;
    
    // ... (Text & Shake Logic เดิม) ...

    return { ...prev, hp: newHp, shield: newShield, statuses: newStatuses, floatingTexts: newTexts, shaking: newShaking };
};