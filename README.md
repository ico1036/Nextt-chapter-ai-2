# My Next Chapter AI · 마이 넥스트 챕터

미국 한인 이민자 엄마가 **자신의 경험·강점·관심사**를 바탕으로
_"내가 다시 어떤 일로 돈을 벌 수 있을지"_ 그 **방향 하나**를
15분 진단으로 선명하게 보도록 돕는 AI 진단형 웹앱입니다. (MVP1)

> 창업을 가르치는 제품이 아니라, **지금 작게 시작할 수 있는 단 하나의 방향**을 보여주는 제품.

---

## 빠르게 실행하기

```bash
npm install
npm run dev
```

→ 브라우저에서 **http://localhost:3000** 접속

| 경로 | 화면 |
| --- | --- |
| `/` | 랜딩 페이지 |
| `/start` | 시작/웰컴 (긴장 완화) |
| `/diagnostic` | 14문항 진단 플로우 (모바일 우선) |
| `/result/[id]` | 결과 리포트 (8단계) |
| `/admin` | 관리자 내부 뷰 (세션·완료율·이탈·리포트) |

프로덕션 빌드: `npm run build && npm start`

> 로컬은 별도 설정 없이 `data/db.json`에 저장됩니다.

---

## 배포 (Vercel + Neon + Claude API)

→ **[DEPLOY.md](DEPLOY.md)** 에 단계별 가이드가 있어요. 요약:

1. GitHub에 푸시 (로컬 git 저장소·첫 커밋은 준비됨)
2. Vercel에서 그 저장소 Import → Deploy
3. Vercel **Storage → Neon Postgres** 생성·연결 → `DATABASE_URL` 자동 주입 (테이블 자동 생성)
4. **Settings → Environment Variables** 에 `ANTHROPIC_API_KEY` 추가
5. Redeploy

**스토리지는 자동 전환**됩니다 — `DATABASE_URL`이 있으면 Postgres, 없으면 로컬 파일.
코드를 바꿀 필요가 없어요 (`lib/store.ts` 디스패처).

---

## 무엇을 만들었나 (What was built)

- **랜딩 페이지** — 따뜻한 프리미엄 디자인, 결과 미리보기, 4가지 사용자 유형 소개
- **진단 플로우** — 한 화면 한 질문, 진행바, 중간 요약(자산 비춰주기), 처리 화면
- **답변 영속화** — 질문마다 서버에 저장 (`/api/response`)
- **추천 엔진** — 규칙 기반 점수제(결정론적·검사 가능): 자산/유형 분류 → 8개 방향 0~2점 채점 → **후보 3개 + 1순위 1개**
- **AI 리포트 생성** — 한국어 8단계 리포트. 기본은 결정론적 템플릿(사용자 답변 단서를 녹임), 키가 있으면 Claude가 문장만 따뜻하게 보강
- **결과 화면** — 복사 / 공유 / 텍스트 저장 / 인쇄(PDF) + 후속 CTA
- **관리자 뷰** — 전체 세션, 완료율, 평균 소요, 추천 방향 분포, 질문별 이탈 지점, 원본 답변·리포트·점수 내역
- **이벤트 로깅** — 랜딩/시작/문항응답/완료/결과조회/복사·공유·저장/후속 CTA

---

## 스키마 요약 (Schema)

**듀얼 스토어** — `DATABASE_URL`이 있으면 Postgres(`lib/store-pg.ts`), 없으면
로컬 JSON 파일(`lib/store-file.ts`). `lib/store.ts`가 자동 선택. Postgres는
`sessions`/`events` 두 테이블에 세션 전체를 `jsonb`로 저장하며 첫 요청 때 자동 생성.

- **DiagnosticSession** — id, name?, email?, locale, status, startedAt, completedAt,
  completionTimeSeconds, predictedUserType, topRecommendedDirection, answers{}, recommendation, report, device
- **QuestionResponse** — session.answers 맵에 `questionKey → value`로 저장
- **RecommendationResult** — session.recommendation (assetTypes, predictedUserTypes, scores[], candidateDirections[3], topDirection)
- **AnalyticsEvent** — id, sessionId?, type, meta?, at

---

## 설정/콘텐츠는 어디에 있나 (Config lives here)

PRD 원칙대로 **질문·로직·프롬프트를 코드와 분리**했습니다.

| 파일 | 역할 | 수정하면 |
| --- | --- | --- |
| `lib/questions.ts` | 14개 질문 카피·옵션 | 질문 문구/선택지 바로 변경 |
| `lib/directions.ts` | 8개 방향 풀 + 점수 프로파일 | 방향 추가·가중치 조정 |
| `lib/engine.ts` | 분류 + 채점 규칙 | 추천 로직 (완전 투명) |
| `lib/report.ts` | 한국어 리포트 템플릿 | 오퍼/채널/행동/말투 문구 |
| `lib/ai.ts` | 선택적 Claude 보강 프롬프트 | AI 톤 조정 |

---

## 디자인 방향

- 팔레트: 따뜻한 아이보리 + 클레이(테라코타) + 세이지 + 골드 — 차분하고 가볍게 프리미엄
- 타이포: 본문 **Pretendard**, 헤드라인 **고운바탕(Gowun Batang)** 세리프
- 모바일 우선, 넉넉한 여백, 부드러운 그림자, 절제된 모션. SaaS·스타트업 느낌 배제.

---

## MVP2로 남긴 것 (What remains)

- 첫 오퍼 문장 다듬기 / 첫 고객 메시지 생성 (결과 화면 후속 CTA에 자리만 마련됨)
- 이메일로 결과 받기 (이메일 발송 연동)
- 인증/결제/커뮤니티 — **MVP1 범위에서 의도적으로 제외**

---

## 선택: AI 보강 켜기

`.env.example`을 `.env.local`로 복사하고 `ANTHROPIC_API_KEY`를 넣으면,
리포트의 _요약·강점·마지막 한마디_ 문장만 Claude가 더 따뜻하게 다듬습니다.
**추천 방향/오퍼/채널/행동은 규칙 엔진이 정한 그대로 유지**되어 QA가 안정적입니다.
키가 없어도 앱은 완전히 동작합니다.
