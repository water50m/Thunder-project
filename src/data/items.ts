export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ฟังก์ชันจำลองไอเทม 100 ชิ้น
const generateItems = (): Item[] => {
  const items: Item[] = [];
  const types = [
    { name: "Potion", icon: "🧪" },
    { name: "Bomb", icon: "💣" },
    { name: "Scroll", icon: "📜" },
    { name: "Herb", icon: "🌿" },
    { name: "Elixir", icon: "🍷" },
  ];

  for (let i = 1; i <= 100; i++) {
    const type = types[i % types.length];
    items.push({
      id: `item-${i}`,
      name: `${type.name} Grade ${Math.ceil(i / 20)}`, // Grade 1-5
      description: `ไอเทมลำดับที่ ${i} สำหรับใช้งาน`,
      icon: type.icon,
    });
  }
  return items;
};

export const ITEM_POOL = generateItems();