import { NextResponse } from 'next/server';
import { getCharacters, equipSkills } from '@/lib/character/skillCard';

export const dynamic = 'force-dynamic'; // กัน cache

// GET: ดึงข้อมูลล่าสุด
export async function GET() {
  try {
    const characters = await getCharacters();
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: บันทึกการเปลี่ยนแปลง (Auto-Save)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { characterId, cardIds } = body;

    // Validation
    if (!characterId || !Array.isArray(cardIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    // Max 2 ใบ
    if (cardIds.length > 2) {
       return NextResponse.json({ error: 'Cannot equip more than 2 cards' }, { status: 400 });
    }

    const updated = await equipSkills(characterId, cardIds);
    return NextResponse.json({ success: true, characters: updated });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}