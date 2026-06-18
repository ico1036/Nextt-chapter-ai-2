"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoMark, Wordmark } from "../components/Logo";
import { track, detectDevice } from "@/lib/track";
import { saveLocalSession } from "@/lib/session-client";
import { PERSONAS, TEST_TOOLS_ENABLED } from "@/lib/personas";
import { extractContextSignals, type ContextSignalPreview } from "@/lib/context-signals";

const reassurances = [
  { icon: "🌿", t: "시험이 아니에요", d: "정답을 맞히는 게 아니라, 가능성을 찾는 시간이에요." },
  { icon: "🤍", t: "편하게 답하면 돼요", d: "잘 모르겠는 질문은 가볍게 넘어가도 괜찮아요." },
  { icon: "⏳", t: "약 15분이면 충분해요", d: "끝나면, 당신만을 위한 한 페이지 결과를 드려요." },
];

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contextText, setContextText] = useState("");
  const [signalPreview, setSignalPreview] = useState<ContextSignalPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track("start_viewed");
  }, []);

  // Test helper: create a session, fill it with a sample persona, and
  // jump straight to the report — for quickly reviewing many results.
  async function runPersona(personaId: string) {
    if (loading) return;
    setLoading(true);
    try {
      const p = PERSONAS.find((x) => x.id === personaId)!;
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device: detectDevice(), name: p.name }),
      });
      const { sessionId } = await res.json();
      const c = await fetch("/api/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, name: p.name, answers: p.answers }),
      });
      const data = await c.json().catch(() => null);
      track("persona_quickrun", { persona: personaId }, sessionId);
      saveLocalSession(
        sessionId,
        p.name,
        data?.recommendation?.topDirection?.label,
      );
      router.push(`/result/${sessionId}`);
    } catch {
      setLoading(false);
      alert("예시를 불러오는 중 문제가 있었어요. 다시 시도해 주세요.");
    }
  }

  async function begin() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device: detectDevice(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      track("diagnostic_started", { hasName: Boolean(name.trim()) }, data.sessionId);
      const q = new URLSearchParams({ sid: data.sessionId });
      if (name.trim()) q.set("name", name.trim());
      router.push(`/diagnostic?${q.toString()}`);
    } catch {
      setLoading(false);
      alert("연결에 문제가 있었어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function runContextFirst() {
    if (loading) return;
    const input = contextText.trim();
    if (input.length < 40) {
      alert("기존 자료를 조금만 더 붙여넣어 주세요. 최소 2~3문장이 좋아요.");
      return;
    }
    setLoading(true);
    try {
      const extraction = extractContextSignals(input);
      setSignalPreview(extraction.preview);
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          device: detectDevice(),
          name: name.trim() || "자료 기반 진단",
        }),
      });
      const { sessionId } = await res.json();
      const c = await fetch("/api/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: name.trim() || "자료 기반 진단",
          answers: extraction.answers,
        }),
      });
      const data = await c.json().catch(() => null);
      track("context_first_completed", { signals: extraction.preview.assetSignals }, sessionId);
      saveLocalSession(
        sessionId,
        name.trim() || "자료 기반 진단",
        data?.recommendation?.topDirection?.label,
      );
      setContextText("");
      router.push(`/result/${sessionId}`);
    } catch {
      setLoading(false);
      alert("자료를 신호로 바꾸는 중 문제가 있었어요. 다시 시도해 주세요.");
    }
  }

  return (
    <main className="bg-warm-glow flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/">
          <Wordmark />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="animate-fade-up w-full max-w-lg rounded-[2rem] border border-line bg-surface p-8 shadow-soft sm:p-10">
          <LogoMark className="h-12 w-12 animate-breathe" />

          <h1 className="mt-6 font-display text-[1.7rem] font-bold leading-snug text-ink sm:text-[2rem]">
            잠깐 숨을 고르고,
            <br />
            천천히 시작해 볼까요?
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            지금부터 드리는 질문은 당신을 평가하기 위한 게 아니에요. 흩어져 있던
            경험을 모아, <b className="text-ink">다시 시작할 방향 하나</b>를
            함께 찾기 위한 거예요.
          </p>

          <ul className="mt-7 space-y-3">
            {reassurances.map((r) => (
              <li
                key={r.t}
                className="flex items-start gap-3 rounded-2xl bg-cream-2 px-4 py-3"
              >
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-ink">{r.t}</p>
                  <p className="text-sm text-ink-soft">{r.d}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-ink-soft"
            >
              어떻게 불러드릴까요?{" "}
              <span className="text-ink-faint">(선택)</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 지영"
              maxLength={20}
              className="w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-faint focus:border-clay focus:bg-surface"
              onKeyDown={(e) => {
                if (e.key === "Enter") begin();
              }}
            />
          </div>

          <button
            onClick={begin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-clay px-8 py-4 text-[1.05rem] font-semibold text-white shadow-soft transition hover:bg-clay-deep hover:shadow-lift active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "준비하고 있어요…" : "진단 시작하기 →"}
          </button>
          <p className="mt-3 text-center text-sm text-ink-faint">
            가입 없이 바로 시작해요.
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
            <span>🔒</span>
            당신이 적은 이야기는 방향을 찾는 데만 쓰여요. 회사에 파는 일은 없어요.
          </p>

          <div className="mt-7 rounded-2xl border border-sage/30 bg-sage-tint/40 p-4">
            <p className="text-sm font-semibold text-sage">
              기존 자료로 바로 보기
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              일기, 메모, 블로그 초안, 노션 글을 붙여넣으면 원문은 저장하지 않고
              방향성 신호만 추출해 결과를 만들어요.
            </p>
            <textarea
              value={contextText}
              onChange={(e) => {
                const next = e.target.value;
                setContextText(next);
                setSignalPreview(
                  next.trim().length >= 40 ? extractContextSignals(next).preview : null,
                );
              }}
              placeholder="예) 요즘 사람들이 AI를 어떻게 업무에 쓰는지 자주 물어봐요. 저는 마케팅 일을 했고, 챗GPT로 안내문이나 반복 업무를 줄이는 걸 도와준 적이 있어요..."
              className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-sage"
            />
            {signalPreview && (
              <div className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs text-ink-soft">
                <p className="font-semibold text-ink">추출될 신호</p>
                <p className="mt-1">{signalPreview.assetSignals.join(" · ")}</p>
                <p className="mt-1">{signalPreview.privacyNotice}</p>
              </div>
            )}
            <button
              onClick={runContextFirst}
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "신호를 추출하고 있어요…" : "원문 저장 없이 결과 보기 →"}
            </button>
          </div>

          {TEST_TOOLS_ENABLED && (
            <div className="mt-7 rounded-2xl border border-dashed border-clay/30 bg-clay-tint/30 p-4">
              <p className="text-sm font-semibold text-clay-deep">
                🧪 테스트용 빠른 체험
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                예시 페르소나를 누르면 진단을 자동으로 채우고 바로 결과 리포트로
                넘어가요.
              </p>
              <div className="mt-3 grid gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runPersona(p.id)}
                    disabled={loading}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:border-clay disabled:opacity-60"
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">
                        {p.name} · {p.type}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {p.summary}
                      </span>
                    </span>
                    <span className="ml-auto text-clay">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
