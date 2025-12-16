import fs from 'fs';
import path from 'path';
import { Deck } from '@/types/deck';

// กำหนดตำแหน่งไฟล์ JSON
const DB_DIR = path.join(process.cwd(), 'src/data/db');
const DB_FILE = path.join(DB_DIR, 'decks.json');

// Helper: ตรวจสอบว่ามีไฟล์ไหม ถ้าไม่มีให้สร้าง
function ensureDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
  }
}

// 1. อ่านข้อมูลทั้งหมด
export async function getDecks(): Promise<Deck[]> {
  ensureDB();
  const fileData = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(fileData) as Deck[];
  } catch (error) {
    return [];
  }
}

// 2. บันทึกข้อมูล (Save/Update)
export async function saveDeck(newDeck: Deck): Promise<Deck[]> {
  const decks = await getDecks();
  const existingIndex = decks.findIndex(d => d.id === newDeck.id);

  if (existingIndex > -1) {
    // Update existing
    decks[existingIndex] = { ...newDeck, updatedAt: Date.now() };
  } else {
    // Create new
    decks.push({ ...newDeck, updatedAt: Date.now() });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(decks, null, 2));
  return decks;
}

// 3. ลบข้อมูล
export async function deleteDeck(deckId: string): Promise<Deck[]> {
  const decks = await getDecks();
  const newDecks = decks.filter(d => d.id !== deckId);
  fs.writeFileSync(DB_FILE, JSON.stringify(newDecks, null, 2));
  return newDecks;
}