import React from 'react';
import { Character } from '@/data/characters';

interface Props {
  stats: Character['stats'];
  onUpgrade: (key: keyof Character['stats']) => void;
}

export default function StatUpgradePanel({ stats, onUpgrade }: Props) {
  const statList = [
    { label: "Max HP", key: 'hp', value: stats.hp, icon: '❤️' },
    { label: "Attack", key: 'atk', value: stats.atk, icon: '⚔️' },
    { label: "Defense", key: 'def', value: stats.def, icon: '🛡️' },
    { label: "Power", key: 'power', value: stats.power, icon: '✨' },
    { label: "Max Ult", key: 'maxUltimate', value: stats.maxUltimate, icon: '⚡' },
  ] as const;

  return (
    <div className="w-full md:w-1/3 p-6 border-r border-gray-700 overflow-y-auto">
        <h3 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
            💪 STATS UPGRADE <span className="text-xs text-gray-500 font-normal ml-auto">Cost: 200G</span>
        </h3>
        <div className="space-y-4">
            {statList.map((stat) => (
                <div key={stat.key} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{stat.icon}</span>
                        <div>
                            <div className="text-sm text-gray-400">{stat.label}</div>
                            <div className="text-xl font-bold">{stat.value}</div>
                        </div>
                    </div>
                    <button onClick={() => onUpgrade(stat.key)} className="bg-green-700 hover:bg-green-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold transition active:scale-95">+</button>
                </div>
            ))}
        </div>
    </div>
  );
}