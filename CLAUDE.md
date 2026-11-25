# OracyBlock — AI 작업 가이드

일본 여행에서 옆자리 사람의 말을 **듣고 알아듣고 대답하는** 걸, 브릭을 끼워 쌓는 게임으로 연습하는 서비스. 읽기·쓰기는 필요 없어요.
사용자의 다른 프로젝트 **asmrBlock**(`hacs2772/asmr_block`)을 오마주했어요. 이전 이름은 EarToMouth예요.

## 작업 전에 꼭 읽기

1. [`docs/concept.md`](docs/concept.md): 사용자와 **확정한 내용**. 여기 적힌 것이 기준이에요.
2. [`docs/brief.md`](docs/brief.md): GPT와 정리한 초기 기획. concept.md와 다르면 concept.md를 따라요.
3. [`docs/eartomouth-handoff.md`](docs/eartomouth-handoff.md): EarToMouth v1~v5 기록, 거절된 디자인, 옮겨 쓸 대사·음성·복습 로직.
   - 옛 코드: `hacs2772/zero-reading-just-talking` 저장소 `claude/brave-johnson-ltwsvw` 브랜치 (`js/talks.js`, `js/speech.js`, `js/store.js`)

## 정해진 기술·운영

- 도메인 **oracyblock.com**
- 서버: asmrBlock과 같은 구성 (Spring Boot + PostgreSQL + MyBatis, 웹은 React). 사용자의 집 PC + Cloudflare Tunnel, Docker(`docker compose`)로 묶어서 나중에 클라우드로 옮기기 쉽게
- 웹 먼저(휴대폰에서 앱처럼 쓰는 PWA) → 인기가 생기면 앱(Expo)
- 브릭 모양은 B(테두리)
- 휴대폰 아래 탭: **홈 · 학습 · 복습 · 내 탑 · 상점·미션** ("여행 판"·"소개" 탭은 쓰지 않아요). 재화 이름은 **브릭**, 탑 숫자는 "층" (concept 11-21), 내 정보는 오른쪽 위. 처음 온 사람만 소개 웹(`/about`), 그 뒤에는 홈(`/`). 홈 = 다음 대화 큰 버튼 하나 + "다시 만날 사람" 줄(1·3·7일 반복, concept 11-23) + 한 줄 상태 + 작은 내 탑 (concept 11-16). 학습(`/learn`) = 레벨("Lv 변경") + 장소 판. 고치기는 `/fix`. 내 차례는 **고르기만** (말하기·글자 입력은 뺌, concept 11-5). 대화 화면 순서는 탑 → 얼굴+말풍선 → 문제 → 보기 (concept 11-16). 쌓는 속도 `web/src/lib/speed.js` + 서버 `PrefController.DAY_CAP`. 로그인은 asmrBlock처럼 이메일 + 비밀번호, 가입 없이 둘러보기도 가능
- 코드: `web/`(React + Vite, 색은 `web/src/styles.css`의 `:root`에만), `backend/`(Spring Boot 4 + MyBatis 어노테이션 매퍼 + Flyway), `docker-compose.yml`, 켜는 법 `docs/deploy.md` (되살리기 `restore.bat`, 감시 주소 `/api/v1/ping`), 휴대폰 점검표 `docs/phone-check.md`
  - 대사 `web/src/content/talks.js`(EarToMouth에서 옮김), 레벨·어긋남(NEAR)·5지선다·판정 `web/src/content/build.js`
  - 기록 주인(owner) = 로그인 `u:아이디` / 둘러보기 `v:방문자번호`(헤더 `X-Visitor-Id`). 가입·로그인하면 `UserService.claim`이 옮겨요
  - 관리자 통계는 `s_visit`·`s_play` 보기(관리자 기기 뺌)로 세요
  - 고친 탑은 `play.crooked`를 바꾸지 않아요 (올바른 탑으로 세지 않음)

## 사용자와 일하는 방식

- 한국어, 쉬운 말로. 전문 용어는 줄여요.
- 사용자는 주로 **휴대폰에서 미리보기 링크**로 확인해요. 바뀐 점은 링크와 함께 짧게 알려 줘요.
- 크게 바꾸기 전에는 시안을 몇 개 보여 주고 고르게 해요. 섣불리 만들지 않고 의견을 먼저 주고받아요.
- 사용자가 요청하기 전에는 PR을 만들지 않아요. 작업 브랜치: `claude/oracyblock-mvp`. **커밋하면 `main`에도 같이 올려요** (`git push origin claude/oracyblock-mvp:main`, 2026-11-23 사용자 요청)

## 꼭 지킬 것

- **목표는 옆자리 사람과 스몰토크.** JLPT 준비도, 완벽한 회화도 아니에요. 정확히 다 알아듣는 것보다 "통하는 것"이 먼저예요
- **단어가 가장 중요해요.** 문법·존댓말·어감보다 단어. 핵심 단어 하나만 말해도 딱 맞음("칸코쿠진", "비-루"). 맞혀도 틀려도 복습할 때도 단어를 크게 보여 주고 들려줘요
- **듀오링고처럼 보이지 않게**: 위 X + 진행 막대 + 아래 큰 "계속" 버튼, 단어 타일로 문장 조립, 스트릭, 길 따라 이어진 레슨 지도 금지
- **AI가 만든 티 안 나게**: 보라 그라데이션, 이모지, 반짝이(✦✨), em dash(—), 작은 머리말(eyebrow), "1·2·3 단계" 카드 묶음, 긴 설명 문단 금지
- 뜻(해석)은 **맞힌 다음에** 보여 줘요
- **한글 발음은 처음부터 보여 줘요** (상대 말풍선, 내 대답 브릭 모두). 이어폰 없이 화면만 보는 사람도 할 수 있게요. **일본어 글자는 작고 흐리게** 함께
- 반말은 작은 "반말" 표시만. 크게 강조하지 않아요
- **0원 운영**: 유료 서버·유료 API 없이 시작 (무료 한도 안의 Cloudflare Workers·D1은 괜찮음). 음성 듣기·인식은 브라우저 기능
- 내 차례 대답 보기에는 **한글 발음만**, 한국어 뜻은 보여 주지 않아요 (뜻은 대답한 다음 결과에서). "뜻 보기"는 없어요. 두 번 튕기면 답을 보여 주고 그 차례 브릭 없이 넘어가요 (고치기에 "빠진 대답")
- **휴대폰 먼저**: 320px 폭(아이폰 SE)에서도 넘치지 않게. 객관식은 5지선다("여기엔 없어요" 없음), 상대 말풍선 + 뜻 보기 5개가 SE 화면 안에 들어와야 해요. 틀린 보기에 뜻이 비슷한 말은 넣지 않아요 (concept 11-14)
- 버튼 배경색에 `transition`을 걸지 않아요 (상태가 바뀔 때 색이 번쩍임)
- 클래스 이름이 다른 화면과 겹치지 않게 지어요
- 다른 서비스·완구 회사의 이름·로고·캐릭터·문장을 쓰지 않아요. 대사는 모두 새로 써요
