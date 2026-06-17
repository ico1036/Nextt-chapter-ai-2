import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, listNotes } from "@/lib/store";
import { deriveTodayAction } from "@/lib/note";
import { computeMomentum, momentumCopy } from "@/lib/momentum";
import { computeProgress } from "@/lib/progress";
import { buildTimeline } from "@/lib/timeline";
import { Wordmark } from "../../components/Logo";
import TrackView from "../../components/TrackView";
import RememberSession from "../../components/RememberSession";
import MomentumDots from "../../components/MomentumDots";

export const dynamic = "force-dynamic";

export default async function HomeDashboard({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  const notes = await listNotes(sessionId);
  const name = session.name;
  const direction = session.report?.topRecommendation.label;
  const directionWhy = session.report?.directions.find(
    (d) => d.label === direction,
  )?.why;
  const { action } = deriveTodayAction(session.report?.firstAction, notes);
  const m = computeMomentum(notes);
  const copy = momentumCopy(m);
  const p = computeProgress(session, notes);
  const report = session.report;
  const lastNote = notes.length ? notes[notes.length - 1] : undefined;
  const timeline = buildTimeline(session, notes);
  const latestEvent = timeline.length ? timeline[timeline.length - 1] : undefined;
  const showWeekly = notes.length >= 2;

  // Re-entry aware welcome
  const welcome = !m.hasActivity
    ? { h: `${name ? name + "님, " : ""}안녕하세요.`, s: "오늘도 아주 작은 한 걸음이면 충분해요." }
    : m.gapDays >= 3
      ? { h: "다시 돌아와서 좋아요.", s: "며칠 비어도 괜찮아요. 오늘의 작은 한 걸음부터 다시 시작하면 돼요." }
      : { h: `${name ? name + "님, " : ""}안녕하세요.`, s: "이번 주도 방향을 잃지 않도록 같이 가볼게요." };

  return (
    <main className="bg-cream min-h-dvh pb-10">
      <TrackView event="home_viewed" meta={{ totalNotes: m.totalNotes }} />
      <RememberSession sessionId={sessionId} name={name} direction={direction} />

      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto max-w-2xl px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <h1 className="font-display text-[1.8rem] font-bold leading-snug text-ink sm:text-[2.1rem]">
            {welcome.h}
          </h1>
          <p className="mt-2 text-ink-soft">{welcome.s}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-6 pt-8">
        {/* 1. Direction reminder */}
        {direction && (
          <Link
            href={`/result/${sessionId}`}
            className="block rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">
              지금 당신의 방향
            </p>
            <p className="mt-2 font-display text-xl font-bold text-ink">
              {direction}
            </p>
            {directionWhy && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {directionWhy}
              </p>
            )}
            <p className="mt-3 text-sm text-clay">결과 다시 보기 →</p>
          </Link>
        )}

        {/* 2. Today's action */}
        <div className="overflow-hidden rounded-3xl border border-clay/30 bg-surface shadow-soft">
          <div className="bg-clay px-6 py-4 text-white">
            <p className="text-sm opacity-90">오늘의 작은 행동</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[1.05rem] font-medium leading-relaxed text-ink">
              {action}
            </p>
            <p className="mt-2 text-sm text-ink-faint">오늘은 이것만 해도 충분해요.</p>
            <Link
              href={`/next/${sessionId}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-clay-deep"
            >
              기록 남기러 가기 →
            </Link>
          </div>
        </div>

        {/* 2.5 이런 것도 해보면 좋아요 (공부·사람·도구) */}
        {(report?.whatToLearn?.length ||
          report?.peopleToReach?.length ||
          report?.toolsToTry?.length) && (
          <Link
            href={`/result/${sessionId}`}
            className="block rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">
              이런 것도 해보면 좋아요
            </p>
            <div className="mt-3 space-y-2 text-sm text-ink">
              {report?.whatToLearn?.[0] && (
                <p>📚 {report.whatToLearn[0]}</p>
              )}
              {report?.peopleToReach?.[0] && (
                <p>🤝 {report.peopleToReach[0]}</p>
              )}
              {report?.toolsToTry?.[0] && <p>🛠 {report.toolsToTry[0]}</p>}
            </div>
            <p className="mt-3 text-sm text-clay">리포트에서 더 보기 →</p>
          </Link>
        )}

        {/* 3. 방향 선명도 (컴퍼스) + 레벨·XP·스트릭 */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          {/* 방향 선명도 */}
          <div className="flex items-end justify-between">
            <p className="font-display text-lg font-bold text-ink">
              방향이 {p.clarity}% 선명해졌어요
            </p>
            <span className="text-2xl font-bold text-clay">{p.clarity}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-clay transition-all duration-700"
              style={{ width: `${Math.max(6, p.clarity)}%` }}
            />
          </div>
          {p.clarityGains[0] && (
            <p className="mt-2 text-sm text-ink-soft">{p.clarityGains[0]}</p>
          )}

          {/* 레벨 + XP */}
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-cream-2 px-4 py-3">
            <span className="text-2xl">{p.levelEmoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">
                  {p.levelName}
                </span>
                <span className="text-xs text-ink-faint">
                  {p.xpIntoLevel}/{p.xpForLevel} XP
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-sage transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((p.xpIntoLevel / p.xpForLevel) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 7일 흐름 + 무죄책 스트릭 */}
          <div className="mt-5">
            <MomentumDots last7={m.last7} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {p.streakOngoing && p.streak >= 1 && (
              <span className="rounded-full bg-clay-tint px-3 py-1 text-clay-deep">
                {p.streak}일째 이어가는 중
              </span>
            )}
            {p.returnCount > 0 && (
              <span className="rounded-full bg-sage-tint px-3 py-1 text-sage">
                다시 돌아온 힘 {p.returnCount}번
              </span>
            )}
            {m.activeDaysLast30 > 0 && (
              <span className="rounded-full bg-cream-2 px-3 py-1 text-ink-soft">
                최근 30일 중 {m.activeDaysLast30}일 연결
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {copy.subcopy}
          </p>
          <Link
            href={`/next/${sessionId}/calendar`}
            className="mt-4 inline-block text-sm font-medium text-clay"
          >
            내 흐름 보기 →
          </Link>
        </div>

        {/* 4. Recent reflection */}
        {lastNote?.reflection?.feedback && (
          <div className="rounded-3xl border border-sage/40 bg-sage-tint/50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                최근에 남긴 한 줄
              </p>
              <span className="text-xs text-ink-faint">{lastNote.date}</span>
            </div>
            <p className="mt-2 leading-relaxed text-ink">
              {lastNote.reflection.feedback}
            </p>
            <Link
              href={`/next/${sessionId}`}
              className="mt-3 inline-block text-sm text-clay"
            >
              기록 다시 보기 →
            </Link>
          </div>
        )}

        {/* 5. Weekly CTA (conditional) */}
        {showWeekly && (
          <Link
            href={`/next/${sessionId}/week`}
            className="flex items-center justify-between rounded-3xl border border-line bg-surface px-6 py-5 shadow-sm transition hover:border-clay hover:shadow-soft"
          >
            <div>
              <p className="font-display text-lg font-bold text-ink">
                이번 주의 흐름을 같이 돌아볼까요?
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                작게 남긴 기록 안에도 분명한 패턴이 있어요.
              </p>
            </div>
            <span className="text-2xl text-sage">↻</span>
          </Link>
        )}

        {/* 6. Trace preview */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/next/${sessionId}/calendar`}
            className="rounded-3xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-soft"
          >
            <span className="text-xl">🗓️</span>
            <p className="mt-2 font-display text-base font-bold text-ink">
              흔적 캘린더
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              움직였던 날들이 여기 남아 있어요.
            </p>
            <p className="mt-3 text-sm text-clay">캘린더 보기 →</p>
          </Link>
          <Link
            href={`/next/${sessionId}/timeline`}
            className="rounded-3xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-soft"
          >
            <span className="text-xl">🧭</span>
            <p className="mt-2 font-display text-base font-bold text-ink">
              나의 타임라인
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {latestEvent
                ? `최근: ${latestEvent.title}`
                : "작은 전환점들을 따라가볼게요."}
            </p>
            <p className="mt-3 text-sm text-clay">타임라인 보기 →</p>
          </Link>
        </div>

        <p className="pt-2 text-center text-sm text-ink-faint">
          크게 하지 않아도 괜찮아요. 멈추지만 않으면 돼요.
        </p>
      </div>
    </main>
  );
}
