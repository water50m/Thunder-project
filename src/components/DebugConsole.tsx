// src/components/DebugConsole.tsx
import React, { useState, useEffect, useRef } from 'react';

interface DebugConsoleProps {
  onCommand: (cmd: string) => void;
}

export default function DebugConsole({ onCommand }: DebugConsoleProps) {
  const [show, setShow] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // 🔥 เปลี่ยนเป็น F1 หรือ กด Ctrl+Shift+C ก็ได้
        if (e.key === 'F1') {
            e.preventDefault();
            setShow(prev => {
                const newState = !prev;
                if (newState) setTimeout(() => inputRef.current?.focus(), 10);
                return newState;
            });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onCommand(input.trim().toLowerCase());
      setInput("");
      setShow(false);
  };

  if (!show) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-16 bg-black/90 flex items-center px-4 z-[9999] border-b border-green-500 shadow-lg animate-slideDown">
        <span className="text-green-500 font-mono font-bold mr-2">{">"}</span>
        <form onSubmit={handleSubmit} className="flex-1">
            <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent text-green-400 font-mono focus:outline-none"
                placeholder="Enter command (killboss, killme, heal, draw)"
            />
        </form>
        <div className="text-xs text-gray-500 font-mono">Press Enter | [F1] to close</div>
    </div>
  );
}