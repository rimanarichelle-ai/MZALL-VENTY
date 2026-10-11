import React from 'react';
import { Leaf, WheatOff, Nut, MilkOff, Sparkles } from 'lucide-react';

export type DietaryTag =
  | 'Vegan'
  | 'GF'
  | 'Contains Nuts'
  | 'Dairy-Free'
  | 'Sugar-Free'
  | string;

interface DietaryBadgeProps {
  tag: DietaryTag;
  theme?: 'burgundy' | 'cream' | 'dark' | 'light';
  size?: 'xs' | 'sm';
  showLabel?: boolean;
  className?: string;
}

export const getDietaryIcon = (tag: DietaryTag, className = 'w-2.5 h-2.5') => {
  switch (tag) {
    case 'Vegan':
      return <Leaf className={`${className} text-emerald-500 shrink-0`} />;
    case 'GF':
      return <WheatOff className={`${className} text-amber-500 shrink-0`} />;
    case 'Contains Nuts':
      return <Nut className={`${className} text-amber-600 shrink-0`} />;
    case 'Dairy-Free':
      return <MilkOff className={`${className} text-sky-400 shrink-0`} />;
    case 'Sugar-Free':
      return <Sparkles className={`${className} text-rose-400 shrink-0`} />;
    default:
      return <Sparkles className={`${className} text-[#c9833a] shrink-0`} />;
  }
};

export const getDietaryFullLabel = (tag: DietaryTag): string => {
  switch (tag) {
    case 'GF':
      return 'Gluten-Free';
    case 'Contains Nuts':
      return 'Contains Nuts Allergy Warning';
    case 'Vegan':
      return '100% Plant-Based / Vegan';
    case 'Dairy-Free':
      return 'Dairy-Free';
    case 'Sugar-Free':
      return 'No Added Sugar';
    default:
      return tag;
  }
};

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({
  tag,
  theme = 'cream',
  size = 'xs',
  showLabel = true,
  className = '',
}) => {
  const isDark = theme === 'burgundy' || theme === 'dark';

  const colorStyles = isDark
    ? tag === 'Contains Nuts'
      ? 'bg-amber-950/40 text-amber-200 border-amber-500/30'
      : tag === 'Vegan'
      ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/30'
      : tag === 'GF'
      ? 'bg-amber-950/40 text-amber-200 border-amber-500/30'
      : tag === 'Dairy-Free'
      ? 'bg-sky-950/40 text-sky-200 border-sky-500/30'
      : 'bg-white/10 text-[#dfd4c5] border-[#dfd4c5]/25'
    : tag === 'Contains Nuts'
    ? 'bg-amber-50 text-amber-900 border-amber-300/80'
    : tag === 'Vegan'
    ? 'bg-emerald-50 text-emerald-900 border-emerald-300/80'
    : tag === 'GF'
    ? 'bg-amber-50 text-amber-900 border-amber-300/80'
    : tag === 'Dairy-Free'
    ? 'bg-sky-50 text-sky-900 border-sky-300/80'
    : 'bg-[#351016]/5 text-[#614f44] border-[#351016]/15';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-[9.5px]' : 'text-[8.5px]';

  return (
    <span
      className={`inline-flex items-center gap-1 uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-[4px] border ${textSize} ${colorStyles} select-none transition-all ${className}`}
      title={getDietaryFullLabel(tag)}
    >
      {getDietaryIcon(tag, iconSize)}
      {showLabel && <span>{tag}</span>}
    </span>
  );
};
