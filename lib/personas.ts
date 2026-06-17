// ─────────────────────────────────────────────────────────────
// Test personas — realistic sample inputs matching the target user
// (Korean immigrant moms in the US). Lets testers fill the diagnostic
// in one tap and review many different reports quickly.
//
// Flip TEST_TOOLS_ENABLED to false before a public launch to hide the
// example helpers from real users.
// ─────────────────────────────────────────────────────────────

import type { QuestionResponseMap } from "./types";

export const TEST_TOOLS_ENABLED = true;

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  type: string; // user-type label for the picker
  summary: string; // one-line who-she-is
  answers: QuestionResponseMap; // full 14-question answer set
}

export const PERSONAS: Persona[] = [
  {
    id: "career_reboot",
    name: "미선",
    emoji: "🌱",
    type: "다시 시작하는 엄마",
    summary: "은행원 출신, 8년 경력 단절. 꼼꼼한 정리가 강점",
    answers: {
      current_thought: "dont_know",
      current_state: "no_idea",
      korea_experience:
        "한국에서 은행에서 5년 일했어요. 결혼하고 미국 와서 아이 키우느라 일을 놓은 지 8년 됐어요.",
      us_experience:
        "아이 학교 자원봉사를 자주 하고, 동네 엄마들 모임에서 총무를 맡고 있어요.",
      often_asked: "가계부나 서류 정리 같은 걸 어떻게 하냐고 자주 물어봐요.",
      good_at_unpaid:
        "복잡한 숫자나 서류를 꼼꼼하게 정리하는 거요. 표로 만들면 마음이 편해져요.",
      work_style: "one_on_one",
      energy_giving: "누군가의 복잡한 문제가 깔끔하게 정리됐을 때요.",
      dont_want: "사람들 앞에서 발표하거나 영업 전화를 돌리는 일이요.",
      time_available: "about_1h",
      format: "online",
      want_most: "find_direction",
      direction_interest: "guide",
      biggest_blocker: "not_good_enough",
    },
  },
  {
    id: "expert",
    name: "정아",
    emoji: "📚",
    type: "이미 자산이 있는 전문가 엄마",
    summary: "전직 영어 교사 10년. 쉽게 설명하는 데 강점",
    answers: {
      current_thought: "is_it_valuable",
      current_state: "good_cant_offer",
      korea_experience: "한국에서 중학교 영어 교사를 10년 했어요.",
      us_experience:
        "교회에서 아이들 영어를 가르치고, 학부모들 영어 공부도 도와줘요.",
      often_asked:
        "아이 영어 어떻게 시키냐고, 영어책 추천해달라고 자주 물어봐요.",
      good_at_unpaid:
        "어려운 걸 아주 쉽게 풀어 설명하는 거요. 못 따라오던 아이도 제 설명은 이해해요.",
      work_style: "teach",
      energy_giving: "막막해하던 사람이 ‘아, 이제 알겠어요’ 할 때요.",
      dont_want: "행정 서류 작업이나 똑같은 걸 반복하는 일이요.",
      time_available: "about_2h",
      format: "both",
      want_most: "grow_my_work",
      direction_interest: "class",
      biggest_blocker: "cant_describe",
    },
  },
  {
    id: "ai_curious",
    name: "보라",
    emoji: "✨",
    type: "AI가 궁금한 엄마",
    summary: "전직 마케터. 챗GPT·캔바를 빨리 익혀 알려주는 걸 좋아함",
    answers: {
      current_thought: "connect_ai",
      current_state: "vague_ideas",
      korea_experience: "한국에서 작은 회사 마케팅 일을 했어요. 디자인도 조금 했고요.",
      us_experience:
        "요즘 챗GPT랑 캔바로 동네 모임 안내문을 만들어주는 걸 자주 해요.",
      often_asked: "AI 어떻게 쓰는지, 챗GPT로 뭘 할 수 있는지 물어봐요.",
      good_at_unpaid:
        "새로운 앱이나 AI 도구를 빨리 익혀서 쉽게 알려주는 거요.",
      work_style: "teach",
      energy_giving: "AI를 무서워하던 분이 직접 해보고 신기해할 때요.",
      dont_want: "혼자 종일 컴퓨터만 붙잡고 있는 일이요.",
      time_available: "about_1h",
      format: "online",
      want_most: "test_small",
      direction_interest: "ai_help",
      biggest_blocker: "would_anyone_pay",
    },
  },
  {
    id: "community_connector",
    name: "은영",
    emoji: "🤝",
    type: "사람을 잇는 커넥터 엄마",
    summary: "정착·연결의 달인. 새 이민 가족을 많이 도와옴",
    answers: {
      current_thought: "alongside_family",
      current_state: "can_do_no_income",
      korea_experience:
        "한국에선 특별한 직업보다, 늘 사람들 모으고 행사 챙기는 걸 했어요.",
      us_experience:
        "새로 이민 온 가족들 정착을 많이 도와요. 병원, 학교, 마트까지 같이 다녀요.",
      often_asked:
        "미국 정착 어떻게 하냐고, 어디 가서 뭘 해야 하냐고 늘 물어봐요.",
      good_at_unpaid:
        "사람들을 연결해주고, 필요한 정보를 모아서 알려주는 거요.",
      work_style: "connect",
      energy_giving: "내가 소개해준 사람들이 서로 도움이 됐다고 할 때요.",
      dont_want: "혼자 책상에 앉아 문서만 만드는 일이요.",
      time_available: "weekends",
      format: "offline",
      want_most: "quick_small",
      direction_interest: "community",
      biggest_blocker: "need_more_ready",
    },
  },
  {
    id: "life_experience",
    name: "수진",
    emoji: "🌷",
    type: "삶의 경험이 자산인 엄마",
    summary: "특수교육 과정을 직접 겪음. 같은 처지 엄마들을 도와옴",
    answers: {
      current_thought: "earn_again",
      current_state: "vague_ideas",
      korea_experience: "한국에서 작은 미용실을 운영했어요. 사람 만나는 걸 좋아해요.",
      us_experience:
        "미국 와서 우리 아이 특수교육 받게 하면서 그 과정을 다 겪었어요. 같은 처지 엄마들을 많이 도와줬어요.",
      often_asked:
        "특수교육이나 IEP를 어떻게 받냐고, 학교랑 어떻게 얘기하냐고 물어봐요.",
      good_at_unpaid:
        "내가 먼저 겪어본 걸 바탕으로, 막막한 사람의 마음을 편하게 해주는 거요.",
      work_style: "one_on_one",
      energy_giving: "나처럼 헤매던 엄마가 안심하고 방향을 잡을 때요.",
      dont_want: "감정 없이 사무적으로만 처리하는 일이요.",
      time_available: "under_30",
      format: "both",
      want_most: "find_direction",
      direction_interest: "consult",
      biggest_blocker: "no_time",
    },
  },
  {
    id: "aspiring_youth",
    name: "도현",
    emoji: "🚀",
    type: "미국 창업을 꿈꾸는 청년",
    summary: "한국 청년, 사이드 프로젝트 경험. 뭘 할지 막막하지만 열망은 큼",
    answers: {
      current_thought: "dont_know",
      current_state: "vague_ideas",
      korea_experience:
        "한국에서 대학 다니면서 작은 사이드 프로젝트를 몇 개 만들어봤어요. 코딩도 조금 해요.",
      us_experience:
        "미국에 와서 창업 모임이나 해커톤에 기웃거리며 사람들을 만나고 있어요.",
      often_asked: "AI 툴 어떻게 쓰는지, 사이드 프로젝트 어떻게 시작하는지 물어봐요.",
      good_at_unpaid: "새로운 걸 빨리 배워서 일단 만들어보는 거요.",
      work_style: "make_alone",
      energy_giving: "내가 만든 걸 누군가 실제로 써줄 때요.",
      dont_want: "반복적인 사무 작업이요.",
      time_available: "about_2h",
      format: "online",
      want_most: "grow_my_work",
      direction_interest: "digital",
      biggest_blocker: "would_anyone_pay",
    },
  },
];

export const PERSONA_BY_ID: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
);
