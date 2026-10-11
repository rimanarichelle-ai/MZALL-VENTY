import { OfficialMenuItem, getOfficialProductById, getAllOfficialProducts } from './officialMenuData';

export interface SweetPairingRecommendation {
  drinkId: string;
  drinkName: string;
  recommendedSweetId: string;
  pairProfileBadge: 'Creamy Contrast' | 'Bittersweet Harmony' | 'Acidic Palate Cleanser' | 'Nutty Balance' | 'Citrus & Butter' | 'Velvet Indulgence';
  sommelierNotes: string;
  flavorHighlights: string[];
}

export const PAIRING_RECOMMENDATIONS: Record<string, SweetPairingRecommendation> = {
  // 1. Spanish Latte & Dalgona (Sweet, condensed milk base)
  'latte-spanish-latte': {
    drinkId: 'latte-spanish-latte',
    drinkName: 'Spanish Latte',
    recommendedSweetId: 'dessert-banque-burnt-cheesecake',
    pairProfileBadge: 'Creamy Contrast',
    sommelierNotes:
      'The scorched caramelized top and mild savory undertones of Basque burnt cheesecake balance the sweet condensed milk layer of the Spanish Latte without overwhelming the palate.',
    flavorHighlights: ['Caramelized crust', 'Sweet condensed milk', 'Velvety creaminess'],
  },
  'latte-dalgona': {
    drinkId: 'latte-dalgona',
    drinkName: 'Dalgona Latte',
    recommendedSweetId: 'dessert-banque-burnt-cheesecake',
    pairProfileBadge: 'Creamy Contrast',
    sommelierNotes:
      'Whipped caramelized coffee foam finds a rich, cooling partner in our Basque cheesecake’s creamy center.',
    flavorHighlights: ['Whipped foam', 'Rich dairy', 'Golden crust'],
  },

  // 2. Espresso, Ristretto, Doppio, Americano, Long Black (Intense roast, clean acidity)
  'coffee-espresso': {
    drinkId: 'coffee-espresso',
    drinkName: 'Espresso',
    recommendedSweetId: 'dessert-tiramisu',
    pairProfileBadge: 'Bittersweet Harmony',
    sommelierNotes:
      'The sharp, cacao-rich extraction of double espresso cuts cleanly through the whipped mascarpone cream and boosts the coffee-soaked savoiardi layers.',
    flavorHighlights: ['Espresso crema', 'Whipped mascarpone', 'Cocoa dusting'],
  },
  'coffee-ristretto': {
    drinkId: 'coffee-ristretto',
    drinkName: 'Ristretto',
    recommendedSweetId: 'style-croissant',
    pairProfileBadge: 'Citrus & Butter',
    sommelierNotes:
      'A dense, floral short extraction whose intense sweet acidity shines brightest with buttery, 72-layer laminated pastry.',
    flavorHighlights: ['Floral acidity', 'Pure French butter', 'Flaky crumb'],
  },
  'coffee-doppio': {
    drinkId: 'coffee-doppio',
    drinkName: 'Doppio',
    recommendedSweetId: 'dessert-tiramisu',
    pairProfileBadge: 'Bittersweet Harmony',
    sommelierNotes:
      'A double extraction provides bold backbone to soften and elevate rich mascarpone and bitter chocolate.',
    flavorHighlights: ['Double extraction', 'Mascarpone', 'Savoiardi'],
  },
  'coffee-americano': {
    drinkId: 'coffee-americano',
    drinkName: 'Americano',
    recommendedSweetId: 'style-brownie',
    pairProfileBadge: 'Bittersweet Harmony',
    sommelierNotes:
      'Diluted espresso with lingering crema pairs deliciously with dense, fudgy walnut brownies without competing for sweetness.',
    flavorHighlights: ['Walnut crunch', 'Dark chocolate fudge', 'Clean roast finish'],
  },
  'coffee-long-black': {
    drinkId: 'coffee-long-black',
    drinkName: 'Long Black',
    recommendedSweetId: 'style-brownie',
    pairProfileBadge: 'Bittersweet Harmony',
    sommelierNotes:
      'Crisp crema atop hot water brings out the deep cocoa notes in our dense artisanal brownie.',
    flavorHighlights: ['Robust crema', 'Dark chocolate', 'Roasted nuts'],
  },

  // 3. Flat White & Cortado (Velvety textured milk, strong coffee ratio)
  'latte-flat-white': {
    drinkId: 'latte-flat-white',
    drinkName: 'Flat White',
    recommendedSweetId: 'cheesecake-pistachio',
    pairProfileBadge: 'Nutty Balance',
    sommelierNotes:
      'Thin, glossy micro-foam and double ristretto enhance the natural toasted nuttiness of Sicilian pistachio cream cheese.',
    flavorHighlights: ['Glossy micro-foam', 'Roasted pistachio', 'Crushed biscuit base'],
  },
  'latte-cortado': {
    drinkId: 'latte-cortado',
    drinkName: 'Cortado',
    recommendedSweetId: 'cheesecake-pistachio',
    pairProfileBadge: 'Nutty Balance',
    sommelierNotes:
      'The 1:1 milk-to-espresso ratio creates the ideal baseline to taste both origin acidity and roasted pistachio ganache.',
    flavorHighlights: ['1:1 espresso ratio', 'Nutty richness', 'Gentle sweetness'],
  },

  // 4. Cappuccino & Cafe Au Lait (Fluffy frothy foam)
  'latte-cappuccino': {
    drinkId: 'latte-cappuccino',
    drinkName: 'Cappuccino',
    recommendedSweetId: 'style-croissant',
    pairProfileBadge: 'Citrus & Butter',
    sommelierNotes:
      'Classic morning ritual: airy, dense milk foam dusted with cocoa meets golden laminated pure butter viennoiserie for dipping.',
    flavorHighlights: ['Aerated milk foam', 'Crisp butter layers', 'Melt-in-mouth dip'],
  },
  'latte-cafe-au-lait': {
    drinkId: 'latte-cafe-au-lait',
    drinkName: 'Cafe Au Lait',
    recommendedSweetId: 'style-croissant',
    pairProfileBadge: 'Citrus & Butter',
    sommelierNotes:
      'Comforting French café staple best enjoyed with fresh flaky viennoiserie straight from morning baking.',
    flavorHighlights: ['Silky milk', 'Golden crust', 'Classic warmth'],
  },

  // 5. Cold Brew (Steeped 16 hours, crisp stone fruit & dark chocolate)
  'coffee-cold-brew': {
    drinkId: 'coffee-cold-brew',
    drinkName: 'Cold Brew',
    recommendedSweetId: 'dessert-fondant-chocolat',
    pairProfileBadge: 'Acidic Palate Cleanser',
    sommelierNotes:
      'Stunning thermal & texture interplay: crisp chilled cold brew cleanses the palate between bites of warm molten chocolate lava cake.',
    flavorHighlights: ['Molten dark ganache', 'Chilled slow brew', 'Clean stone-fruit finish'],
  },

  // 6. Matcha Green Latte (Earthy umami, vegetal)
  'latte-matcha': {
    drinkId: 'latte-matcha',
    drinkName: 'Matcha Green Latte',
    recommendedSweetId: 'crepe-3-fruits-chocolate',
    pairProfileBadge: 'Velvet Indulgence',
    sommelierNotes:
      'Ceremonial Japanese green tea umami cuts through sweet Belgian chocolate ribbons, accompanied by fresh strawberry & banana slices.',
    flavorHighlights: ['Ceremonial matcha', 'Fresh berries', 'Belgian chocolate drizzle'],
  },

  // 7. Mocha & Hot Chocolate (Rich cocoa)
  'latte-mocha': {
    drinkId: 'latte-mocha',
    drinkName: 'Mocha',
    recommendedSweetId: 'cheesecake-red-fruit',
    pairProfileBadge: 'Acidic Palate Cleanser',
    sommelierNotes:
      'Bright, tart raspberry and strawberry coulis cuts cleanly through rich chocolate ganache, delivering a luxurious Black Forest profile.',
    flavorHighlights: ['Dark mocha chocolate', 'Tart berry coulis', 'Smooth cream cheese'],
  },
  'latte-hot-chocolate': {
    drinkId: 'latte-hot-chocolate',
    drinkName: 'Hot Chocolate',
    recommendedSweetId: 'cheesecake-red-fruit',
    pairProfileBadge: 'Acidic Palate Cleanser',
    sommelierNotes:
      'Velvety hot chocolate paired with vibrant red fruits prevents palate fatigue with refreshing berry acidity.',
    flavorHighlights: ['Velvety cocoa', 'Fresh fruit coulis', 'Balanced sweetness'],
  },

  // 8. Mojitos & Mocktails (Zesty mint, lime, fruit)
  'mojito-classic': {
    drinkId: 'mojito-classic',
    drinkName: 'Classic Mojito',
    recommendedSweetId: 'dessert-gateau-basque',
    pairProfileBadge: 'Citrus & Butter',
    sommelierNotes:
      'Effervescent lime and muddled mint refresh the palate while the buttery almond pastry of Gâteau Basque provides satisfying depth.',
    flavorHighlights: ['Zesty lime', 'Muddled mint', 'Almond pastry cream'],
  },
  'mocktail-bora-bora': {
    drinkId: 'mocktail-bora-bora',
    drinkName: 'Bora Bora',
    recommendedSweetId: 'waffle-chocolate',
    pairProfileBadge: 'Velvet Indulgence',
    sommelierNotes:
      'Tropical pineapple and passionfruit tang paired with warm, crisp Belgian waffles draped in warm chocolate drizzle.',
    flavorHighlights: ['Tropical fruit', 'Warm waffle grid', 'Chocolate ribbons'],
  },
  'mocktail-blue-hawaii': {
    drinkId: 'mocktail-blue-hawaii',
    drinkName: 'Blue Hawaii',
    recommendedSweetId: 'dessert-gateau-basque',
    pairProfileBadge: 'Citrus & Butter',
    sommelierNotes:
      'Curacao and coconut notes are gracefully anchored by the rich, crumbly texture of Basque almond cake.',
    flavorHighlights: ['Coconut citrus', 'Golden crust', 'Vanilla pastry cream'],
  },

  // 9. Milkshakes (Thick, chilled)
  'milkshake-chocolate': {
    drinkId: 'milkshake-chocolate',
    drinkName: 'Chocolate Milkshake',
    recommendedSweetId: 'waffle-chocolate',
    pairProfileBadge: 'Velvet Indulgence',
    sommelierNotes:
      'For the ultimate chocolate aficionado: thick chocolate gelato shake paired with freshly pressed warm Belgian waffle.',
    flavorHighlights: ['Creamy shake', 'Crispy waffle', 'Warm chocolate sauce'],
  },
  'milkshake-caramel': {
    drinkId: 'milkshake-caramel',
    drinkName: 'Caramel Milkshake',
    recommendedSweetId: 'crepe-chocolatee',
    pairProfileBadge: 'Velvet Indulgence',
    sommelierNotes:
      'Golden buttery caramel shake paired with delicate, freshly folded chocolate crêpes.',
    flavorHighlights: ['Salted caramel notes', 'Thin golden crêpe', 'Melted chocolate'],
  },
};

// Fallback pairing for any beverage not explicitly in dictionary
export const DEFAULT_PAIRING: SweetPairingRecommendation = {
  drinkId: 'latte-spanish-latte',
  drinkName: 'Specialty Drink',
  recommendedSweetId: 'dessert-banque-burnt-cheesecake',
  pairProfileBadge: 'Creamy Contrast',
  sommelierNotes:
    'Our signature Basque Burnt Cheesecake features a caramelized top that pairs seamlessly with both espresso extractions and specialty drinks.',
  flavorHighlights: ['Caramelized crust', 'Creamy interior', 'Balanced roast'],
};

export interface ResolvedPairing {
  drink: OfficialMenuItem;
  sweet: OfficialMenuItem;
  recommendation: SweetPairingRecommendation;
}

export function getSweetPairingForDrink(drinkId: string): ResolvedPairing {
  const allProducts = getAllOfficialProducts();
  const matchedDrink = allProducts.find((p) => p.id === drinkId) || 
    allProducts.find((p) => p.category === 'coffee' || p.category === 'drinks') ||
    allProducts[0];

  const rec = PAIRING_RECOMMENDATIONS[matchedDrink.id] || {
    ...DEFAULT_PAIRING,
    drinkId: matchedDrink.id,
    drinkName: matchedDrink.name,
  };

  const matchedSweet = allProducts.find((p) => p.id === rec.recommendedSweetId) ||
    allProducts.find((p) => p.category === 'desserts' || p.category === 'sweets') ||
    allProducts[0];

  return {
    drink: matchedDrink,
    sweet: matchedSweet,
    recommendation: rec,
  };
}

// Quick list of popular drinks for the selector
export const POPULAR_PAIRING_DRINKS = [
  { id: 'latte-spanish-latte', name: 'Spanish Latte' },
  { id: 'latte-flat-white', name: 'Flat White' },
  { id: 'coffee-cold-brew', name: 'Cold Brew' },
  { id: 'latte-cortado', name: 'Cortado' },
  { id: 'latte-matcha', name: 'Matcha Latte' },
  { id: 'coffee-espresso', name: 'Espresso' },
  { id: 'latte-cappuccino', name: 'Cappuccino' },
  { id: 'mojito-classic', name: 'Mojito' },
];
