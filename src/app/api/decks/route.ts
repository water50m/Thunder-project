import { NextResponse } from 'next/server';
// ⚠️ เช็คด้วยว่าไฟล์ lib/db มีฟังก์ชัน saveDeck, deleteDeck จริงไหม
// ถ้าไม่มี ให้ลบ import นี้ออก แล้วเขียน Logic บันทึกไฟล์เองใน POST
import { saveDeck, deleteDeck } from '@/lib/db'; 
import { Deck } from '@/types/deck';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db/decks.json');

// GET: ดึงรายการ Deck ทั้งหมด
export async function GET() {
  try {
    // 1. ถ้าไม่มีไฟล์ ให้คืนค่าว่าง [] ทันที (ป้องกัน Error)
    if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json([]); 
    }

    // 2. อ่านไฟล์
    const fileData = fs.readFileSync(DB_PATH, 'utf-8');
    
    // 3. แปลงเป็น JSON (ดัก Error เผื่อไฟล์ว่างเปล่า)
    let decks = [];
    try {
        decks = JSON.parse(fileData);
    } catch (e) {
        console.warn("Deck file is corrupt or empty, returning []");
        decks = [];
    }
    
    return NextResponse.json(decks);

  } catch (error) {
    console.error("GET Decks Error:", error);
    return NextResponse.json({ error: 'Failed to load decks' }, { status: 500 });
  }
}

// POST: สร้างหรือแก้ไข Deck
export async function POST(req: Request) {
  try {
    const body: Deck = await req.json();
    
    // Validation เบื้องต้น
    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // เรียกใช้ฟังก์ชันจาก lib/db (ต้องมั่นใจว่ามีฟังก์ชันนี้นะ)
    const updatedDecks = await saveDeck(body);
    
    return NextResponse.json({ success: true, decks: updatedDecks });
  } catch (error) {
    console.error("POST Deck Error:", error);
    return NextResponse.json({ error: 'Failed to save deck' }, { status: 500 });
  }
}

// DELETE: ลบ Deck
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // เรียกใช้ฟังก์ชันจาก lib/db
    const updatedDecks = await deleteDeck(id);
    
    return NextResponse.json({ success: true, decks: updatedDecks });
  } catch (error) {
    console.error("DELETE Deck Error:", error);
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}