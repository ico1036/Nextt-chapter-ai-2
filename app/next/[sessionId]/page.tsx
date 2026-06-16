import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, listNotes } from "@/lib/store";
import { deriveTodayAction } from "@/lib/note";
import { MOOD_OPTIONS } from "@/lib/note";
import { LogoMark, Wordmark } from "../../components/Logo";
import TrackView from "../../components/TrackView";
import TodayStep from "./TodayStep";
import type { DailyNote, MoodTag } from "@/lib/types";

export const dynamic = "force-dynamic";

const moodMeta: Record<MoodTag, { label: string; emoji: string }> =
  Object.fromEntries(
    MOOD_OPTIONS.map((m) => [m.id, { label: m.label, emoji: m.emoji }]),
  ) as Record<MoodTag, { label: string; emoji: string }>;

export default async function NoteHome({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  const notes = await listNotes(sessionId);
  const ordered = [...notes].reverse(); // newest first
  const { action, source } = deriveTodayAction(
    session.report?.firstAction,
    notes,
  );
  const direction = session.report?.topRecommendation.label;
  const name = session.name;
  const showWeekly = notes.length >= 2;

  return (
    <main className="bg-cream min-h-dvh pb-24">
      <TrackView event="note_home_viewed" meta={{ noteCount: notes.length }} />

      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Wordmark />
          </Link>
          <Link
            href={`/result/${sessionId}`}
            className="text-sm text-ink-soft underline-offset-2 transition hover:text-clay hover:underline"
          >
            진단 결과
          </Link>
        </header>
        <div className="mx-auto max-w-2xl px-6 pb-8 pt-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-clay">
            My Next Chapter Note
          </p>
          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            {name ? `${name}님, ` : ""}큰 계획보다
            <br />
            오늘의 작은 움직임을 남겨요.
          </h1>
          {direction && (
            <p className="mt-3 text-ink-soft">
              지금 향하는 방향 ·{" "}
              <b className="text-ink">{direction}</b>
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-6 pt-8">
        {/* Today's Next Step */}
        <TodayStep sessionId={sessionId} initialAction={action} source={source} />

        {/* Record entry */}
        <Link
          href={`/next/${sessionId}/note`}
          className="flex items-center justify-between rounded-2xl border border-line bg-surface px-6 py-5 shadow-sm transition hover:border-clay hover:shadow-soft"
        >
          <div>
            <p className="font-display text-lg font-bold text-ink">
              오늘의 기록을 남겨볼까요?
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              길게 쓰지 않아도 괜찮아요. 2~3분이면 충분해요.
            </p>
          </div>
          <span className="text-2xl text-clay">→</span>
        </Link>

        {/* Weekly reflection entry */}
        {showWeekly && (
          <Link
            href={`/next/${sessionId}/week`}
            className="flex items-center justify-between rounded-2xl border border-sage/40 bg-sage-tint px-6 py-5 transition hover:shadow-soft"
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

        {/* History */}
        <section className="pt-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              내 작은 걸음들
            </h2>
            <span className="text-sm text-ink-faint">
              {notes.length}개의 기록
            </span>
          </div>

          {ordered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
              <LogoMark className="mx-auto h-10 w-10 opacity-70" />
              <p className="mt-4 font-medium text-ink">
                아직 남겨진 기록이 없어요.
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                오늘의 첫 한 줄부터 시작해볼까요?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordered.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          )}
        </section>

        <p className="pt-2 text-center text-sm text-ink-faint">
          크지 않아도, 당신은 이미 움직이고 있어요.
        </p>
      </div>
    </main>
  );
}

function NoteCard({ note }: { note: DailyNote }) {
  const mood = note.moodTag ? moodMeta[note.moodTag] : undefined;
  return (
    <article className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-faint">{note.date}</span>
        {mood && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-2 px-3 py-1 text-xs text-ink-soft">
            <span>{mood.emoji}</span>
            {mood.label}
          </span>
        )}
      </div>

      {note.todayAction && (
        <p className="mt-3 leading-relaxed text-ink">
          <span className="text-clay">✓</span> {note.todayAction}
        </p>
      )}
      {note.customerVoice && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          🗣️ {note.customerVoice}
        </p>
      )}
      {note.insight && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          💡 {note.insight}
        </p>
      )}

      {note.reflection && (
        <div className="mt-4 rounded-2xl bg-sage-tint/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage">
            오늘의 한 줄 피드백
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {note.reflection.feedback}
          </p>
          {note.reflection.nextAction && (
            <p className="mt-3 border-t border-sage/20 pt-3 text-sm text-ink">
              <b className="text-clay-deep">다음 행동 ·</b>{" "}
              {note.reflection.nextAction}
            </p>
          )}
        </div>
      )}

      {note.nextStep && !note.reflection?.nextAction && (
        <p className="mt-3 text-sm text-ink-soft">
          <b>내일 ·</b> {note.nextStep}
        </p>
      )}
    </article>
  );
}
