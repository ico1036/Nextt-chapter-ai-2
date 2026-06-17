// ─────────────────────────────────────────────────────────────
// Recommendation engine — rule-based, deterministic, inspectable.
// Hybrid model: this file does the classification + scoring.
// AI is only used later to warm up the final narrative (optional).
// ─────────────────────────────────────────────────────────────

import { DIRECTIONS, type DirectionProfile } from "./directions";
import type {
  AssetType,
  DirectionScore,
  QuestionResponseMap,
  RecommendationOutput,
  UserType,
  WorkStyle,
} from "./types";

// Keyword hints for asset detection from free-text answers.
const PROFESSIONAL_HINTS = [
  "교사","선생","강사","가르","회계","세무","간호","약사","의사","디자","마케팅","영업",
  "부동산","보험","재정","금융","상담","컨설","엔지니","개발","프로그","번역","통역","피아노",
  "미용","뷰티","요리","쉐프","변호","법무","경영","관리","연구","기획","편집","작가","방송",
];
const COMMUNITY_HINTS = [
  "모임","커뮤니티","연결","소개","교회","봉사","정착","네트","행사","운영","리더","주선","이웃",
];
const AI_HINTS = ["ai","인공지능","챗gpt","chatgpt","gpt","자동화","노션","코딩","프롬프트","디지털"];

function includesAny(text: string, hints: string[]): boolean {
  const t = text.toLowerCase();
  return hints.some((h) => t.includes(h.toLowerCase()));
}

function textBlob(a: QuestionResponseMap): string {
  return [
    a.korea_experience,
    a.us_experience,
    a.often_asked,
    a.good_at_unpaid,
    a.energy_giving,
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Asset types ──────────────────────────────────────────────
export function classifyAssets(a: QuestionResponseMap): AssetType[] {
  const blob = textBlob(a);
  const set = new Set<AssetType>();

  if (includesAny(blob, PROFESSIONAL_HINTS)) set.add("professional");
  if (a.current_state === "good_cant_offer" || a.current_state === "can_do_no_income")
    set.add("professional");

  if (a.current_thought === "connect_ai" || includesAny(blob, AI_HINTS))
    set.add("ai");

  if (a.work_style === "connect" || includesAny(blob, COMMUNITY_HINTS))
    set.add("community");

  // Life experience is the universal baseline asset for this audience.
  set.add("life");

  return Array.from(set);
}

// ── User type buckets ────────────────────────────────────────
export function classifyUserTypes(
  a: QuestionResponseMap,
  assets: AssetType[],
): UserType[] {
  const set = new Set<UserType>();

  if (assets.includes("ai") || a.current_thought === "connect_ai")
    set.add("ai_curious");
  if (assets.includes("community") || a.work_style === "connect")
    set.add("community_connector");
  if (
    assets.includes("professional") ||
    a.current_state === "good_cant_offer" ||
    a.current_state === "can_do_no_income"
  )
    set.add("expert");
  if (
    a.current_thought === "dont_know" ||
    a.current_state === "no_idea" ||
    a.current_state === "vague_ideas"
  )
    set.add("career_reboot");

  if (set.size === 0) set.add("career_reboot");
  return Array.from(set);
}

// Priority when picking a single primary type.
const USER_TYPE_PRIORITY: UserType[] = [
  "expert",
  "ai_curious",
  "community_connector",
  "career_reboot",
];

function pickPrimary(types: UserType[]): UserType {
  for (const t of USER_TYPE_PRIORITY) if (types.includes(t)) return t;
  return "career_reboot";
}

// ── Scoring helpers (each axis 0..2) ─────────────────────────

const WORK_STYLE_VALUES: WorkStyle[] = [
  "one_on_one",
  "small_group",
  "make_alone",
  "teach",
  "connect",
];

function experienceFit(d: DirectionProfile, assets: AssetType[]): number {
  const overlap = d.assets.filter((x) => assets.includes(x)).length;
  if (overlap >= 2) return 2;
  if (overlap === 1) return 1;
  return 0;
}

function workStyleFit(d: DirectionProfile, a: QuestionResponseMap): number {
  const style = a.work_style as WorkStyle | undefined;
  if (style && d.styles.includes(style)) return 2;
  // Partial credit for adjacent styles (teach <-> small_group, etc.)
  const adjacency: Record<WorkStyle, WorkStyle[]> = {
    one_on_one: ["teach", "connect"],
    small_group: ["teach", "connect"],
    make_alone: [],
    teach: ["small_group", "one_on_one"],
    connect: ["small_group", "one_on_one"],
  };
  if (style && d.styles.some((s) => adjacency[style]?.includes(s))) return 1;
  return 0;
}

function timeFit(d: DirectionProfile, a: QuestionResponseMap): number {
  const time = a.time_available;
  // available budget: higher = more time
  const budget: Record<string, number> = {
    under_30: 1,
    about_1h: 2,
    about_2h: 3,
    weekends: 2,
    irregular: 1,
  };
  const have = budget[time ?? "irregular"] ?? 1;
  // direction needs timeNeed (1 light .. 3 heavy)
  if (have >= d.timeNeed + 1) return 2;
  if (have >= d.timeNeed) return 1;
  return 0;
}

function formatFit(d: DirectionProfile, a: QuestionResponseMap): boolean {
  const fmt = a.format ?? "both";
  if (fmt === "both") return true;
  return d.formats.includes(fmt as "online" | "offline" | "both");
}

function startEaseScore(d: DirectionProfile, a: QuestionResponseMap): number {
  let s: number = d.startEase;
  // If the user wants a quick/light test, reward easy-start directions.
  if ((a.want_most === "quick_small" || a.want_most === "test_small") && d.startEase === 2)
    s = 2;
  return Math.min(2, s);
}

function customerAccessScore(d: DirectionProfile, a: QuestionResponseMap): number {
  let s: number = d.customerAccess;
  if (!formatFit(d, a)) s = Math.max(0, s - 1);
  return s;
}

// Interest nudge from Q13 (direction_interest) — small tie-breaker.
function interestBonus(d: DirectionProfile, a: QuestionResponseMap): number {
  const pick = a.direction_interest;
  if (pick && d.interestTags.includes(pick)) return 1;
  return 0;
}

export function runRecommendation(
  a: QuestionResponseMap,
): RecommendationOutput {
  const assets = classifyAssets(a);
  const userTypes = classifyUserTypes(a, assets);
  const primary = pickPrimary(userTypes);

  const scores: DirectionScore[] = DIRECTIONS.map((d) => {
    const breakdown = {
      experienceFit: experienceFit(d, assets),
      workStyleFit: workStyleFit(d, a),
      timeFit: timeFit(d, a),
      startEase: startEaseScore(d, a),
      customerAccess: customerAccessScore(d, a),
    };
    const base =
      breakdown.experienceFit +
      breakdown.workStyleFit +
      breakdown.timeFit +
      breakdown.startEase +
      breakdown.customerAccess;
    const total = base + interestBonus(d, a);
    return { id: d.id, label: d.label, total, breakdown };
  });

  // Deterministic sort: total desc, then stable by directions order.
  const order = new Map(DIRECTIONS.map((d, i) => [d.id, i]));
  scores.sort((x, y) =>
    y.total !== x.total
      ? y.total - x.total
      : (order.get(x.id)! - order.get(y.id)!),
  );

  const candidateDirections = scores.slice(0, 3);
  const topDirection = scores[0];

  return {
    predictedUserTypes: userTypes,
    primaryUserType: primary,
    assetTypes: assets,
    scores,
    candidateDirections,
    topDirection,
  };
}

export const USER_TYPE_LABEL: Record<UserType, string> = {
  career_reboot: "다시 시작하는 사람",
  expert: "이미 자산이 있는 전문가",
  ai_curious: "AI를 연결하려는 사람",
  community_connector: "사람을 잇는 커넥터",
};

export const ASSET_LABEL: Record<AssetType, string> = {
  professional: "전문성 자산",
  life: "생활 경험 자산",
  ai: "AI·디지털 자산",
  community: "관계·커뮤니티 자산",
};
