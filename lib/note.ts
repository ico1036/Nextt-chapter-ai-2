// ─────────────────────────────────────────────────────────────
// My Next Chapter Note — config for the daily note flow.
// A short guided "work log", NOT a diary. 2–3 minutes, mobile-first.
// Copy taken faithfully from the product spec.
// ─────────────────────────────────────────────────────────────

import type { DailyNote, MoodTag } from "./types";

export interface MoodOption {
  id: MoodTag;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: "confident", label: "조금 자신감이 생겼어요", emoji: "🌱" },
  { id: "hopeful", label: "생각보다 가능성이 느껴졌어요", emoji: "🌤️" },
  { id: "stuck_but_moved", label: "막막했지만 한 걸음 나갔어요", emoji: "🚶‍♀️" },
  { id: "anxious", label: "아직 불안해요", emoji: "🤍" },
  { id: "tired", label: "피곤하고 미루고 싶었어요", emoji: "🌙" },
];

export const MOOD_LABEL: Record<MoodTag, string> = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.id, m.label]),
) as Record<MoodTag, string>;

export type NoteStepType = "text" | "mood";

export interface NoteStep {
  key: "todayAction" | "moodTag" | "customerVoice" | "insight" | "nextStep";
  type: NoteStepType;
  prompt: string;
  helper?: string;
  placeholder?: string;
  optional?: boolean;
}

// Order follows the product's screen-copy section.
export const NOTE_STEPS: NoteStep[] = [
  {
    key: "todayAction",
    type: "text",
    prompt: "오늘 내 다음 일을 위해 무엇을 했나요?",
    helper: "아주 작아도 괜찮아요. 움직인 흔적이 중요해요.",
    placeholder:
      "예: 지인 한 명에게 질문했다 / 오퍼 문장 1줄 써봤다 / 비슷한 사람들의 고민을 찾아봤다",
    optional: true,
  },
  {
    key: "moodTag",
    type: "mood",
    prompt: "오늘 나는 어떤 상태였나요?",
    helper: "감정도 기록이에요. 기분을 알아야 다음 행동을 더 작게 만들 수 있어요.",
  },
  {
    key: "customerVoice",
    type: "text",
    prompt: "오늘 누가 어떤 문제를 이야기했나요?",
    helper: "사람들이 반복해서 말하는 어려움 속에 당신의 일이 숨어 있을 수 있어요.",
    placeholder:
      "예: 미국 학교 시스템이 너무 복잡하다고 했어요 / AI가 어려워서 어디서부터 시작할지 모르겠다고 했어요",
    optional: true,
  },
  {
    key: "insight",
    type: "text",
    prompt: "오늘 새롭게 느끼거나 배운 것은 무엇인가요?",
    helper: "짧은 한 줄이면 충분해요.",
    placeholder:
      "예: 사람들은 정보보다 안심을 더 원한다 / 나는 1:1로 설명해주는 게 편하다",
    optional: true,
  },
  {
    key: "nextStep",
    type: "text",
    prompt: "내일 15분 안에 할 수 있는 다음 행동은 무엇인가요?",
    helper: "내일의 목표는 크게 말고, 작고 확실하게.",
    placeholder:
      "예: 지인 1명에게 메시지 보내기 / 고객 문제 3개 적기 / 오퍼 문장 다시 써보기",
  },
];

// ── Tiny next-step pool (Today's Next Step variety) ──────────
// Following the spec's "good next action" examples: observe / ask /
// one-line note — never "build a website".
export const MICRO_ACTIONS: string[] = [
  "도와주고 싶은 사람 한 유형만 떠올려, 그 사람이 가장 자주 하는 걱정을 한 줄로 적어보세요.",
  "가장 편한 지인 한 명에게 “요즘 제일 막막한 게 뭐예요?”라고 물어보세요.",
  "최근에 들은 누군가의 고민을 그대로 한 문장으로 적어두세요.",
  "당신의 오퍼를 “나는 ○○한 사람에게 ○○를 도와줘요” 한 줄로 써보세요.",
  "비슷한 고민을 하는 사람들이 모인 곳(맘카페·단톡방) 한 곳을 떠올려보세요.",
  "오늘 도와줄 수 있는 가장 작은 문제 하나를 한 줄로 정의해보세요.",
];

// Pick a deterministic micro-action by index (varies the prompt without RNG).
export function microActionAt(i: number): string {
  return MICRO_ACTIONS[((i % MICRO_ACTIONS.length) + MICRO_ACTIONS.length) % MICRO_ACTIONS.length];
}

// Today's recommended action:
//  • day 1 (no notes)  → the report's first action
//  • after notes       → yesterday's "next step" (continuity), else fallback
export function deriveTodayAction(
  reportFirstAction: string | undefined,
  notes: DailyNote[] | undefined,
): { action: string; source: "report" | "yesterday" | "fallback" } {
  const last = notes && notes.length ? notes[notes.length - 1] : undefined;
  if (last?.nextStep?.trim()) {
    return { action: last.nextStep.trim(), source: "yesterday" };
  }
  if (reportFirstAction?.trim()) {
    return { action: reportFirstAction.trim(), source: "report" };
  }
  return { action: microActionAt(0), source: "fallback" };
}

export function todayDateString(now = new Date()): string {
  // YYYY-MM-DD
  return now.toISOString().slice(0, 10);
}
