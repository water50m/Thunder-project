// src/logic/luminaLogic.ts
// ⚠️ NOTE: คุณอาจต้องสร้างไฟล์ src/types/battleTypes.ts เพื่อเก็บ Interface เหล่านี้ไว้ใช้ร่วมกัน

// --- 1. Required Types (สมมติว่าถูก Import มาจากที่อื่น) ---
// คุณต้องมั่นใจว่า Type เหล่านี้ถูกกำหนดไว้ในโปรเจกต์ของคุณ
interface ActiveStatus {
    id: string;
    type: string; // เช่น 'DOT', 'BUFF'
    value: number;
    duration: number;
    icon: string;
}

interface CharacterStats {
    hp: number;
    // ... อื่นๆ เช่น atk, def
}

interface CharacterTeamData {
    id: number;
    stats: CharacterStats;
    // ...
}

interface BattleState { 
    hp: number[]; 
    shield: number[]; 
    ult: number[];
    statuses: ActiveStatus[][]; 
    floatingTexts: any[][]; // ใช้ any ชั่วคราว หรือ import FloatingTextData
    shaking: boolean[]; 
}

// --- 2. Interface สำหรับ Return Value ของ Lumina Logic ---

interface LuminaResult {
    // ฟังก์ชันควรคืนค่า BattleState ที่ถูกอัปเดตแล้ว (ใช้ Spread ในการคืนค่า)
    hp: number[];
    shield: number[];
    statuses: ActiveStatus[][];
    floatingTexts: any[][];
    shaking: boolean[];
}

// --- 3. Lumina Logic Functions ---
// (นำโค้ดที่ผมให้ไปก่อนหน้านี้มาใส่ที่นี่)

/**
 * CleanseHeal: ล้าง Debuff ทั้งหมดให้พันธมิตร และ Heal ตามจำนวน Debuff ที่ล้างออก
 */
export const handleCleanseHeal = (
    prev: BattleState, 
    team: CharacterTeamData[], 
    actorIndex: number, 
    addFloatingText: (textsArr: any[][], targetIdx: number, text: string, type: string) => void
): BattleState => { // ✅ ต้องคืนค่า BattleState ทั้งหมด

    let newHp = [...prev.hp];
    let newStatuses = prev.statuses.map(arr => [...arr]);
    let newTexts = prev.floatingTexts.map(arr => [...arr]);
    let totalDebuffsRemoved = 0;

    // ... (Cleanse & Heal Logic เดิม) ...
    // ... (ใช้ newHp, newStatuses, newTexts) ...
    
    // ✅ คืนค่า BattleState ใหม่
    return { 
        ...prev, 
        hp: newHp, 
        statuses: newStatuses, 
        floatingTexts: newTexts 
    };
};

/**
 * GroupHealDamage: Heal พันธมิตรทั้งหมด 20% MaxHP และทำความเสียหายเท่ากันต่อศัตรู
 */
export const handleGroupHealDamage = (
    prev: BattleState, 
    team: CharacterTeamData[], 
    actorIndex: number, 
    addFloatingText: (textsArr: any[][], targetIdx: number, text: string, type: string) => void,
    calculateDamage: (hp: number, shield: number, damage: number) => { hp: number, shield: number }
): BattleState => { // ✅ ต้องคืนค่า BattleState ทั้งหมด

    let newHp = [...prev.hp]; 
    let newShield = [...prev.shield]; 
    let newShaking = [...prev.shaking];
    let newTexts = prev.floatingTexts.map(arr => [...arr]);
    let totalActualHeal = 0;

    // ... (Group Heal Logic เดิม) ...
    // ... (Damage Calculation Logic เดิม) ...
    // ... (ใช้ newHp, newShield, newTexts, newShaking) ...

    // ✅ คืนค่า BattleState ใหม่
    return { 
        ...prev, 
        hp: newHp, 
        shield: newShield, 
        floatingTexts: newTexts, 
        shaking: newShaking 
    };
};