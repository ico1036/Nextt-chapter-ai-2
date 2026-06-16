// ─────────────────────────────────────────────────────────────
// Optional AI narrative layer.
// The rule-based engine (lib/engine.ts) and deterministic report
// (lib/report.ts) ALWAYS run and are the source of truth for QA.
// If ANTHROPIC_API_KEY is present, we ask Claude to gently rewrite the
// final report copy to feel more personal — without changing the
// recommended direction, offer, channels, or action.
//
// No SDK dependency: uses the Messages REST API via fetch.
// Safe fallback: any error returns the deterministic report unchanged.
// ─────────────────────────────────────────────────────────────

import { reportToText } from "./report";
import { buildDailyReflection, buildWeeklyReflection } from "./reflection";
import { MOOD_LABEL } from "./note";
import type {
  DailyNote,
  NoteReflection,
  QuestionResponseMap,
  ReportSection,
  WeeklyReflection,
} from "./types";

// Sonnet 4.6 is the default: excellent Korean prose, fast + affordable,
// and comfortably within Vercel function time limits. Override with
// ANTHROPIC_MODEL (e.g. claude-opus-4-8 for max quality).
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface WarmFields {
  summary?: string;
  strengths?: string[];
  closing?: string;
}

export async function warmUpReport(
  report: ReportSection,
  answers: QuestionResponseMap,
): Promise<ReportSection> {
  if (!aiEnabled()) return report;

  const system = [
    "당신은 미국에 사는 한인 이민자 엄마를 돕는 따뜻하고 현실적인 진단 코치입니다.",
    "이미 만들어진 진단 리포트의 일부 문장을 더 자연스럽고 따뜻하게 다듬는 역할만 합니다.",
    "규칙: 추천 방향/오퍼/채널/행동의 '내용'은 절대 바꾸지 마세요. 빈말·과장 칭찬 금지.",
    "창업 용어 대신 생활 언어를 쓰고, 짧고 다정하게. 반드시 한국어.",
    "출력은 JSON만: {\"summary\": string, \"strengths\": string[], \"closing\": string}",
  ].join("\n");

  const user = [
    "아래는 사용자의 답변 요약과 현재 리포트입니다.",
    "summary, strengths(3~4개), closing 세 부분만 더 따뜻하게 다듬어 JSON으로 주세요.",
    "",
    "[사용자 답변]",
    JSON.stringify(answers, null, 2),
    "",
    "[현재 리포트 텍스트]",
    reportToText(report),
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
      // Keep well under Vercel's function limit; fall back to the
      // deterministic report if the model is slow.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return report;
    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const json = extractJson(text);
    if (!json) return report;

    const warm = json as WarmFields;
    return {
      ...report,
      summary: warm.summary?.trim() || report.summary,
      strengths:
        Array.isArray(warm.strengths) && warm.strengths.length >= 3
          ? warm.strengths.slice(0, 4)
          : report.strengths,
      closing: warm.closing?.trim() || report.closing,
    };
  } catch {
    return report;
  }
}

// ── Daily Note reflection (optional Claude warm-up) ──────────
async function callClaude(
  system: string,
  user: string,
  maxTokens = 700,
): Promise<unknown | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    return extractJson(text);
  } catch {
    return null;
  }
}

const REFLECTION_SYSTEM = [
  "당신은 My Next Chapter AI 안에서 사용자의 Daily Note를 읽고, 짧고 따뜻하지만 현실적인 Reflection을 제공하는 AI 동반자입니다.",
  "역할: ① 오늘 이미 한 작은 움직임을 알아보고 ② 기록 속 핵심 패턴 1개를 짚고 ③ 감정을 가볍게 비춰주고 ④ 내일 할 더 작은 다음 행동 1개를 제안합니다.",
  "목적은 생산성을 높이는 것이 아니라, 멈추지 않고 다시 돌아오게 만드는 것입니다.",
  "규칙: 한국어. 짧고 숨 쉬는 문장. 빈말·평가·죄책감 금지. ‘더 열심히’ 금지. 행동은 늘 15분 안에 가능하게, 관찰/질문/한 줄 정리 수준으로 작게.",
  '출력은 JSON만: {"feedback": string(2~4문장), "nextAction": string(아주 작은 행동 1개)}',
].join("\n");

export async function reflectNoteAI(note: DailyNote): Promise<NoteReflection> {
  const base = buildDailyReflection(note);
  if (!aiEnabled()) return base;

  const user = [
    "아래 Daily Note를 읽고 Reflection을 JSON으로 작성하세요.",
    `• 추천받은 방향: ${note.chosenDirection ?? "(미정)"}`,
    `• 오늘 한 작은 행동: ${note.todayAction || "(없음)"}`,
    `• 오늘의 감정: ${note.moodTag ? MOOD_LABEL[note.moodTag] : "(없음)"}`,
    `• 오늘 들은 고객의 말/문제: ${note.customerVoice || "(없음)"}`,
    `• 오늘의 인사이트: ${note.insight || "(없음)"}`,
    `• 사용자가 적은 내일의 다음 행동: ${note.nextStep || "(없음)"}`,
  ].join("\n");

  const json = (await callClaude(REFLECTION_SYSTEM, user, 600)) as
    | Partial<NoteReflection>
    | null;
  if (!json) return base;
  return {
    feedback: typeof json.feedback === "string" && json.feedback.trim() ? json.feedback.trim() : base.feedback,
    nextAction:
      typeof json.nextAction === "string" && json.nextAction.trim()
        ? json.nextAction.trim()
        : base.nextAction,
  };
}

const WEEKLY_SYSTEM = [
  "당신은 My Next Chapter AI 안에서 사용자의 지난 1주 Daily Note를 읽고, 짧고 따뜻하지만 현실적인 주간 Reflection을 제공하는 AI 동반자입니다.",
  "목적은 성과 보고가 아니라, ‘내가 작게라도 계속 가고 있구나’를 느끼게 하는 것입니다.",
  "규칙: 한국어. 짧은 문장. 평가표·질책·거대한 목표 금지. 다음 주 제안은 ‘더 많이’가 아니라 ‘더 선명하게’, 15분 안에 가능하게.",
  '출력은 JSON만: {"flow": string, "movements": string[2~3], "patterns": string[1~2], "moodPattern": string, "keepDoing": string, "reduce": string, "focusAction": string}',
].join("\n");

export async function weeklyReflectionAI(
  notes: DailyNote[],
  direction?: string,
): Promise<WeeklyReflection> {
  const base = buildWeeklyReflection(notes, direction);
  if (!aiEnabled()) return base;

  const recent = notes.slice(-7);
  const user = [
    "아래 지난 7일 기록을 바탕으로 주간 Reflection을 JSON으로 작성하세요.",
    `• 추천받은 방향: ${direction ?? "(미정)"}`,
    `• 기록 횟수: ${recent.length}`,
    ...recent.map(
      (n, i) =>
        `[${i + 1}] 행동:${n.todayAction || "-"} / 감정:${n.moodTag ? MOOD_LABEL[n.moodTag] : "-"} / 고객말:${n.customerVoice || "-"} / 인사이트:${n.insight || "-"}`,
    ),
  ].join("\n");

  const json = (await callClaude(WEEKLY_SYSTEM, user, 900)) as
    | Partial<WeeklyReflection>
    | null;
  if (!json) return base;

  const arr = (v: unknown, fb: string[]) =>
    Array.isArray(v) && v.length ? (v.filter((x) => typeof x === "string") as string[]) : fb;
  const str = (v: unknown, fb: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fb;

  return {
    flow: str(json.flow, base.flow),
    movements: arr(json.movements, base.movements).slice(0, 3),
    patterns: arr(json.patterns, base.patterns).slice(0, 2),
    moodPattern: str(json.moodPattern, base.moodPattern),
    keepDoing: str(json.keepDoing, base.keepDoing),
    reduce: str(json.reduce, base.reduce),
    focusAction: str(json.focusAction, base.focusAction),
    noteCount: base.noteCount,
  };
}

function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
