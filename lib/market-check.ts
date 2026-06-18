// ─────────────────────────────────────────────────────────────
// Market Check v0.
// A deterministic validation layer for the first offer. It does not
// promise market success; it turns the offer into concrete demand signals,
// source-backed search paths, and one small customer-discovery step.
// ─────────────────────────────────────────────────────────────

import { DIRECTION_BY_ID } from "./directions";
import type { QuestionResponseMap, RecommendationOutput } from "./types";

export type MarketCheckVerdict = "ready_to_test" | "needs_narrowing" | "needs_evidence";

export interface MarketSourceSignal {
  label: string;
  kind: "mock" | "public_search";
  url?: string;
  why: string;
}

export interface MarketCheck {
  verdict: MarketCheckVerdict;
  score: number; // 0..100, confidence to test the offer, not success probability
  demandSignals: string[];
  riskSignals: string[];
  coaching: string;
  validationQuestion: string;
  firstExperiment: string;
  sources: MarketSourceSignal[];
}

function clean(s?: string): string {
  return (s ?? "").trim().replace(/\s+/g, " ");
}

function clip(s?: string, n = 28): string {
  const t = clean(s);
  return t.length <= n ? t : t.slice(0, n).trim() + "…";
}

function topicFromAnswers(a: QuestionResponseMap, rec: RecommendationOutput): string {
  const direction = DIRECTION_BY_ID[rec.topDirection.id]?.label ?? rec.topDirection.label;
  return clip(a.often_asked || a.good_at_unpaid || direction, 32);
}

function targetFromDirection(directionId: string): string {
  const map: Record<string, string> = {
    one_on_one_guide: "지금 그 문제를 겪고 있는 한 사람",
    one_on_one_consulting: "비슷한 고민을 가진 지인이나 커뮤니티 멤버",
    small_class: "같은 질문을 반복해서 하는 3~5명",
    digital_guide: "검색으로 답을 찾다가 막히는 사람",
    ai_beginner_help: "AI를 써보고 싶지만 자기 일에 못 붙인 사람",
    community_program: "혼자 해결하기 어려워 함께 움직일 사람이 필요한 사람",
    local_life_guide: "새 지역에 막 정착해 절차와 선택지가 막막한 사람",
    experience_support: "같은 시간을 지나며 안심과 방향이 필요한 사람",
  };
  return map[directionId] ?? "지금 이 도움을 필요로 하는 사람";
}

function publicSearchUrl(query: string): string {
  const params = new URLSearchParams({ q: query });
  return `https://www.google.com/search?${params.toString()}`;
}

function buildDemandSignals(a: QuestionResponseMap, rec: RecommendationOutput): string[] {
  const out: string[] = [];
  if (clean(a.often_asked)) {
    out.push(`이미 주변에서 “${clip(a.often_asked)}”을(를) 묻고 있어요.`);
  }
  if (clean(a.us_experience)) {
    out.push(`미국 생활/커뮤니티 맥락 안에서 “${clip(a.us_experience)}”라는 접점이 있어요.`);
  }
  if (rec.topDirection.breakdown.customerAccess >= 2) {
    out.push("첫 고객 후보에게 닿는 경로가 비교적 가까워요.");
  }
  if (rec.topDirection.breakdown.startEase >= 2) {
    out.push("큰 제작 없이 30분 대화나 작은 실험으로 바로 검증할 수 있어요.");
  }
  if (out.length === 0) {
    out.push("아직 시장 신호가 약하므로, 먼저 반복되는 질문 1개를 찾아야 해요.");
  }
  return out.slice(0, 4);
}

function buildRiskSignals(a: QuestionResponseMap, rec: RecommendationOutput): string[] {
  const out: string[] = [];
  if (!clean(a.often_asked)) {
    out.push("누가 실제로 이 문제를 묻는지 아직 충분히 드러나지 않았어요.");
  }
  if (a.biggest_blocker === "would_anyone_pay") {
    out.push("지불 의사는 추측하지 말고 가격 질문으로 바로 확인해야 해요.");
  }
  if (rec.topDirection.breakdown.customerAccess <= 1) {
    out.push("첫 고객을 만날 채널이 아직 좁아요.");
  }
  if (rec.topDirection.breakdown.timeFit === 0) {
    out.push("현재 가용 시간 안에서 오퍼 범위를 더 줄여야 해요.");
  }
  return out.length ? out.slice(0, 3) : ["가장 큰 리스크는 ‘좋아 보인다’에서 멈추고 실제 대화를 하지 않는 거예요."];
}

function scoreMarket(a: QuestionResponseMap, rec: RecommendationOutput): number {
  const b = rec.topDirection.breakdown;
  let score = 35;
  score += b.customerAccess * 12;
  score += b.startEase * 10;
  score += b.experienceFit * 8;
  score += clean(a.often_asked) ? 12 : 0;
  score += clean(a.us_experience) || clean(a.korea_experience) ? 6 : 0;
  score -= a.biggest_blocker === "would_anyone_pay" ? 6 : 0;
  score -= b.timeFit === 0 ? 10 : 0;
  return Math.max(20, Math.min(88, score));
}

function verdictFor(score: number, riskCount: number): MarketCheckVerdict {
  if (score >= 70 && riskCount <= 2) return "ready_to_test";
  if (score >= 52) return "needs_narrowing";
  return "needs_evidence";
}

export function buildMarketCheck(
  a: QuestionResponseMap,
  rec: RecommendationOutput,
): MarketCheck {
  const directionId = rec.topDirection.id;
  const direction = DIRECTION_BY_ID[directionId]?.label ?? rec.topDirection.label;
  const topic = topicFromAnswers(a, rec);
  const target = targetFromDirection(directionId);
  const demandSignals = buildDemandSignals(a, rec);
  const riskSignals = buildRiskSignals(a, rec);
  const score = scoreMarket(a, rec);
  const verdict = verdictFor(score, riskSignals.length);
  const searchQuery = `${topic} ${direction} 첫 고객 수요`;

  const validationQuestion =
    a.biggest_blocker === "would_anyone_pay"
      ? `“${topic}”을(를) 해결하는 30분 도움을 받는다면 얼마까지는 부담 없을까요?`
      : `“${topic}”에서 지금 가장 막히는 순간은 언제인가요?`;

  return {
    verdict,
    score,
    demandSignals,
    riskSignals,
    coaching:
      verdict === "ready_to_test"
        ? "오퍼를 더 다듬기보다 이번 주에 실제 사람에게 보여줘도 되는 단계예요."
        : verdict === "needs_narrowing"
          ? "방향은 괜찮지만, 누구의 어떤 순간을 돕는지 한 단계 더 좁히면 좋아요."
          : "아직 오퍼보다 고객 문제 증거가 먼저예요. 반복 질문을 찾는 대화부터 시작하세요.",
    validationQuestion,
    firstExperiment: `${target} 3명에게 이 질문을 보내고, 같은 표현이 2번 이상 반복되는지 확인하세요.`,
    sources: [
      {
        label: "데모 수요 신호",
        kind: "mock",
        why: "현재 답변의 반복 질문, 접근 가능한 고객 채널, 시작 난이도를 합쳐 데모용으로 산출한 신호예요.",
      },
      {
        label: "실제 공개 검색 소스",
        kind: "public_search",
        url: publicSearchUrl(searchQuery),
        why: "같은 문제를 사람들이 이미 검색·토론하는지 확인하는 1차 공개 소스예요.",
      },
    ],
  };
}
