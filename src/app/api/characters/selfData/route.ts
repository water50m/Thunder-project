import { NextResponse } from 'next/server';
import { getCharacters } from '@/lib/character/skillCard'; // ✅ Import ฟังก์ชันอ่านไฟล์ที่เราทำไว้

export const dynamic = 'force-dynamic'; // (Optional) บังคับให้ไม่ cache เพื่อให้ได้ข้อมูลล่าสุดเสมอ

export async function GET() {
  try {
    // 1. เรียกฟังก์ชันอ่านไฟล์ JSON
    const characters = await getCharacters();

    // 2. ส่งข้อมูลกลับไปเป็น JSON
    return NextResponse.json(characters);
    
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      { error: 'Failed to fetch characters data' }, 
      { status: 500 }
    );
  }
}