import Image from "next/image";
import type { MenuItem } from "@prisma/client";
import { formatCurrency } from "@/lib/format";
import { MENU_CATEGORY_ORDER } from "@/types/restaurants";

interface MenuSectionProps {
  items: MenuItem[];
}

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = MENU_CATEGORY_ORDER.indexOf(a);
    const bi = MENU_CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function MenuSection({ items }: MenuSectionProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">Menu coming soon.</p>
    );
  }

  const grouped = groupByCategory(items);
  const categories = sortCategories(Object.keys(grouped));

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[category].map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition">
      {item.imageUrl && (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 leading-snug">{item.name}</p>
          <p className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
            {Number(item.price) === 0 ? "—" : formatCurrency(item.price, item.currency)}
          </p>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
