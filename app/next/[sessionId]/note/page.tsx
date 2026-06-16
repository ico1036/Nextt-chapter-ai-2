"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "../../../components/Logo";
import { NOTE_STEPS, MOOD_OPTIONS } from "@/lib/note";
import { track } from "@/lib/track";
import type { MoodTag, NoteReflection } from "@/lib/types";

type Values = {
  todayAction: string;
  moodTag: MoodTag | "";
  customerVoice: string;
  insight: string;
  nextStep: string;
};

export default function NotePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return (
    <Suspense fallback={<Loader />}>
      <NoteFlow sessionId={sessionId} />
    </Suspense>
  );
}

function Loader() {
  return (
    <main className="flex min-h-dvh items-center justify-center text-ink-soft">
      불러오는 중…
    </main>
  );
}

function NoteFlow({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const prefillAction = search.get("did") ?? "";

  const [phase, setPhase] = useState<"intro" | "flow" | "saving" | "done">(
    "intro",
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({
    todayAction: prefillAction,
    moodTag: "",
    customerVoice: "",
    insight: "",
    nextStep: "",
  });
  const [reflection, setReflection] = useState<NoteReflection | null>(null);

  useEffect(() => {
    track("note_intro_viewed", undefined, sessionId);
  }, [sessionId]);

  const current = NOTE_STEPS[step];
  const total = NOTE_STEPS.length;

  function setVal(key: keyof Values, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
  }

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
    else void submit();
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
    else setPhase("intro");
  }

  async function submit() {
    setPhase("saving");
    try {
      const res = await fetch("/api/note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, ...values }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      track("note_created", undefined, sessionId);
      setReflection(data.note?.reflection ?? null);
      setPhase("done");
    } catch {
      alert("기록을 저장하는 중 문제가 있었어요. 다시 시도해 주세요.");
      setPhase("flow");
    }
  }

  // ── Intro ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <Shell sessionId={sessionId}>
        <div className="animate-fade-up flex flex-1 flex-col justify-center">
          <span className="text-3xl">📓</span>
          <h1 className="mt-5 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            오늘의 기록을 남겨볼까요?
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            길게 쓰지 않아도 괜찮아요. 오늘의 작은 움직임만 남겨도 충분해요.
            묻는 건 다섯 가지뿐이에요.
          </p>
          <div className="mt-8 flex flex-col gap-2.5">
            <button
              onClick={() => {
                track("note_started", undefined, sessionId);
                setPhase("flow");
              }}
              className="rounded-full bg-clay px-6 py-4 font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
            >
              기록 시작하기 →
            </button>
            <Link
              href={`/next/${sessionId}`}
              className="rounded-full border border-line px-6 py-3.5 text-center text-ink-soft transition hover:border-clay hover:text-clay"
            >
              오늘은 건너뛸게요
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Saving ─────────────────────────────────────────────
  if (phase === "saving") {
    return (
      <Shell sessionId={sessionId}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative mb-8 h-16 w-16">
            <span className="absolute inset-0 animate-breathe rounded-full bg-clay-tint" />
            <span className="absolute inset-4 animate-breathe rounded-full bg-clay [animation-delay:0.5s]" />
          </div>
          <p className="font-display text-lg font-bold text-ink">
            오늘의 기록을 읽고 있어요…
          </p>
        </div>
      </Shell>
    );
  }

  // ── Done (reflection) ──────────────────────────────────
  if (phase === "done") {
    return (
      <Shell sessionId={sessionId}>
        <div className="animate-fade-up flex flex-1 flex-col">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="font-display text-[1.6rem] font-bold leading-snug text-ink sm:text-[1.9rem]">
            좋아요. 오늘의 작은 움직임이 남았어요.
          </h1>
          <p className="mt-3 leading-relaxed text-ink-soft">
            완벽하지 않아도 괜찮아요. 멈추지 않고 흔적을 남긴 게 중요해요.
          </p>

          {reflection && (
            <div className="mt-7 rounded-3xl border border-sage/40 bg-sage-tint/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                오늘의 한 줄 피드백
              </p>
              <p className="mt-2 leading-relaxed text-ink">
                {reflection.feedback}
              </p>
              {reflection.nextAction && (
                <div className="mt-4 border-t border-sage/20 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-clay">
                    내일의 더 작은 다음 행동
                  </p>
                  <p className="mt-1.5 leading-relaxed text-ink">
                    {reflection.nextAction}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2.5">
            <Link
              href={`/next/${sessionId}`}
              className="rounded-full bg-clay px-6 py-4 text-center font-semibold text-white shadow-soft transition hover:bg-clay-deep"
            >
              내 기록 보기
            </Link>
            <Link
              href={`/next/${sessionId}`}
              className="rounded-full border border-line px-6 py-3.5 text-center text-ink-soft transition hover:border-clay hover:text-clay"
            >
              오늘은 여기까지
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Flow ───────────────────────────────────────────────
  const progress = ((step + 1) / total) * 100;
  return (
    <Shell sessionId={sessionId}>
      <div className="mb-7 flex items-center gap-3">
        <button
          onClick={back}
          className="text-ink-soft transition hover:text-clay"
          aria-label="이전"
        >
          ←
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-clay transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm tabular-nums text-ink-faint">
          {step + 1}/{total}
        </span>
      </div>

      <div key={step} className="animate-fade-up flex flex-1 flex-col">
        <h2 className="font-display text-[1.4rem] font-bold leading-snug text-ink sm:text-[1.65rem]">
          {current.prompt}
        </h2>
        {current.helper && (
          <p className="mt-3 text-[0.97rem] leading-relaxed text-ink-soft">
            {current.helper}
          </p>
        )}

        <div className="mt-7 flex flex-1 flex-col">
          {current.type === "mood" ? (
            <div className="grid gap-3">
              {MOOD_OPTIONS.map((m) => {
                const selected = values.moodTag === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setVal("moodTag", m.id);
                      setTimeout(next, 240);
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition active:scale-[0.99] ${
                      selected
                        ? "border-clay bg-clay-tint text-clay-deep shadow-soft"
                        : "border-line bg-surface text-ink hover:border-clay/50 hover:bg-cream-2"
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <textarea
                value={values[current.key as keyof Values] as string}
                onChange={(e) => setVal(current.key as keyof Values, e.target.value)}
                placeholder={current.placeholder}
                rows={4}
                autoFocus
                className="w-full resize-none rounded-2xl border border-line bg-surface px-5 py-4 leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-clay"
              />
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={next}
                  className="flex-1 rounded-full bg-clay px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
                >
                  {step === total - 1 ? "기록 완료하기" : "다음"}
                </button>
                {current.optional && (
                  <button
                    onClick={next}
                    className="rounded-full border border-line px-5 py-3.5 text-ink-soft transition hover:border-clay hover:text-clay"
                  >
                    건너뛰기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-cream flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-2xl px-6 py-5">
        <Link href={`/next/${sessionId}`}>
          <Wordmark />
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-10">
        {children}
      </div>
    </main>
  );
}
