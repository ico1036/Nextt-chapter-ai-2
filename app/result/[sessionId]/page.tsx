import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/store";
import { reportToText } from "@/lib/report";
import { ASSET_LABEL, USER_TYPE_LABEL } from "@/lib/engine";
import { Wordmark } from "../../components/Logo";
import TrackView from "../../components/TrackView";
import RememberSession from "../../components/RememberSession";
import ResultActions, { FollowUpCTA } from "./ResultActions";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) notFound();
  if (session.status !== "completed" || !session.report || !session.recommendation) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-xl font-bold text-ink">
          아직 결과가 준비되지 않았어요.
        </p>
        <Link href="/start" className="text-clay underline">
          진단을 다시 시작하기
        </Link>
      </main>
    );
  }

  const r = session.report;
  const rec = session.recommendation;
  const name = session.name;
  const reportText = reportToText(r, name);

  return (
    <main className="bg-cream pb-24">
      <TrackView event="result_viewed" meta={{ topDirection: rec.topDirection.label }} />
      <RememberSession
        sessionId={sessionId}
        name={name}
        direction={r.topRecommendation.label}
      />

      {/* Header band */}
      <div className="bg-warm-glow border-b border-line">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link href="/">
            <Wordmark />
          </Link>
          <span className="rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-ink-soft">
            {USER_TYPE_LABEL[rec.primaryUserType]}
          </span>
        </header>

        <div className="mx-auto max-w-3xl px-6 pb-12 pt-2 text-center">
          <p className="animate-fade-up text-sm font-semibold uppercase tracking-wider text-clay">
            {name ? `${name}님을 위한 진단 결과` : "당신을 위한 진단 결과"}
          </p>
          <h1 className="animate-fade-up delay-1 mx-auto mt-4 max-w-2xl font-display text-[1.7rem] font-bold leading-[1.45] text-ink sm:text-[2.2rem]">
            {r.summary}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-6 pt-12">
        {/* 강점 */}
        <Section index="01" title="당신의 강점">
          <ul className="space-y-3">
            {r.strengths.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl border border-line bg-surface p-5 leading-relaxed text-ink shadow-sm"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay-tint text-sm font-bold text-clay-deep">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {rec.assetTypes.map((a) => (
              <span
                key={a}
                className="rounded-full bg-sage-tint px-3 py-1 text-xs font-medium text-sage"
              >
                {ASSET_LABEL[a]}
              </span>
            ))}
          </div>
        </Section>

        {/* 방향 3가지 */}
        <Section index="02" title="당신에게 맞는 일의 방향 3가지">
          <div className="grid gap-4 sm:grid-cols-3">
            {r.directions.map((d, i) => {
              const isTop = d.label === r.topRecommendation.label;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 ${
                    isTop
                      ? "border-clay bg-clay-tint shadow-soft"
                      : "border-line bg-surface shadow-sm"
                  }`}
                >
                  <span className="font-display text-2xl font-bold text-clay/40">
                    {i + 1}
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-ink">
                    {d.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {d.why}
                  </p>
                  {isTop && (
                    <span className="mt-3 inline-block rounded-full bg-clay px-2.5 py-0.5 text-xs font-semibold text-white">
                      1순위
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* 1순위 추천 */}
        <Section index="03" title="지금 가장 잘 맞는 1순위 방향">
          <div className="overflow-hidden rounded-3xl border border-clay/40 bg-surface shadow-soft">
            <div className="bg-clay px-7 py-6 text-white">
              <p className="text-sm opacity-90">가장 현실적인 첫 시작</p>
              <p className="mt-1 font-display text-2xl font-bold">
                {r.topRecommendation.label}
              </p>
            </div>
            <div className="px-7 py-6">
              <p className="text-sm font-semibold text-ink-soft">
                왜 이 방향일까요?
              </p>
              <ul className="mt-3 space-y-2">
                {r.topRecommendation.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink">
                    <span className="mt-1 text-clay">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* 첫 오퍼 초안 */}
        <Section index="04" title="첫 오퍼 초안">
          <div className="rounded-3xl border border-line bg-gradient-to-br from-cream-2 to-surface p-7 shadow-sm">
            <span className="font-display text-5xl leading-none text-clay/30">
              “
            </span>
            <p className="-mt-4 font-display text-[1.15rem] font-medium leading-relaxed text-ink">
              {r.offerDraft}
            </p>
            <p className="mt-4 text-sm text-ink-faint">
              그대로 써도 좋고, 당신의 말투로 바꿔도 좋아요.
            </p>
          </div>
        </Section>

        {/* 첫 고객 채널 */}
        <Section index="05" title="첫 손님은 어디에 있을까요">
          <ul className="space-y-3">
            {r.customerChannels.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-5 text-ink shadow-sm"
              >
                <span className="text-lg">📍</span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 이번 주 첫 행동 */}
        <Section index="06" title="이번 주, 가장 작은 첫 행동">
          <div className="rounded-3xl border border-sage/40 bg-sage-tint p-7">
            <p className="text-lg font-medium leading-relaxed text-ink">
              {r.firstAction}
            </p>
          </div>
        </Section>

        {/* 다음으로 해볼 것들 — 공부 · 사람 · 도구 */}
        {(r.whatToLearn?.length ||
          r.peopleToReach?.length ||
          r.toolsToTry?.length) && (
          <Section index="07" title="다음으로 해볼 것들">
            <div className="grid gap-4 sm:grid-cols-3">
              <NextThing
                emoji="📚"
                title="지금 공부하면 좋은 것"
                items={r.whatToLearn}
              />
              <NextThing
                emoji="🤝"
                title="만나보면 좋은 사람"
                items={r.peopleToReach}
              />
              <NextThing
                emoji="🛠"
                title="써보면 좋은 도구"
                items={r.toolsToTry}
              />
            </div>
          </Section>
        )}

        {/* 마지막 한마디 */}
        <div className="rounded-3xl bg-ink px-8 py-10 text-center">
          <p className="font-display text-xl font-bold leading-relaxed text-cream sm:text-2xl">
            {r.closing}
          </p>
        </div>

        {/* 다음 단계 — 오늘의 첫 걸음 (My Next Chapter Note) */}
        <div className="bg-warm-glow rounded-3xl border border-clay/30 bg-surface px-7 py-9 text-center shadow-soft">
          <span className="text-3xl">🌅</span>
          <h2 className="mt-4 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
            이 방향으로 오늘의
            <br />
            첫 걸음을 시작해볼까요?
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            크게 하지 않아도 괜찮아요. 오늘은 15분 안에 할 수 있는
            <br className="hidden sm:block" />
            작은 행동 하나면 충분해요.
          </p>
          <Link
            href={`/next/${sessionId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3.5 font-semibold text-white shadow-soft transition hover:bg-clay-deep active:scale-[0.99]"
          >
            오늘의 작은 행동 보기 →
          </Link>
        </div>

        {/* Actions */}
        <div className="space-y-5 border-t border-line pt-10">
          <p className="text-center text-sm font-semibold text-ink-soft">
            결과를 보관하거나 나눠보세요
          </p>
          <ResultActions
            sessionId={sessionId}
            reportText={reportText}
            name={name}
          />
        </div>

        {/* Follow-up */}
        <div className="space-y-4 pt-4">
          <p className="text-center font-display text-lg font-bold text-ink">
            다음 걸음도 함께할까요?
          </p>
          <FollowUpCTA sessionId={sessionId} />
        </div>

        <div className="pt-6 text-center">
          <Link
            href="/start"
            className="text-sm text-ink-soft underline transition hover:text-clay"
          >
            다시 진단하기
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-display text-sm font-bold text-clay">{index}</span>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function NextThing({
  emoji,
  title,
  items,
}: {
  emoji: string;
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
        <span>{emoji}</span>
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm leading-relaxed text-ink-soft">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
