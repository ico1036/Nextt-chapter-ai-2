# 배포 가이드 — Vercel + Neon Postgres + Claude API

이 문서대로 따라 하면 **GitHub → Vercel 자동 배포 + 데이터베이스 + Claude API**까지 한 번에 연결됩니다.
계정 생성·키 입력처럼 직접 하셔야 하는 부분만 남겨뒀어요.

준비물: GitHub 계정, Vercel 계정(무료), Anthropic API 키(`sk-ant-...`, 이미 있으심).

---

## 1단계 · GitHub에 코드 올리기

로컬은 이미 git 저장소로 만들어 두고 첫 커밋까지 끝냈습니다.
이제 GitHub에 빈 저장소를 만들고 연결만 하면 돼요.

1. https://github.com/new 접속 → 저장소 이름 예: `my-next-chapter-ai`
   - **Private 권장**. README/.gitignore는 추가하지 마세요(이미 있음).
2. 만들면 나오는 주소를 복사해서, 프로젝트 폴더에서 아래 실행:

```bash
git remote add origin https://github.com/<당신아이디>/my-next-chapter-ai.git
git branch -M main
git push -u origin main
```

> 푸시할 때 GitHub 로그인 창이 뜨면 그대로 로그인하시면 됩니다.

---

## 2단계 · Vercel에 프로젝트 연결

1. https://vercel.com 로그인 → **Add New… → Project**
2. 방금 만든 GitHub 저장소를 **Import**
3. 프레임워크는 **Next.js**로 자동 인식됩니다. 그대로 **Deploy** 누르세요.
   - (이때 DB가 아직 없어서 데이터 저장은 안 되지만, 화면은 정상적으로 뜹니다.)

---

## 3단계 · 데이터베이스 연결 (Neon Postgres)

Vercel 안에서 클릭 몇 번으로 끝납니다.

1. 방금 만든 Vercel 프로젝트 → 상단 **Storage** 탭 → **Create Database**
2. **Neon (Postgres)** 선택 → 지역은 가까운 곳(예: Washington, D.C. 또는 가까운 미국 동부) → **Create**
3. "Connect to Project"에서 이 프로젝트를 선택해 연결하세요.
   - 그러면 `DATABASE_URL`(및 관련 변수)이 **자동으로 환경변수에 추가**됩니다. 직접 입력할 필요 없어요.
4. 테이블은 첫 진단이 들어오면 **앱이 자동으로 생성**합니다. (별도 SQL 실행 불필요)

---

## 4단계 · Claude API 키 넣기

1. Vercel 프로젝트 → **Settings → Environment Variables**
2. 새 변수 추가:
   - Name: `ANTHROPIC_API_KEY` / Value: `sk-ant-...` (당신의 키)
   - (선택) Name: `ANTHROPIC_MODEL` / Value: `claude-sonnet-4-6`
     - 기본값이 sonnet-4-6라 안 넣어도 됩니다. 최고 품질을 원하면 `claude-opus-4-8`.
3. 환경은 **Production / Preview / Development** 모두 체크.

> 키가 없어도 앱은 동작합니다(규칙 기반 리포트). 키를 넣으면 리포트의
> 요약·강점·마지막 한마디 문장만 Claude가 더 따뜻하게 다듬어요.

---

## 5단계 · 다시 배포

환경변수를 추가했으니 한 번 재배포해야 적용됩니다.

- Vercel 프로젝트 → **Deployments** → 최신 배포의 **⋯ → Redeploy**
- 또는 코드를 한 줄이라도 바꿔 `git push`하면 자동 재배포됩니다.

배포가 끝나면 받은 주소(`https://....vercel.app`)로 접속해서:
- `/` 랜딩 → 진단 → 결과까지 동작 확인
- `/admin` 에서 방금 한 세션이 보이면 **DB까지 정상 연결된 것**

---

## 동작 원리 (참고)

- `DATABASE_URL`이 있으면 자동으로 **Postgres**에 저장, 없으면 로컬 `data/db.json` 사용
  → 로컬 개발은 아무 설정 없이, 프로덕션은 DB로. 코드 수정 불필요.
- Claude 호출은 결과 생성 경로에서 8초 안에 끝나며, 느리면 자동으로
  규칙 기반 리포트로 안전하게 대체됩니다.

## 자주 묻는 것

- **`/admin`을 아무나 보면 안 되지 않나요?** MVP1이라 인증이 없습니다.
  운영 시에는 접근 제한(비밀번호/IP)이 필요해요 — MVP2 과제로 남겨뒀습니다.
- **비용?** Vercel·Neon 무료 티어로 충분히 시작 가능. Claude API만
  사용량만큼 과금됩니다(진단 1건당 짧은 호출 1회).
