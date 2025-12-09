export interface SignatureItem {
  id: string;
  name: string;
  description: string;
  bonus: string;
  icon: string;
}

// 🔥 มีให้เลือก 3 ชิ้น
export const SIGNATURE_POOL: SignatureItem[] = [
  { 
    id: 'sig-1', name: "Blazing Sword", 
    description: "ดาบเพลิงโลกันตร์ เผาศัตรูทุกครั้งที่โจมตี", 
    bonus: "Fire DMG +20%", icon: "🔥🗡️" 
  },
  { 
    id: 'sig-2', name: "Guardian Shield", 
    description: "โล่พิทักษ์ สะท้อนการโจมตี 30%", 
    bonus: "Reflect 30%", icon: "🛡️✨" 
  },
  { 
    id: 'sig-3', name: "Ancient Grimoire", 
    description: "คัมภีร์เวทย์โบราณ ลดคูลดาวน์สกิล", 
    bonus: "Cooldown -1", icon: "📖🔮" 
  },
];