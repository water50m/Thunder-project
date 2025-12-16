'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {  Character } from '@/data/characters';
import { Deck } from '@/types/deck'; // Ensure this type is available

export default function CharacterSelection() {
  const router = useRouter();
  
  // Character Selection State
  const [selectedTeam, setSelectedTeam] = useState<Character[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Deck Selection State
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(true);


  // Fetch Decks on Mount
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await fetch('/api/decks');
        if (res.ok) {
          const data = await res.json();
          setDecks(data);
          // Optional: Auto-select the first deck if available
          if (data.length > 0) {
            setSelectedDeckId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch decks:", error);
      } finally {
        setLoadingDecks(false);
      }
    };
    fetchDecks();
  }, []);

  useEffect(() => {
  const fetchChars = async () => {
    try {
      const res = await fetch('/api/characters/selfData'); // ✅ เรียก API นี้
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchChars();
}, []);

  const toggleCharacter = (char: Character) => {
    const index = selectedTeam.findIndex((c) => c.id === char.id);

    if (index !== -1) {
      // Deselect
      const newTeam = [...selectedTeam];
      newTeam.splice(index, 1);
      setSelectedTeam(newTeam);
    } else {
      // Select (limit to 2)
      if (selectedTeam.length < 2) {
        setSelectedTeam([...selectedTeam, char]);
      }
    }
  };

  const handleStartGame = () => {
    // Save Team

    localStorage.setItem('myTeam', JSON.stringify(selectedTeam));
    
    // Save Selected Deck (Assuming you fetch this in useBattle later)
    if (selectedDeckId) {
        // Find the full deck object or just save the ID to fetch later
        // Strategy: Save the card IDs directly to localStorage to be loaded by useBattle
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (selectedDeck) {
            localStorage.setItem('playerDeck', JSON.stringify(selectedDeck.cardIds));
        }
    } else {
        // Fallback or alert if no deck selected (though button should be disabled)
        alert("Please select a deck!");
        return;
    }

    router.push('/battle');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      
      <h1 className="text-4xl font-bold mb-2 text-yellow-400">PREPARE FOR BATTLE</h1>
      
      {/* --- SECTION 1: SELECT TEAM --- */}
      <div className="w-full max-w-6xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-300 border-b border-gray-700 pb-2">
            1. Select Your Team ({selectedTeam.length}/2)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {characters.map((char) => {
            const selectionIndex = selectedTeam.findIndex((c) => c.id === char.id);
            const isSelected = selectionIndex !== -1;
            
            return (
                <div
                key={char.id}
                onClick={() => toggleCharacter(char)}
                className={`
                    relative cursor-pointer rounded-xl p-6 border-2 transition-all duration-300
                    hover:scale-105 hover:bg-gray-800
                    ${isSelected 
                    ? `bg-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105 border-[${char.color}]` 
                    : 'border-gray-700 bg-gray-900/50 opacity-80 hover:opacity-100'}
                `}
                style={{ borderColor: isSelected ? char.color : 'rgba(55, 65, 81, 1)' }}
                >
                {/* Character Info (Same as before) */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold">{char.name}</h2>
                    <span className="text-xs px-2 py-1 rounded-full border border-white/20 uppercase tracking-widest text-gray-300">
                    {char.role}
                    </span>
                </div>

                {/* Simplified Stats for cleaner look */}
                <div className="space-y-1 text-sm text-gray-300">
                    <div className="flex justify-between"><span>HP</span><span className="text-green-400">{char.stats.hp}</span></div>
                    <div className="flex justify-between"><span>ATK</span><span className="text-red-400">{char.stats.atk}</span></div>
                    <div className="flex justify-between"><span>DEF</span><span className="text-blue-400">{char.stats.def}</span></div>
                </div>

                {/* Selection Badge */}
                {isSelected && (
                    <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-yellow-500 text-black font-bold rounded-full animate-bounce shadow-lg">
                    {selectionIndex + 1}
                    </div>
                )}
                </div>
            );
            })}
        </div>
      </div>

      {/* --- SECTION 2: SELECT DECK --- */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex justify-between items-end mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-2xl font-bold text-green-300">
                2. Select Your Deck
            </h2>
            <Link href="/decks">
                <span className="text-sm text-yellow-400 hover:underline cursor-pointer">Manage Decks ↗</span>
            </Link>
        </div>

        {loadingDecks ? (
            <div className="text-center py-8 text-gray-500 animate-pulse">Loading Decks...</div>
        ) : decks.length === 0 ? (
             <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400 mb-4">No decks found.</p>
                <Link href="/decks">
                    <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Create a Deck</button>
                </Link>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {decks.map((deck) => (
                    <div
                        key={deck.id}
                        onClick={() => setSelectedDeckId(deck.id)}
                        className={`
                            p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-32
                            ${selectedDeckId === deck.id 
                                ? 'bg-green-900/30 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                                : 'bg-gray-800 border-gray-700 hover:border-gray-500'}
                        `}
                    >
                        <div>
                            <h3 className={`font-bold text-lg truncate ${selectedDeckId === deck.id ? 'text-green-300' : 'text-white'}`}>
                                {deck.name}
                            </h3>
                            <p className="text-sm text-gray-400">{deck.cardIds.length} Cards</p>
                        </div>
                        
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-gray-600">Updated: {new Date(deck.updatedAt).toLocaleDateString()}</span>
                            {selectedDeckId === deck.id && (
                                <span className="text-2xl">✅</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex gap-4 fixed bottom-8 z-10 bg-gray-900/90 p-4 rounded-full border border-gray-700 shadow-2xl backdrop-blur-sm">
        <Link href="/">
          <button className="px-8 py-3 rounded-full border border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white transition font-bold">
            CANCEL
          </button>
        </Link>
        
        <button
          onClick={handleStartGame}
          disabled={selectedTeam.length !== 2 || !selectedDeckId}
          className={`
            px-12 py-3 rounded-full font-bold text-xl transition-all shadow-lg
            ${selectedTeam.length === 2 && selectedDeckId
              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white scale-105 hover:shadow-orange-500/50' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
          `}
        >
          START BATTLE ⚔️
        </button>
      </div>

      {/* Bottom spacer for fixed buttons */}
      <div className="h-24"></div>
    </div>
  );
}