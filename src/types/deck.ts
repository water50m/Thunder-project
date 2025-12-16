export interface Deck {
  id: string;     // Unique ID ของ Deck (เช่น 'deck-1701')
  name: string;   // ชื่อ Deck (เช่น 'Fire Aggro')
  cardIds: string[]; // เก็บแค่ ID การ์ด ['strike', 'strike', 'fireball', ...]
  updatedAt: number; // เวลาแก้ไขล่าสุด
}

