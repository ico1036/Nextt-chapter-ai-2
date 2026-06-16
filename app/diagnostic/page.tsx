"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "../components/Logo";
import {
  QUESTIONS,
  MID_SUMMARY_AFTER_KEY,
  type Question,
} from "@/lib/questions";
import { track } from "@/lib/track";
import { saveLocalSession } from "@/lib/session-client";

export default function DiagnosticPage() {
  return (
    <Suspense fallback={<FullLoader />}>
      <DiagnosticFlow />
    </Suspense>
  );
}

function FullLoader() {
  return (
    <main className="flex min-h-dvh items-center justify-center text-ink-soft">
      불러오는 중…
    </main>
  );
}

const MID_INDEX = QUESTIONS.findIndex((q) => q.key === MID_SUMMARY_AFTER_KEY);

function DiagnosticFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const sid = params.get("sid") ?? "";
  const name = params.get("name") ?? "";

  // step: 0..QUESTIONS.length-1 are questions.
  // A special "mid summary" interstitial appears between MID_INDEX and MID_INDEX+1.
  const [qIndex, setQIndex] = useState(0);
  const [showMid, setShowMid] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textValue, setTextValue] = useState("");
  const [phase, setPhase] = useState<"flow" | "processing">("flow");
  const advancing = useRef(false);

  const question = QUESTIONS[qIndex];
  const total = QUESTIONS.length;

  // Guard: no session → back to start.
  useEffect(() => {
    if (!sid) router.replace("/start");
  }, [sid, router]);

  // Sync textarea when navigating to a text question.
  useEffect(() => {
    if (question?.type === "text") setTextValue(answers[question.key] ?? "");
  }, [qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  async function persist(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    track("question_answered", { key, index: qIndex + 1 }, sid);
    try {
      await fetch("/api/response", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sid, key, value }),
      });
    } catch {
      /* keep going; completion re-sends merged answers */
    }
  }

  function goNext(curKey: string) {
    if (advancing.current) return;
    // Insert mid summary after MID_INDEX
    if (qIndex === MID_INDEX && !showMid) {
      setShowMid(true);
      return;
    }
    if (qIndex < total - 1) {
      setQIndex((i) => i + 1);
    } else {
      void complete();
    }
  }

  function goBack() {
    if (showMid) {
      setShowMid(false);
      return;
    }
    if (qIndex > 0) setQIndex((i) => i - 1);
  }

  async function handleSelect(q: Question, optionId: string) {
    if (advancing.current) return;
    advancing.current = true;
    await persist(q.key, optionId);
    // brief highlight, then advance
    setTimeout(() => {
      advancing.current = false;
      goNext(q.key);
    }, 280);
  }

  async function handleTextNext(q: Question, skip = false) {
    const val = skip ? "" : textValue.trim();
    await persist(q.key, val);
    goNext(q.key);
  }

  async function complete() {
    setPhase("processing");
    track("processing_viewed", undefined, sid);
    try {
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sid, name, answers }),
      });
      if (!res.ok) throw new Error("complete failed");
      // Remember this session in the browser so a returning user can
      // jump straight back to her result and daily log via the menu.
      saveLocalSession(sid, name || undefined);
      // Let the calming animation breathe for a moment.
      await new Promise((r) => setTimeout(r, 2600));
      router.push(`/result/${sid}`);
    } catch {
      alert("결과를 만드는 중 문제가 있었어요. 다시 시도해 주세요.");
      setPhase("flow");
    }
  }

  if (phase === "processing") return <Processing />;
  if (!question) return <FullLoader />;

  const progress = showMid
    ? ((MID_INDEX + 1) / total) * 100
    : (qIndex / total) * 100;

  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-4">
          <button
            onClick={goBack}
            disabled={qIndex === 0 && !showMid}
            className="text-ink-soft transition hover:text-clay disabled:opacity-0"
            aria-label="이전"
          >
            ←
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-clay transition-all duration-500 ease-out"
              style={{ width: `${Math.max(6, progress)}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm tabular-nums text-ink-faint">
            {Math.min(qIndex + 1, total)}/{total}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:py-12">
        {showMid ? (
          <MidSummary
            name={name}
            answers={answers}
            onContinue={() => {
              setShowMid(false);
              setQIndex(MID_INDEX + 1);
            }}
          />
        ) : (
          <div key={qIndex} className="animate-fade-up flex flex-1 flex-col">
            <p className="text-sm font-semibold uppercase tracking-wider text-clay">
              {question.section}
            </p>
            <h2 className="mt-3 font-display text-[1.5rem] font-bold leading-snug text-ink sm:text-[1.8rem]">
              {question.prompt}
            </h2>
            {question.helper && (
              <p className="mt-3 leading-relaxed text-ink-soft">
                {question.helper}
              </p>
            )}

            <div className="mt-8 flex-1">
              {question.type === "single" ? (
                <div className="grid gap-3">
                  {question.options!.map((opt) => {
                    const selected = answers[question.key] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(question, opt.id)}
                        className={`group flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-[1.02rem] leading-snug transition active:scale-[0.99] ${
                          selected
                            ? "border-clay bg-clay-tint text-clay-deep shadow-soft"
                            : "border-line bg-surface text-ink hover:border-clay/50 hover:bg-cream-2"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                            selected
                              ? "border-clay bg-clay text-white"
                              : "border-line text-transparent group-hover:border-clay/50"
                          }`}
                        >
                          ✓
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder={question.placeholder}
                    rows={5}
                    autoFocus
                    className="w-full resize-none rounded-2xl border border-line bg-surface px-5 py-4 text-[1.02rem] leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-clay"
                  />
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => handleTextNext(question)}
                      className="flex-1 rounded-full bg-clay px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
                    >
                      다음
                    </button>
                    {question.optional && (
                      <button
                        onClick={() => handleTextNext(question, true)}
                        className="rounded-full border border-line px-5 py-3.5 text-ink-soft transition hover:border-clay hover:text-clay"
                      >
                        건너뛰기
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Mid-flow reflection (Screen between questions) ───────────
function MidSummary({
  name,
  answers,
  onContinue,
}: {
  name: string;
  answers: Record<string, string>;
  onContinue: () => void;
}) {
  const styleLabel: Record<string, string> = {
    one_on_one: "한 사람을 깊이 돕는",
    small_group: "작은 그룹을 이끄는",
    make_alone: "혼자 차분히 만들어내는",
    teach: "쉽게 설명하고 가르치는",
    connect: "사람과 사람을 잇는",
  };
  const style = styleLabel[answers.work_style] ?? "당신만의";
  const hint =
    (answers.often_asked || answers.good_at_unpaid || "").trim().slice(0, 28);

  return (
    <div className="animate-fade-up flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
        <span className="text-2xl">🌤️</span>
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-sage">
        잠깐, 여기까지 비춰보면
      </p>
      <h2 className="mt-4 max-w-md font-display text-[1.5rem] font-bold leading-snug text-ink sm:text-[1.8rem]">
        {name ? `${name}님은 ` : "당신은 "}
        <span className="text-clay-deep">{style}</span> 사람이네요.
      </h2>
      <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
        {hint
          ? `“${hint}…” 같은 결도 보였어요. 이런 단서들이 모이면 방향이 또렷해져요. `
          : "지금까지 답에서 작은 단서들이 보이기 시작했어요. "}
        조금만 더 가볼까요?
      </p>
      <button
        onClick={onContinue}
        className="mt-9 rounded-full bg-clay px-8 py-4 font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
      >
        계속하기 →
      </button>
    </div>
  );
}

// ── Processing screen (Screen 4) ─────────────────────────────
const PROCESSING_LINES = [
  "당신의 경험 속 공통점을 찾고 있어요",
  "지금 가능한 방향을 정리하고 있어요",
  "가장 부담이 적은 첫 시작을 고르고 있어요",
];

function Processing() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((v) => (v + 1) % PROCESSING_LINES.length),
      1400,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <main className="bg-warm-glow flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-10 h-24 w-24">
        <span className="absolute inset-0 animate-breathe rounded-full bg-clay-tint" />
        <span className="absolute inset-3 animate-breathe rounded-full bg-clay/30 [animation-delay:0.4s]" />
        <span className="absolute inset-6 animate-breathe rounded-full bg-clay [animation-delay:0.8s]" />
      </div>
      <p className="font-display text-xl font-bold text-ink">{PROCESSING_LINES[i]}</p>
      <p className="mt-3 text-ink-soft">잠시만요, 거의 다 됐어요…</p>
    </main>
  );
}
