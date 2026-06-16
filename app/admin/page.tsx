"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUESTION_BY_KEY, optionLabel, QUESTIONS } from "@/lib/questions";
import type { DiagnosticSession } from "@/lib/types";

interface AdminData {
  summary: {
    total: number;
    completed: number;
    completionRate: number;
    avgCompletionSeconds: number;
    device: { mobile: number; desktop: number };
    eventCount: number;
  };
  directionCounts: Record<string, number>;
  dropOff: { key: string; index: number; answered: number }[];
  sessions: DiagnosticSession[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error)
    return (
      <Shell>
        <p className="text-ink-soft">데이터를 불러오지 못했어요.</p>
      </Shell>
    );
  if (!data)
    return (
      <Shell>
        <p className="text-ink-soft">불러오는 중…</p>
      </Shell>
    );

  const { summary } = data;
  const maxDrop = Math.max(1, ...data.dropOff.map((d) => d.answered));
  const dirEntries = Object.entries(data.directionCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const maxDir = Math.max(1, ...dirEntries.map(([, v]) => v));

  return (
    <Shell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            관리자 — 진단 세션
          </h1>
          <p className="text-sm text-ink-soft">
            MVP1 학습용 내부 뷰 · 응답/리포트/이탈 확인
          </p>
        </div>
        <Link href="/" className="text-sm text-clay underline">
          홈으로
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="전체 세션" value={summary.total} />
        <Stat label="완료" value={summary.completed} />
        <Stat label="완료율" value={`${summary.completionRate}%`} />
        <Stat
          label="평균 소요"
          value={`${Math.floor(summary.avgCompletionSeconds / 60)}분 ${
            summary.avgCompletionSeconds % 60
          }초`}
        />
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        기기: 모바일 {summary.device.mobile} · 데스크톱 {summary.device.desktop} ·
        이벤트 {summary.eventCount}건
      </p>

      {/* Direction distribution */}
      <Card title="추천 방향 분포">
        {dirEntries.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {dirEntries.map(([label, count]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-sm text-ink">
                  {label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-clay"
                    style={{ width: `${(count / maxDir) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm tabular-nums text-ink-soft">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Drop-off */}
      <Card title="질문별 도달 수 (이탈 지점)">
        <div className="space-y-1.5">
          {data.dropOff.map((d) => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-ink-faint">
                Q{d.index}
              </span>
              <span className="w-40 shrink-0 truncate text-xs text-ink-soft">
                {QUESTION_BY_KEY[d.key]?.prompt}
              </span>
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-sage"
                  style={{ width: `${(d.answered / maxDrop) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-ink-soft">
                {d.answered}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Sessions */}
      <Card title={`세션 목록 (${data.sessions.length})`}>
        {data.sessions.length === 0 ? (
          <Empty />
        ) : (
          <div className="divide-y divide-line">
            {data.sessions.map((s) => (
              <div key={s.id} className="py-3">
                <button
                  onClick={() => setOpenId(openId === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {s.name || "이름 없음"}{" "}
                      <span className="font-mono text-xs text-ink-faint">
                        {s.id.slice(0, 8)}
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      {new Date(s.startedAt).toLocaleString("ko-KR")} ·{" "}
                      {s.device ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "completed"
                          ? "bg-sage-tint text-sage"
                          : "bg-sand text-ink-soft"
                      }`}
                    >
                      {s.status === "completed" ? "완료" : "진행중"}
                    </span>
                    <span className="text-ink-faint">
                      {openId === s.id ? "▴" : "▾"}
                    </span>
                  </div>
                </button>

                {openId === s.id && (
                  <div className="mt-4 space-y-4 rounded-2xl bg-cream-2 p-4 text-sm">
                    {s.topRecommendedDirection && (
                      <p className="text-ink">
                        <b>1순위:</b> {s.topRecommendedDirection}
                        {s.completionTimeSeconds != null && (
                          <span className="text-ink-faint">
                            {" "}
                            · {s.completionTimeSeconds}초
                          </span>
                        )}
                      </p>
                    )}

                    <div>
                      <p className="mb-2 font-semibold text-ink-soft">답변</p>
                      <div className="space-y-1.5">
                        {QUESTIONS.map((q) => {
                          const v = s.answers[q.key];
                          if (v === undefined) return null;
                          const display =
                            q.type === "single" ? optionLabel(q.key, v) : v || "—";
                          return (
                            <div key={q.key} className="flex gap-2">
                              <span className="shrink-0 text-ink-faint">
                                {q.prompt}
                              </span>
                              <span className="text-ink">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {s.report && (
                      <details className="rounded-xl bg-surface p-3">
                        <summary className="cursor-pointer font-semibold text-ink-soft">
                          생성된 리포트 보기
                        </summary>
                        <div className="mt-3 space-y-2 text-ink">
                          <p>
                            <b>요약:</b> {s.report.summary}
                          </p>
                          <p>
                            <b>강점:</b>
                          </p>
                          <ul className="list-disc pl-5">
                            {s.report.strengths.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                          <p>
                            <b>오퍼 초안:</b> {s.report.offerDraft}
                          </p>
                          <p>
                            <b>첫 행동:</b> {s.report.firstAction}
                          </p>
                        </div>
                      </details>
                    )}

                    {s.notes && s.notes.length > 0 && (
                      <details className="rounded-xl bg-surface p-3">
                        <summary className="cursor-pointer font-semibold text-ink-soft">
                          My Next Chapter Note ({s.notes.length}개)
                        </summary>
                        <div className="mt-3 space-y-2 text-ink">
                          {s.notes.map((n) => (
                            <div
                              key={n.id}
                              className="rounded-lg bg-cream-2 p-2 text-xs"
                            >
                              <span className="text-ink-faint">{n.date}</span>
                              {n.moodTag && (
                                <span className="ml-2">[{n.moodTag}]</span>
                              )}
                              {n.todayAction && <p>· 행동: {n.todayAction}</p>}
                              {n.customerVoice && <p>· 고객말: {n.customerVoice}</p>}
                              {n.nextStep && <p>· 내일: {n.nextStep}</p>}
                              {n.reflection && (
                                <p className="mt-1 text-ink-soft">
                                  ↳ {n.reflection.feedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {s.recommendation && (
                      <details className="rounded-xl bg-surface p-3">
                        <summary className="cursor-pointer font-semibold text-ink-soft">
                          점수 내역 보기
                        </summary>
                        <div className="mt-3 space-y-1 font-mono text-xs text-ink-soft">
                          {s.recommendation.scores.map((sc) => (
                            <div key={sc.id} className="flex justify-between">
                              <span>{sc.label}</span>
                              <span>
                                {sc.total}점 (경험{sc.breakdown.experienceFit}/방식
                                {sc.breakdown.workStyleFit}/시간
                                {sc.breakdown.timeFit}/시작
                                {sc.breakdown.startEase}/고객
                                {sc.breakdown.customerAccess})
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center shadow-sm">
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
function Empty() {
  return <p className="text-sm text-ink-faint">아직 데이터가 없어요.</p>;
}
