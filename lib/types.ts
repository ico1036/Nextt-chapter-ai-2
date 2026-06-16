// ─────────────────────────────────────────────────────────────
// Core domain types for My Next Chapter AI (MVP1)
// ─────────────────────────────────────────────────────────────

export type AnswerType = "single" | "text";

export type AnswerValue = string; // single → option id, text → raw string

export type QuestionResponseMap = Record<string, AnswerValue>;

export type AssetType =
  | "professional" // 전문성 자산
  | "life" // 생활 경험 자산
  | "ai" // AI/디지털 자산
  | "community"; // 관계/커뮤니티 자산

export type UserType =
  | "career_reboot"
  | "expert"
  | "ai_curious"
  | "community_connector";

export type WorkStyle =
  | "one_on_one"
  | "small_group"
  | "make_alone"
  | "teach"
  | "connect";

export interface DirectionScore {
  id: string;
  label: string;
  total: number;
  breakdown: {
    experienceFit: number;
    workStyleFit: number;
    timeFit: number;
    startEase: number;
    customerAccess: number;
  };
}

export interface RecommendationOutput {
  predictedUserTypes: UserType[];
  primaryUserType: UserType;
  assetTypes: AssetType[];
  scores: DirectionScore[]; // sorted desc, full list
  candidateDirections: DirectionScore[]; // top 3
  topDirection: DirectionScore; // top 1
}

export interface ReportSection {
  summary: string;
  strengths: string[];
  directions: { label: string; why: string }[];
  topRecommendation: { label: string; reasons: string[] };
  offerDraft: string;
  customerChannels: string[];
  firstAction: string;
  closing: string;
}

export interface DiagnosticSession {
  id: string;
  name?: string;
  email?: string;
  locale: string;
  status: "started" | "completed";
  startedAt: string;
  completedAt?: string;
  completionTimeSeconds?: number;
  predictedUserType?: UserType;
  topRecommendedDirection?: string;
  answers: QuestionResponseMap;
  recommendation?: RecommendationOutput;
  report?: ReportSection;
  device?: "mobile" | "desktop";
  notes?: DailyNote[]; // My Next Chapter Note entries
}

// ── My Next Chapter Note (Daily Note / Routine) ──────────────
export type MoodTag =
  | "confident" // 조금 자신감이 생겼어요
  | "anxious" // 아직 불안해요
  | "stuck_but_moved" // 막막했지만 한 걸음 나갔어요
  | "hopeful" // 생각보다 가능성이 느껴졌어요
  | "tired"; // 피곤하고 미루고 싶었어요

export interface NoteReflection {
  feedback: string; // 오늘의 한 줄 피드백
  nextAction: string; // 내일의 더 작은 다음 행동
}

export interface DailyNote {
  id: string;
  sessionId: string;
  createdAt: string;
  date: string; // YYYY-MM-DD
  chosenDirection?: string;
  todayAction: string;
  moodTag?: MoodTag;
  customerVoice: string;
  insight: string;
  nextStep: string;
  reflection?: NoteReflection;
}

export interface WeeklyReflection {
  flow: string; // 이번 주의 흐름
  movements: string[]; // 이미 한 움직임
  patterns: string[]; // 반복해서 보인 문제/신호
  moodPattern: string; // 감정 흐름
  keepDoing: string; // 계속할 것
  reduce: string; // 줄일 것
  focusAction: string; // 가장 작은 초점 행동
  noteCount: number;
}

export interface AnalyticsEvent {
  id: string;
  sessionId?: string;
  type: string;
  meta?: Record<string, unknown>;
  at: string;
}

export interface DB {
  sessions: DiagnosticSession[];
  events: AnalyticsEvent[];
}
