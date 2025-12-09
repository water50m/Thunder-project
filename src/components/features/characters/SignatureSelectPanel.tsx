import { SIGNATURE_POOL } from '@/data/signatures';

interface Props {
  equippedId: string | null;
  onEquip: (id: string) => void;
}

export default function SignatureSelectPanel({ equippedId, onEquip }: Props) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 h-full">
      <h3 className="text-lg font-bold text-yellow-500 mb-4">🌟 SIGNATURE ITEM (1 Only)</h3>
      
      <div className="space-y-3">
        {SIGNATURE_POOL.map(sig => {
            const isEquipped = equippedId === sig.id;
            return (
                <div key={sig.id} onClick={() => onEquip(sig.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3
                        ${isEquipped ? 'bg-yellow-900/30 border-yellow-500' : 'bg-gray-700 border-transparent hover:border-yellow-700'}
                    `}
                >
                    <div className="text-3xl">{sig.icon}</div>
                    <div>
                        <div className="font-bold text-sm text-white">{sig.name}</div>
                        <div className="text-xs text-gray-400">{sig.description}</div>
                        <div className="text-xs text-yellow-400 font-mono mt-1">{sig.bonus}</div>
                    </div>
                    {isEquipped && <div className="ml-auto text-xl">✅</div>}
                </div>
            )
        })}
      </div>
    </div>
  );
}