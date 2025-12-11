"use client";

import DeckManagementPanel from '@/components/features/decks/DeckManagementPanel';
import { useCharacterManager } from '@/hooks/useCharacterManager'; // ใช้ Hook เดิม
import { useRouter } from 'next/navigation'; // ✅ Import useRouter

export default function DeckPage() {
    
    const router = useRouter(); // ✅ เรียกใช้ Hook Router
    // ดึง Global Deck State และ Actions มาใช้
    const { 
        globalDeck, 
        addToDeck, 
        removeFromDeck,
        activeChar
    } = useCharacterManager();

    const equippedIds = activeChar?.equippedCards || [];

    const handleGoBack = () => {
        router.back(); // สั่งให้ Router ย้อนกลับไปหน้าล่าสุด
        // หรือ router.push('/characters'); ถ้าต้องการกำหนดหน้าเป้าหมาย
    };
    
    return (
        <div className="p-6 h-screen w-full bg-gray-900">
            <h1 className="text-3xl font-bold text-white mb-6">📚 Global Deck Builder</h1>
                        {/* 💡 เพิ่มปุ่มย้อนกลับ */}
            <button 
                onClick={handleGoBack}
                className="mb-4 px-4 py-2 text-sm font-bold rounded-lg bg-blue-700 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
            >
                <span className="text-xl">⬅️</span>
                Back to Character Select
            </button>

            <DeckManagementPanel 
                deckList={globalDeck}
                equippedIds={equippedIds}
                onAddToDeck={addToDeck}
                onRemoveFromDeck={removeFromDeck}
                // onClose ไม่ต้องมี ถ้าคุณไม่ต้องการปุ่มปิด
            />
        </div>
    );
}