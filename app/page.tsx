import Link from "next/link";
import TrackView from "./components/TrackView";
import { LogoMark, Wordmark } from "./components/Logo";

const painPoints = [
  "나는 도대체 무슨 일로 다시 돈을 벌 수 있지?",
  "내 경험이… 정말 가치가 있는 걸까?",
  "집이랑 육아랑 같이 할 수 있는 일이 있을까?",
  "AI는 배웠는데, 이걸 내 일이랑 어떻게 연결하지?",
];

const userTypes = [
  {
    tag: "다시 시작하는 엄마",
    desc: "육아·이민·경력 단절 이후, 다시 내 일을 찾고 싶은 분",
    tint: "bg-clay-tint",
  },
  {
    tag: "이미 자산이 있는 엄마",
    desc: "교육·상담·부동산·뷰티 등 경험은 있는데 어떻게 팔지 막힌 분",
    tint: "bg-sage-tint",
  },
  {
    tag: "AI가 궁금한 엄마",
    desc: "AI는 배웠거나 관심 있는데, 수익과 연결을 못 한 분",
    tint: "bg-clay-tint",
  },
  {
    tag: "사람을 잇는 엄마",
    desc: "모임·소개·연결에 강점이 있는, 관계 자산이 큰 분",
    tint: "bg-sage-tint",
  },
];

const steps = [
  {
    n: "01",
    t: "편하게 답해요",
    d: "시험이 아니에요. 14개의 짧은 질문에, 떠오르는 대로 답하면 돼요.",
  },
  {
    n: "02",
    t: "AI가 비춰줘요",
    d: "흩어진 경험 속에서 당신의 강점과 가능한 방향을 정리해드려요.",
  },
  {
    n: "03",
    t: "한 방향이 보여요",
    d: "가장 현실적인 1순위 방향과, 이번 주에 할 수 있는 첫 행동까지.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <TrackView event="landing_viewed" />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/start"
          className="hidden rounded-full border border-line bg-surface/70 px-5 py-2 text-sm font-medium text-ink-soft transition hover:border-clay hover:text-clay sm:inline-block"
        >
          진단 시작하기
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="bg-warm-glow relative">
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-12 text-center sm:pt-20">
          <p className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm text-ink-soft shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            미국 한인 이민자 엄마를 위한 AI 진단
          </p>

          <h1 className="animate-fade-up delay-1 font-display text-[2.1rem] font-bold leading-[1.32] text-ink sm:text-[3.1rem] sm:leading-[1.3]">
            내가 다시 할 수 있는 일,
            <br />
            <span className="relative inline-block text-clay-deep">
              그 방향 하나
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5C40 4 120 3 197 6.5"
                  stroke="var(--color-gold)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </span>
            <br />
            함께 찾아드릴게요.
          </h1>

          <p className="animate-fade-up delay-2 mx-auto mt-7 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
            창업을 배우는 게 아니에요. 흩어져 있던 내 경험과 강점에서,
            <br className="hidden sm:block" />
            지금 작게 시작할 수 있는 <b className="text-ink">단 하나의 방향</b>을
            선명하게 보는 시간이에요.
          </p>

          <div className="animate-fade-up delay-3 mt-9 flex flex-col items-center gap-3">
            <Link
              href="/start"
              className="group inline-flex items-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.98]"
            >
              무료로 진단 시작하기
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <p className="text-sm text-ink-faint">
              약 15분 · 가입 없이 · 완전 무료
            </p>
          </div>
        </div>

        {/* Floating sample peek */}
        <div className="pointer-events-none mx-auto -mb-16 max-w-md px-6">
          <div className="animate-float rounded-3xl border border-line bg-surface/90 p-5 shadow-lift backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay">
              진단 결과 미리보기
            </p>
            <p className="mt-2 font-display text-lg font-bold text-ink">
              “당신에게 가장 잘 맞는 1순위 방향”
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              1:1 가이드 서비스 · 이번 주 첫 행동 1개까지 정리해드려요.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pain points ─────────────────────────────────── */}
      <section className="bg-cream-2 pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            이런 생각, 해본 적 있나요?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {painPoints.map((p) => (
              <div
                key={p}
                className="rounded-2xl border border-line bg-surface px-6 py-5 text-left text-[1.02rem] leading-relaxed text-ink shadow-sm"
              >
                <span className="mr-2 text-clay">“</span>
                {p}
              </div>
            ))}
          </div>
          <p className="mt-10 text-[1.05rem] leading-relaxed text-ink-soft">
            가능성이 없는 게 아니에요.
            <br />
            <b className="text-ink">아직 ‘일의 언어’로 번역되지 않았을 뿐</b>
            이에요.
          </p>
        </div>
      </section>

      {/* ── What you get ────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-clay">
              15분 뒤, 당신이 받는 것
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
              막연함 대신, 손에 잡히는 한 페이지
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <ResultCard
              title="나의 강점 요약"
              body="흩어진 경험에서 ‘이미 잘하고 있던 것’을 3~4가지로 비춰드려요."
              accent="clay"
            />
            <ResultCard
              title="가능한 일의 방향 3가지"
              body="당신의 경험·시간·성향에 맞는 현실적인 방향 세 가지."
              accent="sage"
            />
            <ResultCard
              title="가장 현실적인 1순위"
              body="그중 지금 가장 작게 시작할 수 있는 단 하나를 골라드려요."
              accent="clay"
            />
            <ResultCard
              title="첫 오퍼 & 이번 주 첫 행동"
              body="첫 손님에게 보낼 제안 초안과, 오늘 할 수 있는 작은 한 걸음까지."
              accent="sage"
            />
          </div>
        </div>
      </section>

      {/* ── Who it's for ────────────────────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              누구를 위한 서비스인가요
            </h2>
            <p className="mt-3 text-ink-soft">
              35~55세, 한국어가 편한, 미국에 사는 엄마들을 위해 만들었어요.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {userTypes.map((u) => (
              <div
                key={u.tag}
                className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition hover:shadow-soft"
              >
                <span
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${u.tint}`}
                >
                  <LogoMark className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{u.tag}</p>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">
                    {u.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
            어떻게 진행되나요
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center sm:text-left">
                <span className="font-display text-3xl font-bold text-clay/40">
                  {s.n}
                </span>
                <p className="mt-3 font-display text-lg font-bold text-ink">
                  {s.t}
                </p>
                <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── After the report: momentum ──────────────────── */}
      <section className="bg-cream-2 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-clay">
                방향을 찾은 다음에도
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
                혼자 두지 않아요.
                <br />
                하루 15분이면 충분해요.
              </h2>
              <p className="mt-5 leading-relaxed text-ink-soft">
                진단이 끝이 아니에요. 오늘의 작은 행동 하나를 정하고, 짧게
                기록하면 AI가 당신의 흐름을 읽고 다음 걸음을 함께 찾아줘요.
                크게 하지 않아도 괜찮아요.{" "}
                <b className="text-ink">멈추지만 않으면 돼요.</b>
              </p>
              <ul className="mt-6 space-y-2.5 text-ink">
                {[
                  "오늘의 가장 작은 행동 1개",
                  "2~3분이면 끝나는 짧은 기록",
                  "AI의 따뜻한 한 줄 피드백",
                  "한 주를 돌아보는 주간 회고",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="text-clay">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay">
                My Next Chapter Note
              </p>
              <div className="mt-3 rounded-2xl bg-cream-2 p-4">
                <p className="text-sm text-ink-soft">오늘의 작은 행동</p>
                <p className="mt-1 font-medium text-ink">
                  가장 편한 지인 한 명에게 “요즘 제일 막막한 게 뭐예요?”라고
                  물어보세요.
                </p>
              </div>
              <div className="mt-3 rounded-2xl bg-sage-tint/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                  오늘의 한 줄 피드백
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  오늘은 막막함을 안고도 한 걸음 나갔어요. 지금은 더 많이 하기보다,
                  같은 질문을 한 사람에게 더 해보는 게 좋아 보여요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="bg-warm-glow mx-auto max-w-3xl rounded-[2rem] border border-line bg-surface px-8 py-16 text-center shadow-soft">
          <LogoMark className="mx-auto h-12 w-12 animate-breathe" />
          <h2 className="mt-6 font-display text-2xl font-bold leading-snug text-ink sm:text-[2rem]">
            “이제 나도, 이 방향으로
            <br />
            한번 작게 시작해볼 수 있겠어.”
          </h2>
          <p className="mt-4 text-ink-soft">
            진단을 마친 분들이 하는 말이에요. 당신의 차례예요.
          </p>
          <Link
            href="/start"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.98]"
          >
            무료로 진단 시작하기 →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-line bg-cream-2">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-faint sm:flex-row">
          <Wordmark />
          <p>내가 다시 시작할 수 있는 일의 방향을 찾는 가장 작은 첫걸음.</p>
        </div>
      </footer>
    </main>
  );
}

function ResultCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: "clay" | "sage";
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <span
        className={`absolute right-6 top-6 h-2.5 w-2.5 rounded-full ${
          accent === "clay" ? "bg-clay" : "bg-sage"
        }`}
      />
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
