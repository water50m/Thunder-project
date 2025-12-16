'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Deck } from '@/types/deck';
import DeckManagementPanel from '@/components/features/decks/DeckManagementPanel';

export default function DecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับ Deck ที่กำลังแก้ไข
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // --- API Calls ---
  const fetchDecks = async () => {
    try {
      const res = await fetch('/api/decks');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDecks(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const saveDeckToApi = async (deck: Deck) => {
    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck),
    });
    fetchDecks(); 
  };

  const deleteDeckFromApi = async (id: string) => {
    if(!confirm('Are you sure you want to delete this deck?')) return;
    await fetch(`/api/decks?id=${id}`, { method: 'DELETE' });
    fetchDecks();
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  // --- Handlers ---
  const handleCreateNew = () => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: `New Deck ${decks.length + 1}`, // ชื่อตั้งต้น
      cardIds: [],
      updatedAt: Date.now()
    };
    setEditingDeck(newDeck);
  };

  const handleEdit = (deck: Deck) => {
    setEditingDeck({ ...deck });
  };

  const handleSaveEditor = () => {
    if (editingDeck) {
      if (!editingDeck.name.trim()) {
          alert("Please enter a deck name");
          return;
      }
      saveDeckToApi(editingDeck);
      setEditingDeck(null);
    }
  };

  const handleAddToDeck = (cardId: string) => {
    if (!editingDeck) return;
    setEditingDeck(prev => prev ? { ...prev, cardIds: [...prev.cardIds, cardId] } : null);
  };

  const handleRemoveFromDeck = (cardId: string) => {
    if (!editingDeck) return;
    setEditingDeck(prev => {
        if (!prev) return null;
        const idx = prev.cardIds.lastIndexOf(cardId);
        if (idx === -1) return prev;
        const newIds = [...prev.cardIds];
        newIds.splice(idx, 1);
        return { ...prev, cardIds: newIds };
    });
  };

  // --- Render ---

  // 1. Mode: Editor (หน้าแก้ไข)
  if (editingDeck) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shadow-md z-10">
            {/* ส่วนแก้ไขชื่อ Deck */}
            <div className="flex gap-4 items-center flex-1 mr-8">
                <span className="text-2xl">📝</span>
                <div className="flex flex-col w-full max-w-md">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Deck Name</label>
                    <input 
                        value={editingDeck.name}
                        onChange={(e) => setEditingDeck({...editingDeck, name: e.target.value})}
                        className="bg-slate-900/50 text-xl font-bold text-white border border-slate-600 rounded px-3 py-1 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all w-full"
                        placeholder="Enter Deck Name..."
                        autoFocus // ให้ Cursor ไปอยู่ที่ช่องชื่อทันที
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => setEditingDeck(null)} 
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSaveEditor} 
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5"
                >
                    Save Deck
                </button>
            </div>
        </div>
        
        <div className="flex-1 min-h-0">
             <DeckManagementPanel 
                deckList={editingDeck.cardIds}
                equippedIds={[]} 
                onAddToDeck={handleAddToDeck}
                onRemoveFromDeck={handleRemoveFromDeck}
             />
        </div>
      </div>
    );
  }

  // 2. Mode: List (หน้าเมนูหลัก)
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      
      {/* ✅ Header Section: จัด layout แบบ justify-between */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-bold text-yellow-400 tracking-tight">YOUR DECKS</h1>
        
        {/* ปุ่ม Back ย้ายมาขวา */}
        <button 
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-white transition-all shadow-lg"
        >
            <span className="font-bold text-gray-300 group-hover:text-white">Back to Menu</span>
            <span className="group-hover:translate-x-1 transition-transform">➡</span>
        </button>
      </div>
      
      {/* Grid Content */}
      {loading ? (
        <div className="text-center text-gray-500 mt-20 text-xl animate-pulse">Loading decks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {/* Create New Card */}
            <div 
                onClick={handleCreateNew}
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/30 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 hover:bg-gray-800/80 transition-all group shadow-sm hover:shadow-yellow-400/10"
            >
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-4xl text-gray-500 group-hover:text-yellow-400">+</span>
                </div>
                <span className="text-gray-400 group-hover:text-white font-bold text-lg">Create New Deck</span>
            </div>

            {/* Deck List */}
            {decks.map(deck => (
                <div key={deck.id} className="aspect-[4/5] bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col justify-between hover:border-slate-500 hover:shadow-xl transition-all relative group">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-white mb-1 truncate pr-2" title={deck.name}>{deck.name}</h3>
                            <span className="text-xs bg-black/40 px-2 py-1 rounded text-slate-400 whitespace-nowrap">{deck.cardIds.length} cards</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Last updated: {new Date(deck.updatedAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Deck Icon */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-24 h-32 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-inner">
                            <span className="text-4xl opacity-50">🃏</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                        <button 
                            onClick={() => handleEdit(deck)}
                            className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                        >
                            EDIT
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteDeckFromApi(deck.id); }}
                            className="px-3 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-600 hover:text-white hover:border-transparent transition-all"
                            title="Delete Deck"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}