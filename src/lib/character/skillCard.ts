import fs from 'fs';
import path from 'path';
import { Character } from '@/data/characters'; // ปรับ path ตามจริง


const DB_DIR = path.join(process.cwd(), 'src/data/db');
const DB_FILE = path.join(DB_DIR, 'characters.json');

// Helper: ตรวจสอบว่ามีไฟล์หรือไม่
function ensureDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  // หมายเหตุ: ควรมีไฟล์ characters.json เริ่มต้นอยู่แล้ว (จากขั้นตอนก่อนหน้า)
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]'); 
  }
}

// GET: ดึงข้อมูลทั้งหมด
export async function getCharacters(): Promise<Character[]> {
  ensureDB();
  const fileData = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(fileData) as Character[];
  } catch (error) {
    return [];
  }
}

// ACTION: สวมใส่/ถอด Skill (บันทึกลงไฟล์)
export async function equipSkills(characterId: number, cardIds: string[]): Promise<Character[]> {
  const characters = await getCharacters();
  const index = characters.findIndex(c => c.id === characterId);

  if (index > -1) {
    characters[index].equipedSkillCard = cardIds; // อัปเดตข้อมูล
    fs.writeFileSync(DB_FILE, JSON.stringify(characters, null, 2)); // บันทึก
  }
  
  return characters;
}