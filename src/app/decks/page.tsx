"use client";

import DeckManagementPanel from '@/components/features/decks/DeckManagementPanel';
import { useCharacterManager } from '@/hooks/useCharacterManager'; // ใช้ Hook เดิม

export default function DeckPage() {
    
    // ดึง Global Deck State และ Actions มาใช้
    const { 
        globalDeck, 
        addToDeck, 
        removeFromDeck 
    } = useCharacterManager();

    // Note: ไม่จำเป็นต้องมี onClose() ถ้าหน้านี้เป็น Route หลัก
    
    return (
        <div className="p-6 h-screen w-full bg-gray-900">
            <h1 className="text-3xl font-bold text-white mb-6">📚 Global Deck Builder</h1>
            
            <DeckManagementPanel 
                deckList={globalDeck}
                onAddToDeck={addToDeck}
                onRemoveFromDeck={removeFromDeck}
                // onClose ไม่ต้องมี ถ้าคุณไม่ต้องการปุ่มปิด
            />
        </div>
    );
}