export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 3-4 answer choices
  correctOptionIndex: number; // 0-based index of correct option
  explanation?: string; // Informative note explaining the specialty coffee answer
}

export type QuizPublishStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export interface DailyQuizStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
}

export interface DailyQuiz {
  id: string;
  title: string;
  question: string;
  options: string[]; // 3-4 options
  correctOptionIndex: number; // Graded strictly on server
  points: number; // Quiz points for correct answer (default: 10)
  explanation?: string; // Optional educational explanation shown after submission
  description?: string;
  dateKey: string; // 'YYYY-MM-DD' in Africa/Algiers timezone
  status: QuizPublishStatus;
  isPublished: boolean;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  isActive?: boolean;
  rewardType?: 'STAMPS' | 'POINTS' | 'DISCOUNT_COUPON' | 'NONE';
  rewardValue?: number;
  rewardDescription?: string;
  timeLimitSeconds?: number;
  questions?: QuizQuestion[];
  stats?: DailyQuizStats;
  hasSubmissions?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  selectedOptionIndex?: number;
  answers?: number[]; // chosen indices for compatibility
  score?: number; // number of correct answers
  totalQuestions?: number;
  isCorrect?: boolean;
  isPerfectScore?: boolean;
  pointsAwarded?: number;
  timeTakenSeconds?: number;
  timedOut?: boolean;
  rewardIssued?: {
    type: string;
    stampsAwarded?: number;
    rewardId?: string;
    description: string;
  } | null;
  completedAt: string;
}

export interface QuizPointTransaction {
  id: string;
  customerId: string;
  quizId?: string;
  quizTitle?: string;
  pointsDelta: number;
  balanceAfter: number;
  reason: string;
  note?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface CustomerQuizPointsSummary {
  pointsBalance: number;
  totalQuizzesAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  transactions: QuizPointTransaction[];
}

export type QuizStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export interface QuizLeaderboardEntry {
  rank: number;
  customerId?: string;
  customerDisplayName: string;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  timeTakenSeconds: number;
  speedFormatted: string;
  isPerfectScore: boolean;
  completedAt: string;
  isCurrentUser?: boolean;
}

export interface QuizLeaderboardData {
  quizId: string;
  quizTitle: string;
  dateKey: string;
  timeLimitSeconds: number;
  totalParticipants: number;
  entries: QuizLeaderboardEntry[];
  currentUserEntry?: QuizLeaderboardEntry | null;
  quizStatus?: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'NO_QUIZ_TODAY' | 'UNAVAILABLE' | 'UPCOMING';
  message?: string;
}

