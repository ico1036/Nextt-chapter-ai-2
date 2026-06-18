// ─────────────────────────────────────────────────────────────
// Context-first input adapter.
// Converts pasted notes into coarse product signals without storing raw text.
// The returned answers are intentionally generic summaries, not excerpts.
// ─────────────────────────────────────────────────────────────

import type { QuestionResponseMap } from "./types";

export interface ContextSignalPreview {
  assetSignals: string[];
  workStyle: string;
  blocker: string;
  privacyNotice: string;
}

export interface ContextSignalExtraction {
  answers: QuestionResponseMap;
  preview: ContextSignalPreview;
}

const AI_HINTS = ["ai", "챗gpt", "chatgpt", "자동화", "프롬프트", "노션", "디지털", "canva", "캔바"];
const TEACH_HINTS = ["가르", "설명", "강의", "수업", "클래스", "알려"];
const CONNECT_HINTS = ["모임", "연결", "소개", "커뮤니티", "교회", "봉사", "정착", "행사"];
const PROFESSIONAL_HINTS = ["마케팅", "금융", "교사", "상담", "컨설", "개발", "디자인", "미용", "회계", "기획"];
const PAY_HINTS = ["돈", "가격", "유료", "팔", "수익", "고객", "시장"];
const TIME_HINTS = ["시간", "바빠", "육아", "가족", "주말"];

function includesAny(text: string, hints: string[]): boolean {
  const t = text.toLowerCase();
  return hints.some((h) => t.includes(h.toLowerCase()));
}

function compactSignals(text: string): string[] {
  const signals: string[] = [];
  if (includesAny(text, PROFESSIONAL_HINTS)) signals.push("전문 경험 신호");
  if (includesAny(text, AI_HINTS)) signals.push("AI·디지털 연결 신호");
  if (includesAny(text, CONNECT_HINTS)) signals.push("관계·커뮤니티 신호");
  if (includesAny(text, TEACH_HINTS)) signals.push("설명·교육 신호");
  if (!signals.length) signals.push("생활 경험 기반 신호");
  return signals.slice(0, 4);
}

function inferWorkStyle(text: string): QuestionResponseMap["work_style"] {
  if (includesAny(text, CONNECT_HINTS)) return "connect";
  if (includesAny(text, TEACH_HINTS)) return "teach";
  if (includesAny(text, AI_HINTS)) return "one_on_one";
  return "one_on_one";
}

function inferInterest(text: string): QuestionResponseMap["direction_interest"] {
  if (includesAny(text, AI_HINTS)) return "ai_help";
  if (includesAny(text, TEACH_HINTS)) return "class";
  if (includesAny(text, CONNECT_HINTS)) return "community";
  return "guide";
}

function inferBlocker(text: string): QuestionResponseMap["biggest_blocker"] {
  if (includesAny(text, PAY_HINTS)) return "would_anyone_pay";
  if (includesAny(text, TIME_HINTS)) return "no_time";
  return "cant_describe";
}

export function extractContextSignals(text: string): ContextSignalExtraction {
  const normalized = text.trim().replace(/\s+/g, " ");
  const assetSignals = compactSignals(normalized);
  const workStyle = inferWorkStyle(normalized);
  const directionInterest = inferInterest(normalized);
  const blocker = inferBlocker(normalized);
  const hasAI = includesAny(normalized, AI_HINTS);
  const hasPay = includesAny(normalized, PAY_HINTS);

  const answers: QuestionResponseMap = {
    current_thought: hasAI ? "connect_ai" : "dont_know",
    current_state: hasPay ? "good_cant_offer" : "vague_ideas",
    korea_experience: `붙여넣은 자료에서 ${assetSignals.join(", ")}가 추출됨`,
    us_experience: "원문은 저장하지 않고, 맥락 신호만 진단에 사용함",
    often_asked: assetSignals.includes("설명·교육 신호")
      ? "사람들이 쉽게 설명해달라는 도움을 요청하는 신호"
      : "주변 사람이 반복해서 겪는 문제를 도울 수 있는 신호",
    good_at_unpaid: `${assetSignals[0]}를 바탕으로 한 작은 도움`,
    work_style: workStyle,
    energy_giving: "상대가 막힌 지점을 이해하고 다음 행동을 잡을 때",
    dont_want: "원문을 오래 보관하거나 과하게 공개하는 방식",
    time_available: "about_1h",
    format: "online",
    want_most: "test_small",
    direction_interest: directionInterest,
    biggest_blocker: blocker,
  };

  return {
    answers,
    preview: {
      assetSignals,
      workStyle,
      blocker,
      privacyNotice: "붙여넣은 원문은 서버에 저장하지 않고, 위 신호만 결과 생성에 사용해요.",
    },
  };
}
