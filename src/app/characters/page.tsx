// src/data/characters.ts

export type Character = {
  id: number;
  name: string;
  role: 'Attacker' | 'Defender' | 'Support' | 'Balanced'; // สายอาชีพ
  description: string;
  stats: {
    hp: number;  // เลือด
    atk: number; // พลังโจมตี
    def: number; // พลังป้องกัน
    cri: number; // อัตราคริติคอล (%)
  };
  color: string; // สีประจำตัว (สำหรับ UI)
};

export const charactersData: Character[] = [
  {
    id: 1,
    name: "Blaze",
    role: "Attacker",
    description: "เน้นพลังโจมตีสูง ปิดเกมไว แต่ตัวบาง",
    stats: { hp: 100, atk: 55, def: 10, cri: 25 },
    color: "red"
  },
  {
    id: 2,
    name: "Ironclad",
    role: "Defender",
    description: "พลังป้องกันสูง เลือดเยอะ เป็นตัวชน",
    stats: { hp: 250, atk: 20, def: 50, cri: 5 },
    color: "blue"
  },
  {
    id: 3,
    name: "Lumina",
    role: "Support",
    description: "สเตตัสกลางๆ เน้นช่วยเพื่อน (ยังไม่มีสกิล)",
    stats: { hp: 150, atk: 25, def: 20, cri: 10 },
    color: "green"
  },
  {
    id: 4,
    name: "Vanguard",
    role: "Balanced",
    description: "สมดุลทุกด้าน เล่นง่าย ปรับตัวได้ทุกสถานการณ์",
    stats: { hp: 180, atk: 35, def: 30, cri: 15 },
    color: "purple"
  }
];