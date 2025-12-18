import { NextResponse } from 'next/server';
// ⚠️ เช็คด้วยว่าไฟล์ lib/db มีฟังก์ชัน saveDeck, deleteDeck จริงไหม
// ถ้าไม่มี ให้ลบ import นี้ออก แล้วเขียน Logic บันทึกไฟล์เองใน POST
import { saveDeck, deleteDeck } from '@/lib/db'; 
import { Deck } from '@/types/deck';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/db/decks.json');

// GET: ดึงรายการ Deck ทั้งหมด
export async function GET(request: Request) { // ✅ 1. เพิ่ม parameter 'request'
  try {
    // --- ส่วนเดิม: อ่านไฟล์ ---
    if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json([]); 
    }

    const fileData = fs.readFileSync(DB_PATH, 'utf-8');
    
    let decks = [];
    try {
        decks = JSON.parse(fileData);
    } catch (e) {
        console.warn("Deck file is corrupt or empty, returning []");
        decks = [];
    }
    // ------------------------

    // ✅ 2. Logic ใหม่: เช็คว่ามี id ส่งมาไหม?
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
        // ค้นหา Deck ที่ ID ตรงกัน
        const foundDeck = decks.find((d: any) => d.id === id);

        if (foundDeck) {
            return NextResponse.json(foundDeck); // เจอ -> ส่งคืน object เดียว
        } else {
            return NextResponse.json({ error: 'Deck not found' }, { status: 404 }); // ไม่เจอ -> 404
        }
    }

    // ✅ 3. ถ้าไม่มี id ส่งมา -> คืนค่าทั้งหมดตามปกติ
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