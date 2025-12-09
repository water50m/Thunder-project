import React from 'react';

interface SelectionModalProps<T> {
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  selectedIds?: string[];
}

export default function SelectionModal<T extends { id: string }>({ 
  title, items, onSelect, onClose, renderItem, selectedIds = [] 
}: SelectionModalProps<T>) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-fadeIn">
      <div className="w-full max-w-5xl h-[80vh] bg-gray-900 border-2 border-gray-600 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">✕</button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.id} onClick={() => onSelect(item)} className="cursor-pointer">
                {renderItem(item, selectedIds.includes(item.id))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}