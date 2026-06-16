"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../../../components/Logo";
import { track } from "@/lib/track";
import type { WeeklyReflection } from "@/lib/types";

export default function WeekPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [weekly, setWeekly] = useState<WeeklyReflection | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    track("weekly_viewed", undefined, sessionId);
    fetch(`/api/week?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.weekly) {
          setWeekly(d.weekly);
          setState("ready");
        } else setState("error");
      })
      .catch(() => setState("error"));
  }, [sessionId]);

  return (
    <main className="bg-cream min-h-dvh pb-24">
      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
          <Link
            href={`/next/${sessionId}`}
            className="text-sm text-ink-soft transition hover:text-clay"
          >
            내 기록
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-sage">
            Weekly Reflection
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            이번 주, 당신은
            <br />
            어떻게 움직였을까요?
          </h1>
          <p className="mt-3 text-ink-soft">
            이 회고는 평가가 아니라 정리예요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-8">
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6 h-16 w-16">
              <span className="absolute inset-0 animate-breathe rounded-full bg-sage-tint" />
              <span className="absolute inset-4 animate-breathe rounded-full bg-sage [animation-delay:0.5s]" />
            </div>
            <p className="text-ink-soft">이번 주의 흐름을 읽고 있어요…</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-3xl border border-line bg-surface p-8 text-center">
            <p className="text-ink-soft">
              아직 회고를 만들 만큼 기록이 충분하지 않아요.
            </p>
            <Link
              href={`/next/${sessionId}/note`}
              className="mt-4 inline-block rounded-full bg-clay px-6 py-3 font-semibold text-white"
            >
              오늘 기록 남기기
            </Link>
          </div>
        )}

        {state === "ready" && weekly && (
          <div className="space-y-5">
            <WCard title="이번 주의 흐름" accent="clay">
              <p className="leading-relaxed text-ink">{weekly.flow}</p>
            </WCard>

            <WCard title="이번 주에 이미 한 움직임" accent="sage">
              <p className="mb-3 text-sm text-ink-soft">
                작아 보여도, 이런 움직임이 방향을 현실로 바꿔줘요.
              </p>
              <ul className="space-y-2">
                {weekly.movements.map((m, i) => (
                  <li key={i} className="flex gap-2 text-ink">
                    <span className="text-sage">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </WCard>

            <WCard title="이번 주에 반복해서 보인 문제" accent="clay">
              <p className="mb-3 text-sm text-ink-soft">
                사람들이 자꾸 말하는 어려움 속에, 당신의 일이 숨어 있을 수 있어요.
              </p>
              <ul className="space-y-2">
                {weekly.patterns.map((p, i) => (
                  <li key={i} className="flex gap-2 text-ink">
                    <span className="text-clay">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </WCard>

            <WCard title="이번 주의 감정 흐름" accent="sage">
              <p className="leading-relaxed text-ink">{weekly.moodPattern}</p>
            </WCard>

            <WCard title="다음 주에는 이렇게 가보세요" accent="clay">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                    계속할 것
                  </p>
                  <p className="mt-1 text-ink">{weekly.keepDoing}</p>
                </div>
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    줄일 것
                  </p>
                  <p className="mt-1 text-ink">{weekly.reduce}</p>
                </div>
              </div>
            </WCard>

            <div className="rounded-3xl border border-clay/40 bg-clay-tint p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-clay-deep">
                다음 주의 가장 작은 초점 행동
              </p>
              <p className="mt-2 text-[1.1rem] font-medium leading-relaxed text-ink">
                {weekly.focusAction}
              </p>
            </div>

            <div className="rounded-3xl bg-ink px-8 py-10 text-center">
              <p className="font-display text-xl font-bold leading-relaxed text-cream">
                이번 주를 그냥 흘려보낸 건 아니었어요.
              </p>
              <p className="mt-3 text-cream/70">
                완벽하게보다, 다시 돌아오는 흐름이면 충분해요.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href={`/next/${sessionId}`}
                className="rounded-full bg-clay px-6 py-4 text-center font-semibold text-white shadow-soft transition hover:bg-clay-deep"
              >
                내 기록 다시 보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function WCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "clay" | "sage";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            accent === "clay" ? "bg-clay" : "bg-sage"
          }`}
        />
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
