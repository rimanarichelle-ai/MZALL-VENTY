export type SpecialCategory = 'coffee' | 'drinks' | 'juice' | 'mocktails' | 'desserts' | 'offers';

export interface TodaySpecialItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: SpecialCategory;
  priceDzd: number;
  originalPriceDzd?: number | null;
  isActive: boolean;
  startDate?: string | null; // format: 'YYYY-MM-DD'
  endDate?: string | null;   // format: 'YYYY-MM-DD'
  badgeText?: string;        // e.g. "TODAY'S SPECIAL", "BARISTA PICK", "LIMITED DROP", "CHEF'S SIGNATURE"
  perkText?: string;         // e.g. "+2 Bonus Loyalty Stamps", "Complimentary shot"
  featured?: boolean;        // Highlighted in top marquee / banner
  isPublished?: boolean;     // Published to public homepage as active selection
  createdAt: string;
  updatedAt: string;
}

export type SpecialScheduleStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export const SPECIAL_CATEGORIES: { id: SpecialCategory; label: string; iconName: string }[] = [
  { id: 'coffee', label: 'Coffee', iconName: 'Coffee' },
  { id: 'drinks', label: 'Drinks & Lattes', iconName: 'GlassWater' },
  { id: 'juice', label: 'Fresh Juices', iconName: 'Leaf' },
  { id: 'mocktails', label: 'Mocktails', iconName: 'Sparkles' },
  { id: 'desserts', label: 'Desserts & Pastry', iconName: 'Cake' },
  { id: 'offers', label: 'Bundles & Offers', iconName: 'Tag' },
];

export function getSpecialScheduleStatus(
  special: TodaySpecialItem,
  referenceDateStr?: string,
): SpecialScheduleStatus {
  if (!special.isActive) return 'INACTIVE';
  
  // Format reference date as YYYY-MM-DD (defaults to today in local time)
  const todayStr =
    referenceDateStr ||
    new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format

  if (special.startDate && special.startDate.trim()) {
    const startClean = special.startDate.slice(0, 10);
    if (todayStr < startClean) return 'SCHEDULED';
  }

  if (special.endDate && special.endDate.trim()) {
    const endClean = special.endDate.slice(0, 10);
    if (todayStr > endClean) return 'EXPIRED';
  }

  return 'ACTIVE';
}

export function isSpecialCurrentlyActive(
  special: TodaySpecialItem,
  referenceDateStr?: string,
): boolean {
  return getSpecialScheduleStatus(special, referenceDateStr) === 'ACTIVE';
}
