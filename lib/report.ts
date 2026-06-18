// ─────────────────────────────────────────────────────────────
// Deterministic Korean report generation. Warm, practical, specific.
// Weaves the user's own words back in so the result feels personal.
// (Optional AI rewrite layer lives in lib/ai.ts and wraps this output.)
// ─────────────────────────────────────────────────────────────

import { DIRECTION_BY_ID } from "./directions";
import { ASSET_LABEL } from "./engine";
import { buildMarketCheck } from "./market-check";
import { optionLabel } from "./questions";
import type {
  QuestionResponseMap,
  RecommendationOutput,
  ReportSection,
} from "./types";

function clean(s?: string): string {
  return (s ?? "").trim();
}

function firstClause(s: string, max = 40): string {
  const t = clean(s).replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

// ── 1. Situation summary ─────────────────────────────────────
function buildSummary(a: QuestionResponseMap): string {
  const thought = a.current_thought;
  const state = a.current_state;
  const want = a.want_most;

  const thoughtLine: Record<string, string> = {
    earn_again: "다시 내 힘으로 수입을 만들고 싶은 마음",
    dont_know: "내가 무엇을 할 수 있을지 아직 또렷하지 않은 마음",
    is_it_valuable: "내 경험이 정말 가치가 있는지 확인하고 싶은 마음",
    connect_ai: "배운 AI를 내 일과 연결해보고 싶은 마음",
    alongside_family: "가정을 지키면서 할 수 있는 일을 찾는 마음",
  };
  const wantLine: Record<string, string> = {
    quick_small: "작더라도 곧 손에 잡히는 결과",
    find_direction: "흔들리지 않을 하나의 방향",
    grow_my_work: "내 일로 키워갈 수 있는 씨앗",
    test_small: "부담 없이 가볍게 시작해볼 작은 시도",
  };

  const t = thoughtLine[thought] ?? "다시 시작해보고 싶은 마음";
  const w = wantLine[want] ?? "작게 시작할 수 있는 방향";

  const stalled =
    state === "no_idea" || state === "vague_ideas"
      ? "아직 방향이 또렷하지 않을 뿐, 가능성이 없는 게 아니에요. "
      : "이미 가진 것을 어떻게 ‘일의 언어’로 바꿀지가 지금의 과제예요. ";

  return `지금 당신은 ${t} 안에 있어요. ${stalled}당신에게 지금 필요한 건 거창한 계획이 아니라, ${w}이에요.`;
}

// ── 2. Strengths ─────────────────────────────────────────────
function buildStrengths(
  a: QuestionResponseMap,
  rec: RecommendationOutput,
): string[] {
  const out: string[] = [];

  const often = clean(a.often_asked);
  const goodAt = clean(a.good_at_unpaid);
  const energy = clean(a.energy_giving);
  const korea = clean(a.korea_experience);
  const us = clean(a.us_experience);

  if (often)
    out.push(
      `사람들이 당신에게 “${firstClause(often)}”을(를) 자주 부탁한다는 건, 이미 그 분야에서 신뢰를 얻고 있다는 뜻이에요.`,
    );
  if (goodAt)
    out.push(
      `돈을 받지 않고도 “${firstClause(goodAt)}”을(를) 잘 해낸다는 건, 애써 만들지 않아도 자연스럽게 나오는 진짜 강점이에요.`,
    );
  if (energy)
    out.push(
      `“${firstClause(energy)}” 같은 순간에 에너지가 차오른다는 건, 그 일을 오래 지속할 수 있는 사람이라는 신호예요.`,
    );

  // Asset-based strengths to ensure 3–4 even if text is sparse.
  const assetStrength: Record<string, string> = {
    professional: `${korea || us ? `“${firstClause(korea || us)}” 같은 ` : ""}전문성과 실무 경험이 있어요. 이건 바로 누군가에게 도움이 되는 자산이에요.`,
    life: "삶으로 직접 겪어낸 경험이 있어요. 같은 길을 걷는 사람에게는 어떤 자격증보다 믿음직한 안내가 돼요.",
    ai: "새로운 도구(AI)에 대한 호기심과 적응력이 있어요. 많은 사람들이 어려워하는 걸 이미 한 걸음 앞서 있어요.",
    community: "사람을 모으고 연결하는 힘이 있어요. 이건 돈으로 사기 어려운 ‘관계 자산’이에요.",
  };
  for (const asset of rec.assetTypes) {
    if (out.length >= 4) break;
    if (assetStrength[asset]) out.push(assetStrength[asset]);
  }

  // Guarantee at least 3.
  if (out.length < 3) {
    out.push(
      "막막함 속에서도 ‘다시 해보자’고 마음먹은 것 자체가 강점이에요. 대부분은 그 한 걸음을 내딛지 못해요.",
    );
  }
  return out.slice(0, 4);
}

// ── 3 & 4. Directions + reasons ──────────────────────────────
const REASON_LABEL: Record<string, string> = {
  experienceFit: "당신의 경험과 잘 맞아요",
  workStyleFit: "당신이 편해하는 일하는 방식과 맞아요",
  timeFit: "지금 쓸 수 있는 시간 안에서 가능해요",
  startEase: "준비물 없이 바로 시작할 수 있어요",
  customerAccess: "첫 손님을 비교적 쉽게 만날 수 있어요",
};

function topReasons(
  rec: RecommendationOutput,
  max = 3,
): string[] {
  const b = rec.topDirection.breakdown;
  return Object.entries(b)
    .sort((x, y) => y[1] - x[1])
    .filter(([, v]) => v >= 1)
    .slice(0, max)
    .map(([k]) => REASON_LABEL[k]);
}

// ── 5. Offer drafts per direction ────────────────────────────
function offerDraft(
  directionId: string,
  a: QuestionResponseMap,
): string {
  const goodAt = clean(a.good_at_unpaid) || clean(a.often_asked) || "내가 잘하는 것";
  const topic = firstClause(goodAt, 24);

  const drafts: Record<string, string> = {
    one_on_one_guide: `“${topic}이 필요한 분, 딱 한 분을 한 달 동안 곁에서 도와드려요. 거창한 코스가 아니라, 당신의 상황에 맞춰 하나씩 같이 정리해드립니다. 첫 회는 부담 없는 30분 대화로 시작해요.”`,
    one_on_one_consulting: `“${topic}에 대해 고민 중이신가요? 제 경험을 바탕으로 1:1로 30분, 당신의 상황에 맞는 현실적인 다음 한 걸음을 같이 찾아드려요.”`,
    small_class: `“${topic}, 처음이라 막막한 4~5명을 위한 2주 작은 클래스를 열어요. 어려운 이론 말고, 바로 따라 할 수 있는 것만 다뤄요.”`,
    digital_guide: `“${topic}을(를) 한 장씩 따라만 하면 되도록 정리한 가이드를 만들었어요. 같은 고민을 했던 제가, 헤매지 않도록 길을 정리해드립니다.”`,
    ai_beginner_help: `“AI가 어렵게 느껴지는 분, 옆에서 같이 켜고 같이 눌러드려요. ‘${topic}’부터, 당신 일에 바로 쓸 수 있게 1:1로 도와드립니다.”`,
    community_program: `“같은 고민을 가진 분들끼리 작게 모여요. 혼자였다면 막막했을 일을, 함께라서 한 걸음 떼어보는 모임이에요. 첫 모임은 가볍게 차 한잔처럼.”`,
    local_life_guide: `“미국 정착, 저도 헤매봤어요. ‘${topic}’이 막막한 새로 오신 분께, 제가 먼저 겪은 길을 1:1로 안내해드려요.”`,
    experience_support: `“같은 시간을 먼저 지나온 사람으로서, ‘${topic}’으로 흔들리는 분의 이야기를 들어드리고 다음 방향을 같이 잡아드려요.”`,
  };
  return drafts[directionId] ?? drafts.one_on_one_guide;
}

// ── 6. Customer channels per direction ───────────────────────
function customerChannels(
  directionId: string,
  a: QuestionResponseMap,
): string[] {
  const fmt = a.format ?? "both";
  const base: Record<string, string[]> = {
    one_on_one_guide: [
      "이미 당신에게 도움을 청했던 그 사람들 — 가장 가까운 첫 손님이에요",
      "당신이 활동하는 카카오톡 단톡방·맘카페에 짧은 안내 글 하나",
    ],
    one_on_one_consulting: [
      "예전 동료·지인 중 비슷한 고민을 하던 사람",
      "관련 주제의 한인 커뮤니티(맘카페, 페이스북 그룹)",
    ],
    small_class: [
      "동네 한인 성당·교회·도서관 게시판",
      "맘카페 ‘소모임/클래스’ 게시판",
    ],
    digital_guide: [
      "관련 키워드의 네이버 카페·블로그",
      "같은 고민 글이 올라오는 커뮤니티의 댓글 속 사람들",
    ],
    ai_beginner_help: [
      "‘AI 배우고 싶은데 어렵다’고 말하던 주변 사람",
      "시니어·초보 대상 한인 커뮤니티",
    ],
    community_program: [
      "이미 알고 지내는 비슷한 처지의 엄마 3~4명",
      "동네 모임·교회 소그룹",
    ],
    local_life_guide: [
      "최근에 미국으로 막 온 지인·그 지인의 지인",
      "지역 한인 신규 정착 그룹(페이스북·단톡방)",
    ],
    experience_support: [
      "당신이 지나온 그 시기를 지금 겪고 있는 사람",
      "관련 주제의 온라인 커뮤니티",
    ],
  };
  const list = base[directionId] ?? base.one_on_one_guide;
  if (fmt === "offline")
    return [list[0], "동네 한인 오프라인 모임·교회·문화센터 게시판"];
  return list;
}

// ── 7. First action per direction ────────────────────────────
function firstAction(directionId: string): string {
  const actions: Record<string, string> = {
    one_on_one_guide:
      "이번 주에 ‘이런 걸 도와줄 수 있어요’라는 3~4문장 안내를 써서, 가장 편한 한 사람에게 보내보세요. 모집이 아니라 ‘의견 듣기’로요.",
    one_on_one_consulting:
      "이번 주에 당신이 도울 수 있는 고민 한 가지를 정해, 그 고민을 가진 지인 한 명에게 ‘30분만 무료로 이야기 들어줄게’라고 제안해보세요.",
    small_class:
      "이번 주에 클래스에서 다룰 내용을 딱 3가지로 적어보세요. 그리고 ‘이런 거 작게 열면 올 사람?’이라고 단톡방에 가볍게 물어보세요.",
    digital_guide:
      "이번 주에 당신이 자주 받는 질문 1개에 대한 답을 한 페이지로 정리해보세요. 그게 가이드의 첫 장이에요.",
    ai_beginner_help:
      "이번 주에 AI를 어려워하는 지인 한 명에게 ‘같이 한 번 해볼래요?’ 하고 30분만 옆에서 도와주세요. 거기서 진짜 필요한 게 보여요.",
    community_program:
      "이번 주에 비슷한 고민을 가진 사람 3명에게 ‘우리 한번 모여서 이야기해볼래요?’라고 메시지를 보내보세요.",
    local_life_guide:
      "이번 주에 최근 미국에 온 지인 한 명에게 ‘정착하면서 제일 막막한 게 뭐예요?’라고 물어보세요. 거기에 당신의 서비스가 있어요.",
    experience_support:
      "이번 주에 당신이 지나온 시기를 겪는 한 사람에게 ‘그때 저도 그랬어요’라고 먼저 말을 건네보세요. 대화가 곧 시작이에요.",
  };
  return actions[directionId] ?? actions.one_on_one_guide;
}

// ── 8. Closing line ──────────────────────────────────────────
function buildClosing(a: QuestionResponseMap): string {
  const blocker = a.biggest_blocker;
  const lines: Record<string, string> = {
    not_good_enough:
      "충분히 잘하는지는 시작한 뒤에 알게 돼요. 지금의 당신만으로 첫 한 사람에게는 충분합니다.",
    would_anyone_pay:
      "큰 시장이 아니라, 당신을 필요로 하는 ‘한 사람’이면 충분해요. 그 한 사람부터 만나보세요.",
    no_time:
      "거창하게 할 필요 없어요. 하루 30분, 한 사람이면 시작이에요. 작게 시작한 게 가장 멀리 가요.",
    cant_describe:
      "완벽한 설명은 손님을 만나면서 다듬어져요. 지금은 어설퍼도 한 번 말해보는 게 먼저예요.",
    need_more_ready:
      "준비가 끝나는 날은 오지 않아요. 작게 시작하면, 시작이 당신을 준비시켜요.",
  };
  return (
    lines[blocker] ??
    "거창하게 시작하지 않아도 돼요. 가장 작은 한 걸음이, 가장 확실한 시작이에요."
  );
}

// ── "다음으로 해볼 것들" — 공부 · 사람 · 도구 ────────────────
function whatToLearn(directionId: string, a: QuestionResponseMap): string[] {
  const map: Record<string, string[]> = {
    one_on_one_guide: [
      "사람들이 반복해서 묻는 고민 1가지를 정해, 그걸 푸는 가장 쉬운 설명을 공부해보세요.",
    ],
    one_on_one_consulting: [
      "당신이 조언해줄 주제 1가지의 ‘자주 묻는 질문 5개’를 정리해보세요.",
      "상담을 구조화하는 간단한 프레임(상황 → 고민 → 다음 한 걸음)을 익혀보세요.",
    ],
    small_class: [
      "가르칠 내용을 ‘딱 3가지 핵심’으로 줄이는 법을 연습해보세요.",
      "작은 온라인 클래스를 여는 가장 쉬운 방법(줌 + 신청 폼)을 알아보세요.",
    ],
    digital_guide: [
      "당신이 자주 받는 질문을 ‘한 장 가이드’로 정리하는 법을 익혀보세요.",
    ],
    ai_beginner_help: [
      "ChatGPT로 ‘초보자가 가장 자주 막히는 3가지’를 직접 해결해보세요.",
      "당신 일에 바로 쓸 AI 활용 1가지(글쓰기·정리·이미지)를 깊게 익혀보세요.",
    ],
    community_program: [
      "작은 모임을 운영하는 기본(주제·주기·인원)을 가볍게 공부해보세요.",
    ],
    local_life_guide: [
      "새로 온 사람들이 가장 막히는 정착 절차 1가지를 단계별로 정리해보세요.",
    ],
    experience_support: [
      "당신이 지나온 경험을 ‘남에게 도움 되는 한 가지 조언’으로 정리해보세요.",
    ],
  };
  const out = [...(map[directionId] ?? map.one_on_one_guide)];
  // AI를 연결하고 싶은 사람이면 AI 학습을 한 줄 더.
  if (a.current_thought === "connect_ai" && directionId !== "ai_beginner_help") {
    out.push("당신 방향에 AI를 한 가지만 붙여보세요. 예: ChatGPT로 초안 만들기.");
  }
  return out.slice(0, 2);
}

function peopleToReach(directionId: string, a: QuestionResponseMap): string[] {
  const out = [
    "비슷한 일을 먼저 해본 사람 1명에게 ‘어떻게 시작하셨어요?’ 하고 커피챗을 청해보세요.",
    "관련 커뮤니티·단체 1곳을 찾아 가볍게 들어가 보세요.",
  ];
  if (directionId === "community_program" || directionId === "local_life_guide") {
    out[1] = "이미 비슷한 모임을 운영하는 사람에게 운영 노하우를 물어보세요.";
  }
  if (a.format === "online" || a.format === "both") {
    out.push(
      "관심 분야의 사람에게 링크드인으로 짧은 콜드 메시지를 보내보세요. (답이 안 와도 괜찮아요)",
    );
  }
  return out.slice(0, 2);
}

function toolsToTry(directionId: string): string[] {
  const map: Record<string, string[]> = {
    one_on_one_guide: ["일정 잡기 — Calendly(무료)", "메모·정리 — Notion"],
    one_on_one_consulting: ["화상 상담 — Zoom / Google Meet", "정리·공유 — Notion"],
    small_class: ["수업 — Zoom", "신청·결제 — Google Forms + 간편결제(토스·페이팔)"],
    digital_guide: ["문서·가이드 — Notion / Google Docs", "보기 좋게 — Canva"],
    ai_beginner_help: ["ChatGPT(함께 실습)", "결과 보여주기 — Canva·이미지 생성"],
    community_program: ["모임 공지 — 카카오톡 오픈채팅", "참여·일정 — Google Forms"],
    local_life_guide: ["정보 정리 — Notion 체크리스트", "안내 자료 — Canva"],
    experience_support: ["대화 — Zoom / 전화", "기록·정리 — Notion"],
  };
  return map[directionId] ?? map.one_on_one_guide;
}

// ── Assemble ─────────────────────────────────────────────────
export function buildReport(
  a: QuestionResponseMap,
  rec: RecommendationOutput,
): ReportSection {
  const directions = rec.candidateDirections.map((s) => {
    const d = DIRECTION_BY_ID[s.id];
    return { label: d.label, why: d.blurb };
  });

  const topId = rec.topDirection.id;

  return {
    summary: buildSummary(a),
    strengths: buildStrengths(a, rec),
    directions,
    topRecommendation: {
      label: DIRECTION_BY_ID[topId].label,
      reasons: topReasons(rec),
    },
    offerDraft: offerDraft(topId, a),
    marketCheck: buildMarketCheck(a, rec),
    customerChannels: customerChannels(topId, a),
    firstAction: firstAction(topId),
    closing: buildClosing(a),
    whatToLearn: whatToLearn(topId, a),
    peopleToReach: peopleToReach(topId, a),
    toolsToTry: toolsToTry(topId),
  };
}

// Plain-text version for copy/share + admin.
export function reportToText(
  report: ReportSection,
  name?: string,
): string {
  const L: string[] = [];
  L.push(`My Next Chapter AI — ${name ? name + "님의 " : ""}진단 결과`);
  L.push("");
  L.push("■ 지금의 당신");
  L.push(report.summary);
  L.push("");
  L.push("■ 당신의 강점");
  report.strengths.forEach((s, i) => L.push(`${i + 1}. ${s}`));
  L.push("");
  L.push("■ 당신에게 맞는 일의 방향 3가지");
  report.directions.forEach((d, i) => L.push(`${i + 1}. ${d.label} — ${d.why}`));
  L.push("");
  L.push(`■ 가장 잘 맞는 1순위 방향: ${report.topRecommendation.label}`);
  report.topRecommendation.reasons.forEach((r) => L.push(`· ${r}`));
  L.push("");
  L.push("■ 첫 오퍼 초안");
  L.push(report.offerDraft);
  if (report.marketCheck) {
    L.push("");
    L.push("■ 시장 체크");
    L.push(`검증 점수: ${report.marketCheck.score}/100`);
    L.push(report.marketCheck.coaching);
    report.marketCheck.demandSignals.forEach((x) => L.push(`· 수요 신호: ${x}`));
    report.marketCheck.riskSignals.forEach((x) => L.push(`· 확인할 리스크: ${x}`));
    L.push(`검증 질문: ${report.marketCheck.validationQuestion}`);
    L.push(`첫 실험: ${report.marketCheck.firstExperiment}`);
  }
  L.push("");
  L.push("■ 첫 손님은 어디에");
  report.customerChannels.forEach((c) => L.push(`· ${c}`));
  L.push("");
  L.push("■ 이번 주 첫 행동");
  L.push(report.firstAction);
  if (report.whatToLearn?.length || report.peopleToReach?.length || report.toolsToTry?.length) {
    L.push("");
    L.push("■ 다음으로 해볼 것들");
    report.whatToLearn?.forEach((x) => L.push(`· [공부] ${x}`));
    report.peopleToReach?.forEach((x) => L.push(`· [사람] ${x}`));
    report.toolsToTry?.forEach((x) => L.push(`· [도구] ${x}`));
  }
  L.push("");
  L.push("■ 마지막 한마디");
  L.push(report.closing);
  return L.join("\n");
}
