import test from "node:test";
import assert from "node:assert/strict";

import { PERSONA_BY_ID, PERSONAS } from "../lib/personas.ts";
import { classifyAssets, classifyUserTypes, runRecommendation } from "../lib/engine.ts";
import { buildReport, reportToText } from "../lib/report.ts";
import { buildMarketCheck } from "../lib/market-check.ts";
import { buildCompass, buildRoadmap, todaysPick } from "../lib/compass-summary.ts";
import { buildExpertLens } from "../lib/expert-lens.ts";
import { computeMomentum, momentumCopy } from "../lib/momentum.ts";
import { computeProgress } from "../lib/progress.ts";
import { buildTimeline } from "../lib/timeline.ts";
import { deriveTodayAction, microActionAt } from "../lib/note.ts";
import { extractContextSignals } from "../lib/context-signals.ts";
import type { DailyNote, DiagnosticSession, QuestionResponseMap } from "../lib/types.ts";

function completedSession(id: string, answers: QuestionResponseMap): DiagnosticSession {
  const recommendation = runRecommendation(answers);
  const report = buildReport(answers, recommendation);
  return {
    id,
    locale: "ko",
    status: "completed",
    startedAt: "2026-06-17T00:00:00.000Z",
    completedAt: "2026-06-17T00:05:00.000Z",
    answers,
    recommendation,
    report,
    predictedUserType: recommendation.primaryUserType,
    topRecommendedDirection: recommendation.topDirection.id,
  };
}

function note(
  id: string,
  date: string,
  fields: Partial<DailyNote> = {},
): DailyNote {
  return {
    id,
    sessionId: "s-contract",
    date,
    createdAt: `${date}T10:00:00.000Z`,
    todayAction: "지인 한 명에게 오퍼 문장을 보여주었다",
    moodTag: "hopeful",
    customerVoice: "AI를 배웠지만 내 일에 어떻게 붙일지 모르겠다고 했다",
    insight: "사람들은 도구보다 자기 상황에 맞는 첫 행동을 원한다",
    nextStep: "반복 업무 하나를 물어보기",
    ...fields,
  };
}

function assertNonEmpty(label: string, value: string | undefined) {
  assert.ok(value?.trim(), `${label} should be non-empty`);
}

test("product contract: every sample persona completes the core journey from answers to offer to first action", () => {
  assert.ok(PERSONAS.length >= 5, "sample personas should cover diverse demo users");

  for (const persona of PERSONAS) {
    const rec = runRecommendation(persona.answers);
    const report = buildReport(persona.answers, rec);

    assert.equal(rec.scores.length, 8, `${persona.id}: all candidate directions are scored`);
    assert.equal(rec.candidateDirections.length, 3, `${persona.id}: exactly top 3 directions are shown`);
    assert.ok(rec.topDirection.total >= rec.candidateDirections[1].total, `${persona.id}: top direction is highest ranked`);

    assertNonEmpty(`${persona.id}: summary`, report.summary);
    assert.ok(report.summary.includes("지금 당신"), `${persona.id}: report starts by mirroring the user, not selling a feature`);
    assert.ok(report.strengths.length >= 3, `${persona.id}: report must give at least three grounded strengths`);
    assert.equal(report.directions.length, 3, `${persona.id}: report must preserve three possible directions`);
    assertNonEmpty(`${persona.id}: top recommendation label`, report.topRecommendation.label);
    assert.ok(report.topRecommendation.reasons.length >= 1, `${persona.id}: top recommendation needs reasons`);
    assertNonEmpty(`${persona.id}: offer draft`, report.offerDraft);
    assert.ok(report.marketCheck, `${persona.id}: market check should exist below the offer`);
    assert.ok(report.marketCheck.score >= 20 && report.marketCheck.score <= 88, `${persona.id}: market score stays bounded`);
    assert.ok(report.marketCheck.demandSignals.length >= 1, `${persona.id}: demand signals should exist`);
    assert.ok(report.marketCheck.riskSignals.length >= 1, `${persona.id}: risk signals should exist`);
    assertNonEmpty(`${persona.id}: validation question`, report.marketCheck.validationQuestion);
    assertNonEmpty(`${persona.id}: first experiment`, report.marketCheck.firstExperiment);
    assert.ok(
      report.marketCheck.sources.some((s) => s.kind === "public_search" && s.url?.startsWith("https://www.google.com/search?")),
      `${persona.id}: market check needs one real public source path`,
    );
    assertNonEmpty(`${persona.id}: first action`, report.firstAction);
    assert.ok(report.customerChannels.length >= 2, `${persona.id}: first customer channels must be concrete`);
    assert.ok(report.whatToLearn?.length, `${persona.id}: next learning suggestions should exist`);
    assert.ok(report.peopleToReach?.length, `${persona.id}: people-to-reach suggestions should exist`);
    assert.ok(report.toolsToTry?.length, `${persona.id}: tools-to-try suggestions should exist`);
  }
});

test("classification contract: user assets and types come from actual context signals, not arbitrary defaults", () => {
  const ai = PERSONA_BY_ID.ai_curious.answers;
  assert.ok(classifyAssets(ai).includes("ai"));
  assert.ok(classifyUserTypes(ai, classifyAssets(ai)).includes("ai_curious"));

  const connector = PERSONA_BY_ID.community_connector.answers;
  assert.ok(classifyAssets(connector).includes("community"));
  assert.ok(classifyUserTypes(connector, classifyAssets(connector)).includes("community_connector"));

  const expert = PERSONA_BY_ID.expert.answers;
  assert.ok(classifyAssets(expert).includes("professional"));
  assert.ok(classifyUserTypes(expert, classifyAssets(expert)).includes("expert"));

  const sparse: QuestionResponseMap = { current_thought: "dont_know", current_state: "no_idea" };
  assert.deepEqual(classifyAssets(sparse), ["life"], "life experience is the baseline but not a fake expertise claim");
  assert.ok(classifyUserTypes(sparse, classifyAssets(sparse)).includes("career_reboot"));
});

test("report contract: copy must remain coaching-first and action-oriented", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const report = session.report!;
  const text = reportToText(report, "보라");

  assert.match(text, /지금의 당신/);
  assert.match(text, /당신의 강점/);
  assert.match(text, /첫 오퍼 초안/);
  assert.match(text, /시장 체크/);
  assert.match(text, /이번 주 첫 행동/);
  assert.doesNotMatch(text, /반드시 성공|무조건|확실히 팔/,
    "product should not make deterministic market/success claims");
  assert.ok(report.firstAction.includes("이번 주"), "first action should be immediately testable, not a vague plan");
});

test("market check contract: validation layer is source-aware and avoids success guarantees", () => {
  for (const persona of PERSONAS.slice(0, 3)) {
    const rec = runRecommendation(persona.answers);
    const market = buildMarketCheck(persona.answers, rec);
    const copy = [
      market.coaching,
      market.validationQuestion,
      market.firstExperiment,
      ...market.demandSignals,
      ...market.riskSignals,
    ].join("\n");

    assert.ok(["ready_to_test", "needs_narrowing", "needs_evidence"].includes(market.verdict));
    assert.ok(market.sources.some((s) => s.kind === "mock"));
    assert.ok(market.sources.some((s) => s.kind === "public_search" && s.url));
    assert.doesNotMatch(copy, /반드시 성공|무조건|확실히 팔|보장|성공 확률/);
  }
});

test("context-first input contract: pasted raw text becomes generic signals, not stored excerpts", () => {
  const raw =
    "요즘 주변 엄마들이 챗GPT와 캔바를 어떻게 써야 하는지 자주 물어봐요. 저는 마케팅 일을 했고 AI로 안내문과 반복 업무를 줄이는 걸 도와준 적이 있어요. 다만 이걸 유료로 팔 수 있을지는 아직 모르겠어요.";
  const extraction = extractContextSignals(raw);
  const stored = Object.values(extraction.answers).join("\n");

  assert.ok(extraction.preview.assetSignals.includes("AI·디지털 연결 신호"));
  assert.equal(extraction.answers.current_thought, "connect_ai");
  assert.equal(extraction.answers.biggest_blocker, "would_anyone_pay");
  assert.doesNotMatch(stored, /주변 엄마들이 챗GPT와 캔바를 어떻게 써야 하는지/);
  assert.match(extraction.preview.privacyNotice, /원문은 서버에 저장하지 않고/);

  const rec = runRecommendation(extraction.answers);
  const report = buildReport(extraction.answers, rec);
  assertNonEmpty("context-first offer draft", report.offerDraft);
  assert.ok(report.marketCheck?.validationQuestion);
});

test("compass contract: enough context yields direction, confidence, offer readiness, and next questions without overwriting the report", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const notes = [note("n1", "2026-06-17")];
  const compass = buildCompass(session, notes);

  assertNonEmpty("compass one line", compass.oneLine);
  assert.ok(compass.confidence > 0.5, "context-rich user should have meaningful H confidence");
  assert.ok(compass.alignment >= 0 && compass.alignment <= 1);
  assert.ok(compass.clarity > 50);
  assert.ok(["explore", "recommend"].includes(compass.offerReadiness));
  assert.ok(compass.coreValues.length >= 1);
  assert.equal(compass.direction, session.report?.topRecommendation.label, "compass should extend, not replace, the existing recommendation");
});

test("compass contract: sparse context must ask before recommending too strongly", () => {
  const session = completedSession("s-sparse", { current_state: "no_idea" });
  const compass = buildCompass(session, []);

  assert.equal(compass.offerReadiness, "not_ready");
  assert.ok(compass.confidence < 0.55);
  assert.ok(compass.adaptiveQuestions.length >= 1);
  assert.match(compass.oneLine, /부족|방향|질문|사람/);
});

test("daily note contract: yesterday's next step continues the coaching loop", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const notes = [note("n1", "2026-06-17", { nextStep: "1인 사업자 한 명에게 반복 업무를 물어보기" })];

  assert.deepEqual(deriveTodayAction(session.report?.firstAction, []), {
    action: session.report!.firstAction,
    source: "report",
  });
  assert.deepEqual(deriveTodayAction(session.report?.firstAction, notes), {
    action: "1인 사업자 한 명에게 반복 업무를 물어보기",
    source: "yesterday",
  });
  assertNonEmpty("fallback micro action", microActionAt(100));
});

test("momentum contract: the product rewards returning without guilt", () => {
  const now = new Date("2026-06-18T12:00:00.000Z");
  const notes = [
    note("n1", "2026-06-10"),
    note("n2", "2026-06-14"),
    note("n3", "2026-06-17", { reflection: { feedback: "좋아요", nextAction: "더 작게" } }),
  ];
  const m = computeMomentum(notes, now);
  const copy = momentumCopy(m);

  assert.equal(m.returnCount, 2, "two returns after gaps should be counted as momentum");
  assert.equal(m.streakOngoing, true);
  assert.equal(m.currentStreak, 1);
  assert.match(copy.headline + copy.subcopy, /돌아|흐름|움직임/);
  assert.doesNotMatch(copy.headline + copy.subcopy, /실패|끊겼|망했|게으/,
    "momentum copy must stay no-guilt");
});

test("progress contract: customer voice and insight increase clarity and XP as meaningful evidence", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const empty = computeProgress(session, []);
  const weak = computeProgress(session, [note("n1", "2026-06-17", { customerVoice: "", insight: "" })]);
  const strong = computeProgress(session, [note("n1", "2026-06-17")]);

  assert.ok(weak.clarity > empty.clarity, "any small record should increase clarity");
  assert.ok(strong.clarity > weak.clarity, "real customer voice/insight should increase clarity more than attendance");
  assert.ok(strong.xp > weak.xp);
  assert.ok(strong.clarityGains.some((x) => x.includes("고객")));
});

test("timeline contract: story shows diagnosis, direction, action, customer voice, and returns", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const notes = [
    note("n1", "2026-06-10", { customerVoice: "" }),
    note("n2", "2026-06-13"),
    note("n3", "2026-06-14"),
  ];
  const events = buildTimeline(session, notes);
  const types = events.map((e) => e.type);

  assert.ok(types.includes("diagnostic_completed"));
  assert.ok(types.includes("direction_selected"));
  assert.ok(types.includes("first_action_chosen"));
  assert.ok(types.includes("customer_voice_captured"));
  assert.ok(types.includes("returned_after_gap"));
  assert.ok(types.includes("weekly_ready"));
});

test("expert lens contract: blocker-specific lens gives honest search hints, small action, and no fabricated links", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const lens = buildExpertLens(session, [note("n1", "2026-06-17", { moodTag: "tired" })]);

  assert.match(lens.blocker, /돈|누가/);
  assert.ok(lens.searchHints.length >= 2);
  assert.ok(lens.searchHints.every((h) => !h.startsWith("http")), "v0 should provide search hints, not hallucinated URLs");
  assert.match(lens.action, /오늘|지인|떠올려|제안/);
  assert.match(lens.outreachDraft, /30분/);
});

test("roadmap and daily pick contract: next suggestions stay concrete and rotate through existing report assets", () => {
  const session = completedSession("s-ai", PERSONA_BY_ID.ai_curious.answers);
  const roadmap = buildRoadmap(session.recommendation?.topDirection.id);
  const pick1 = todaysPick(session.report, new Date("2026-06-17T00:00:00.000Z"));
  const pick2 = todaysPick(session.report, new Date("2026-06-18T00:00:00.000Z"));

  assert.ok(roadmap.shortTerm.length >= 2);
  assert.ok(roadmap.midTerm.length >= 2);
  assert.ok(pick1);
  assert.ok(pick2);
  assert.notEqual(pick1?.text, "");
  assert.notEqual(pick2?.text, "");
});
