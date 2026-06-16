"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MICRO_ACTIONS } from "@/lib/note";
import { track } from "@/lib/track";

export default function TodayStep({
  sessionId,
  initialAction,
  source,
}: {
  sessionId: string;
  initialAction: string;
  source: "report" | "yesterday" | "fallback";
}) {
  const router = useRouter();
  // Action options: the derived action first, then the micro pool.
  const pool = [initialAction, ...MICRO_ACTIONS.filter((a) => a !== initialAction)];
  const [idx, setIdx] = useState(0);
  const action = pool[idx % pool.length];

  const sourceLabel =
    source === "yesterday"
      ? "어제 정한 다음 걸음"
      : source === "report"
        ? "진단이 추천한 첫 걸음"
        : "오늘의 작은 걸음";

  function cycle() {
    track("today_step_cycled", undefined, sessionId);
    setIdx((i) => i + 1);
  }

  function record(did: boolean) {
    track("today_step_chosen", { did }, sessionId);
    const q = new URLSearchParams();
    if (did) q.set("did", action);
    router.push(`/next/${sessionId}/note${q.toString() ? `?${q}` : ""}`);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-clay/30 bg-surface shadow-soft">
      <div className="bg-clay px-7 py-5 text-white">
        <p className="text-sm opacity-90">오늘의 작은 행동</p>
        <p className="mt-0.5 font-display text-xl font-bold">
          오늘은 이것만 해봐도 충분해요
        </p>
      </div>
      <div className="px-7 py-6">
        <span className="inline-block rounded-full bg-sage-tint px-3 py-1 text-xs font-medium text-sage">
          {sourceLabel}
        </span>
        <p className="mt-4 text-[1.1rem] font-medium leading-relaxed text-ink">
          {action}
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          이 작은 행동 하나가, 당신이 정말 도와줄 수 있는 문제를 보여줄 수 있어요.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => record(true)}
            className="rounded-full bg-clay px-6 py-3.5 text-center font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
          >
            이걸 오늘 해볼래요 → 기록하기
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={cycle}
              className="flex-1 rounded-full border border-line px-5 py-3 text-sm text-ink-soft transition hover:border-clay hover:text-clay"
            >
              다른 작은 행동 보기
            </button>
            <button
              onClick={() => record(false)}
              className="flex-1 rounded-full border border-line px-5 py-3 text-sm text-ink-soft transition hover:border-clay hover:text-clay"
            >
              지금은 기록만 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
