export type CompetitionEligibility =
  | 'ALL_CUSTOMERS'
  | 'MIN_ORDERS_1'
  | 'MIN_STAMPS_3'
  | 'VIP_MEMBERS';

export type WinnerSelectionRule =
  | 'RANDOM_DRAW'
  | 'MOST_ORDERS'
  | 'HIGHEST_STAMPS'
  | 'MANUAL_SELECTION';

export type PrizeType =
  | 'FREE_DRINK'
  | 'FREE_DESSERT'
  | 'DISCOUNT_COUPON'
  | 'LOYALTY_STAMPS'
  | 'SPECIALTY_BEANS_BAG';

export interface CompetitionPrize {
  id: string;
  title: string;
  description: string;
  type: PrizeType;
  discountPercentage?: number;
  bonusStamps?: number;
  quantity: number; // how many winners get this prize (e.g. 1st place, 2nd place)
}

export interface CompetitionWinner {
  customerId: string;
  customerName: string;
  customerPhone: string;
  prizeId: string;
  prizeTitle: string;
  prizeType: PrizeType;
  rewardId?: string; // Links to issued reward in customer wallet
  selectedAt: string;
  notes?: string;
}

export interface CompetitionParticipant {
  customerId: string;
  customerName: string;
  customerPhone: string;
  joinedAt: string;
  orderCount?: number;
  stampCount?: number;
  isEligible: boolean;
  notes?: string;
}

export interface WeeklyCompetition {
  id: string;
  title: string;
  description: string;
  weekNumber: number; // e.g. 41
  year: number; // 2026
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  isActive: boolean;
  isDrawn: boolean;
  drawnAt?: string | null;
  eligibilityRule: CompetitionEligibility;
  winnerSelectionRule: WinnerSelectionRule;
  prizes: CompetitionPrize[];
  participants: CompetitionParticipant[];
  winners: CompetitionWinner[];
  bannerImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type CompetitionStatus = 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'DRAWN' | 'INACTIVE';
