import { OfficialMenuItem, getOfficialProductById } from './officialMenuData';

export interface DailySpecial {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayName: string;
  theme: string;
  tagline: string;
  badgeText: string;
  coffeeItemId: string;
  sweetItemId: string;
  coffeeHighlight: {
    title: string;
    tastingNotes: string;
    specialPrice?: string;
  };
  sweetHighlight: {
    title: string;
    tastingNotes: string;
    specialPrice?: string;
  };
  pairPerk: string;
  baristaQuote: string;
}

export const WEEKLY_SPECIALS: DailySpecial[] = [
  {
    dayIndex: 0,
    dayName: 'Sunday',
    theme: 'Slow Pour Sunday',
    tagline: 'Single-origin espresso & artisanal Basque pastry',
    badgeText: 'SUNDAY SPECIAL',
    coffeeItemId: 'latte-spanish-latte',
    sweetItemId: 'dessert-banque-burnt-cheesecake',
    coffeeHighlight: {
      title: 'Spanish Latte',
      tastingNotes: 'Velvety micro-foamed milk infused with sweet condensed caramel cream',
      specialPrice: '300 DA',
    },
    sweetHighlight: {
      title: 'Basque Burnt Cheesecake',
      tastingNotes: 'Caramelized crust with ultra-creamy gluten-free center',
      specialPrice: '400 DA',
    },
    pairPerk: '+2 Bonus Loyalty Stamps when ordering today’s pairing',
    baristaQuote: 'Slow extraction brings out the deep caramel notes on quiet Sunday afternoons in Miliana.',
  },
  {
    dayIndex: 1,
    dayName: 'Monday',
    theme: 'Fresh Roast Monday',
    tagline: 'Silky micro-foam flat white & traditional Italian tiramisu',
    badgeText: 'MONDAY SPECIAL',
    coffeeItemId: 'latte-flat-white',
    sweetItemId: 'dessert-tiramisu',
    coffeeHighlight: {
      title: 'Flat White',
      tastingNotes: 'Double ristretto base with glossy, thin textured whole milk',
      specialPrice: '250 DA',
    },
    sweetHighlight: {
      title: 'Artisan Tiramisu',
      tastingNotes: 'Savoiardi soaked in house espresso layered with whipped mascarpone cream',
      specialPrice: '400 DA',
    },
    pairPerk: 'Complimentary extra espresso shot with your pastry',
    baristaQuote: 'Start your week with an invigorating double shot paired with hand-whipped mascarpone.',
  },
  {
    dayIndex: 2,
    dayName: 'Tuesday',
    theme: 'Artisan Roaster Tuesday',
    tagline: 'Balanced Spanish cortado & Sicilian pistachio cheesecake',
    badgeText: 'TUESDAY SPECIAL',
    coffeeItemId: 'latte-cortado',
    sweetItemId: 'cheesecake-pistachio',
    coffeeHighlight: {
      title: 'Cortado Specialty',
      tastingNotes: '1:1 ratio of rich espresso and steamed milk in signature ceramic glass',
      specialPrice: '250 DA',
    },
    sweetHighlight: {
      title: 'Pistachio Cheesecake',
      tastingNotes: 'Crushed pistachio crust filled with velvety Sicilian cream cheese',
      specialPrice: '350 DA',
    },
    pairPerk: 'Free pistachio cream drizzle on any dessert',
    baristaQuote: 'A 1:1 cortado ratio is the purest way to taste both milk sweetness and origin acidity.',
  },
  {
    dayIndex: 3,
    dayName: 'Wednesday',
    theme: 'Midweek Refresh',
    tagline: 'Steeped 16-hr cold brew & warm melting chocolate fondant',
    badgeText: 'WEDNESDAY SPECIAL',
    coffeeItemId: 'coffee-cold-brew',
    sweetItemId: 'dessert-fondant-chocolat',
    coffeeHighlight: {
      title: 'Artisanal Cold Brew',
      tastingNotes: 'Slow cold-water immersion extraction with notes of dark cacao and stone fruit',
      specialPrice: '100 DA',
    },
    sweetHighlight: {
      title: 'Fondant au Chocolat',
      tastingNotes: 'Warm French chocolate lava cake with molten ganache core',
      specialPrice: '350 DA',
    },
    pairPerk: 'Served with fresh orange zest peel',
    baristaQuote: 'The contrasting temperature between chilled cold brew and molten chocolate is unbeatable.',
  },
  {
    dayIndex: 4,
    dayName: 'Thursday',
    theme: 'Miliana Evening Special',
    tagline: 'Ceremonial matcha latte & fresh chocolate fruit crêpe',
    badgeText: 'THURSDAY SPECIAL',
    coffeeItemId: 'latte-matcha',
    sweetItemId: 'crepe-3-fruits-chocolate',
    coffeeHighlight: {
      title: 'Matcha Green Latte',
      tastingNotes: 'Ceremonial grade Japanese green tea whisked with silky textured milk',
      specialPrice: '600 DA',
    },
    sweetHighlight: {
      title: '3 Fruits Chocolate Crêpe',
      tastingNotes: 'Hand-spun golden crêpe folded with strawberries, bananas, kiwi & melted chocolate',
      specialPrice: '500 DA',
    },
    pairPerk: 'Double stamps on all weekend warm-up orders',
    baristaQuote: 'Thursday sunset on our Miliana terrace with a fresh crêpe and matcha is pure tranquility.',
  },
  {
    dayIndex: 5,
    dayName: 'Friday',
    theme: 'Jumu’ah Weekend Indulgence',
    tagline: 'Signature Spanish latte & scorched Basque burnt cheesecake',
    badgeText: 'FRIDAY SPECIAL',
    coffeeItemId: 'latte-spanish-latte',
    sweetItemId: 'dessert-banque-burnt-cheesecake',
    coffeeHighlight: {
      title: 'Spanish Latte',
      tastingNotes: 'Signature spiced sweet condensed milk layered beneath double espresso',
      specialPrice: '300 DA',
    },
    sweetHighlight: {
      title: 'Burnt Basque Cheesecake',
      tastingNotes: 'Golden caramelized crown with melt-in-mouth vanilla cream cheese',
      specialPrice: '400 DA',
    },
    pairPerk: '+2 Bonus Loyalty Stamps on all Friday family gatherings',
    baristaQuote: 'Our most celebrated pairing: sweet, balanced espresso and rustic caramelized cheesecake.',
  },
  {
    dayIndex: 6,
    dayName: 'Saturday',
    theme: 'Weekend Terrace Pairing',
    tagline: 'Traditional frothy cappuccino & warm buttery French croissant',
    badgeText: 'SATURDAY SPECIAL',
    coffeeItemId: 'latte-cappuccino',
    sweetItemId: 'style-croissant',
    coffeeHighlight: {
      title: 'Cappuccino Artisan',
      tastingNotes: 'Dense micro-foam dome with cocoa dusting over bold double extraction',
      specialPrice: '300 DA',
    },
    sweetHighlight: {
      title: 'French Butter Croissant',
      tastingNotes: 'Flaky 72-layer laminated pure butter viennoiserie, freshly baked',
      specialPrice: '200 DA',
    },
    pairPerk: 'Complimentary house chocolate dip with pastry',
    baristaQuote: 'A morning ritual perfected: crisp butter layers dipped into creamy cappuccino foam.',
  },
];

export interface ResolvedDailySpecial {
  special: DailySpecial;
  coffeeProduct?: OfficialMenuItem;
  sweetProduct?: OfficialMenuItem;
}

export function getCurrentDailySpecial(date: Date = new Date()): ResolvedDailySpecial {
  const dayIndex = date.getDay(); // 0 - 6
  const special = WEEKLY_SPECIALS.find((s) => s.dayIndex === dayIndex) || WEEKLY_SPECIALS[0];
  
  const coffeeProduct = getOfficialProductById(special.coffeeItemId);
  const sweetProduct = getOfficialProductById(special.sweetItemId);

  return {
    special,
    coffeeProduct,
    sweetProduct,
  };
}
