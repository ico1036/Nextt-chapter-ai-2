import test from "node:test";
import assert from "node:assert/strict";

import { runRecommendation } from "../lib/engine";
import { buildReport, reportToText } from "../lib/report";
import { buildCompass } from "../lib/compass-summary";
import { buildExpertLens } from "../lib/expert-lens";
import { buildTimeline } from "../lib/timeline";
import { deriveTodayAction } from "../lib/note";
import type { DailyNote, DiagnosticSession, QuestionResponseMap } from "../lib/types";

interface Scenario {
  id: string;
  label: string;
  promise: string;
  answers: QuestionResponseMap;
}

const scenarios: Scenario[] = [
  {
    id: "ai-solopreneur",
    label: "AI 업무화 1인 사업자",
    promise: "AI를 배웠지만 자기 일에 붙이지 못한 사람에게 실제 업무 흐름 하나를 만들어준다",
    answers: {
      current_thought: "connect_ai",
      current_state: "good_cant_offer",
      korea_experience: "마케팅과 운영 일을 하면서 반복 업무를 많이 자동화해봤어요.",
      us_experience: "미국의 작은 비즈니스 오너들이 AI를 궁금해하지만 어디서 시작할지 몰라요.",
      often_asked: "챗GPT나 AI를 내 업무에 어떻게 쓰는지 자주 물어봐요.",
      good_at_unpaid: "반복 업무를 보고 AI로 줄이는 흐름을 쉽게 잡아줘요.",
      work_style: "one_on_one",
      energy_giving: "상대가 바로 써보고 시간이 줄었다고 할 때 에너지가 나요.",
      dont_want: "툴 기능만 나열하는 강의는 하고 싶지 않아요.",
      time_available: "about_1h",
      format: "online",
      want_most: "test_small",
      direction_interest: "ai_help",
      biggest_blocker: "would_anyone_pay",
    },
  },
  {
    id: "kids-financial-class",
    label: "아이 금융교육 클래스",
    promise: "초등 자녀 부모에게 아이와 돈 이야기를 시작하는 1회 클래스를 제공한다",
    answers: {
      current_thought: "is_it_valuable",
      current_state: "vague_ideas",
      korea_experience: "금융권에서 일했고, 숫자와 돈 이야기를 쉽게 설명하는 편이에요.",
      us_experience: "동네 엄마들이 아이 용돈이나 경제 교육을 어떻게 해야 하냐고 물어요.",
      often_asked: "아이에게 돈 개념을 어떻게 알려주면 좋을지 자주 물어봐요.",
      good_at_unpaid: "복잡한 돈 이야기를 아이 눈높이에 맞춰 쉽게 풀어줘요.",
      work_style: "small_group",
      energy_giving: "아이들이 자기 말로 선택 이유를 설명할 때 에너지가 나요.",
      dont_want: "딱딱한 투자 강의처럼 보이는 건 싫어요.",
      time_available: "weekends",
      format: "offline",
      want_most: "test_small",
      direction_interest: "class",
      biggest_blocker: "would_anyone_pay",
    },
  },
  {
    id: "career-transition-coaching",
    label: "커리어 전환 코칭",
    promise: "커리어 전환을 고민하는 사람에게 강점과 다음 직무 방향을 정리해준다",
    answers: {
      current_thought: "dont_know",
      current_state: "vague_ideas",
      korea_experience: "여러 번 직무를 바꾸며 내 강점을 새 영역에 연결해본 경험이 있어요.",
      us_experience: "주변에서 미국에서 뭘 다시 시작해야 할지 모르겠다는 이야기를 많이 들어요.",
      often_asked: "내 경험으로 뭘 할 수 있을지 같이 봐달라는 말을 들어요.",
      good_at_unpaid: "상대의 경험을 듣고 패턴을 정리해서 다음 방향을 말해주는 걸 잘해요.",
      work_style: "one_on_one",
      energy_giving: "막막하던 사람이 자기 다음 선택지를 말로 잡을 때 에너지가 나요.",
      dont_want: "뻔한 이력서 첨삭만 하는 일은 싫어요.",
      time_available: "about_1h",
      format: "online",
      want_most: "find_direction",
      direction_interest: "consult",
      biggest_blocker: "cant_describe",
    },
  },
];

function makeSession(s: Scenario): DiagnosticSession {
  const recommendation = runRecommendation(s.answers);
  const report = buildReport(s.answers, recommendation);
  return {
    id: s.id,
    locale: "ko",
    status: "completed",
    startedAt: "2026-06-17T00:00:00.000Z",
    completedAt: "2026-06-17T00:08:00.000Z",
    answers: s.answers,
    recommendation,
    report,
    predictedUserType: recommendation.primaryUserType,
    topRecommendedDirection: recommendation.topDirection.id,
  };
}

function makeNotes(sessionId: string): DailyNote[] {
  return [
    {
      id: `${sessionId}-n1`,
      sessionId,
      createdAt: "2026-06-18T09:00:00.000Z",
      date: "2026-06-18",
      todayAction: "타깃 후보 한 명에게 가장 막히는 점을 물었다",
      moodTag: "hopeful",
      customerVoice: "관심은 있는데 내 상황에 어떻게 적용할지 모르겠다고 했다",
      insight: "사람들은 큰 강의보다 자기 상황에 맞춘 첫 행동을 원한다",
      nextStep: "같은 고민을 가진 사람 2명에게 같은 질문을 보내기",
    },
  ];
}

for (const scenario of scenarios) {
  test(`integration flow: ${scenario.label} reaches identity → offer → validation loop`, () => {
    const session = makeSession(scenario);
    const notes = makeNotes(session.id);
    const report = session.report!;
    const compass = buildCompass(session, notes);
    const lens = buildExpertLens(session, notes);
    const timeline = buildTimeline(session, notes);
    const today = deriveTodayAction(report.firstAction, notes);
    const text = reportToText(report, scenario.label);

    assert.match(text, /지금의 당신/);
    assert.match(text, /첫 오퍼 초안/);
    assert.match(text, /시장 체크/);
    assert.match(text, /이번 주 첫 행동/);
    assert.ok(report.offerDraft.length > 30, "offer should be concrete enough to show to someone");
    assert.ok(report.marketCheck, "offer should be paired with a market validation layer");
    assert.ok(report.marketCheck.validationQuestion.includes("?") || report.marketCheck.validationQuestion.includes("까요"));
    assert.ok(report.marketCheck.firstExperiment.includes("3명"));
    assert.ok(report.marketCheck.sources.some((s) => s.kind === "public_search" && s.url));
    assert.ok(report.customerChannels.length >= 2, "user needs places to find first customers");
    assert.ok(today.source === "yesterday", "after note creation, next action should continue from yesterday");

    assert.ok(compass.oneLine.length > 20);
    assert.ok(compass.clarity >= 50);
    assert.ok(compass.offerConfidence >= 0.4, "with scenario + note evidence, offer should be at least explorable");
    assert.ok(["explore", "recommend"].includes(compass.offerReadiness));

    assert.ok(lens.action.length > 10);
    assert.ok(lens.outreachDraft.includes("30분"));
    assert.ok(timeline.some((e) => e.type === "customer_voice_captured"));

    assert.doesNotMatch(
      `${report.offerDraft}\n${report.marketCheck?.coaching}\n${compass.oneLine}\n${lens.perspective}`,
      /무조건|반드시 성공|확실히 팔|보장/,
      "integration copy must not overclaim success",
    );
  });
}
