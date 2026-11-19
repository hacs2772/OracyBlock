# OracyBlock

**Hear it. Say it. No reading required.**
Build real conversations, block by block.

듣고, 말하고, 읽기 공부는 생략.
일본 여행에서 옆자리 사람의 말을 알아듣고 대답하는 걸, 브릭을 끼워 쌓는 게임으로 연습해요.

- 정한 내용: [`docs/concept.md`](docs/concept.md)
- 초기 기획: [`docs/brief.md`](docs/brief.md)
- 이전 버전(EarToMouth) 인수인계: [`docs/eartomouth-handoff.md`](docs/eartomouth-handoff.md)
- **사이트 켜는 법 (내 PC + Cloudflare Tunnel): [`docs/deploy.md`](docs/deploy.md)**

## 폴더

| 폴더 | 내용 |
|---|---|
| `web/` | 화면 (React + Vite). 대사는 `web/src/content/talks.js`, 게임 규칙·판정은 `web/src/content/build.js` |
| `backend/` | 서버 (Spring Boot + PostgreSQL + MyBatis). 테이블은 `backend/src/main/resources/db/migration` |
| `docker-compose.yml` | DB · 서버 · 웹 · 백업 · 터널을 한 번에 켜요 (`start.bat`) |

## 내 PC에서 화면만 고쳐 볼 때

```bash
cd web
npm install
npm run dev
```

서버(8080)가 켜져 있어야 기록이 남아요. 서버까지 한 번에 보려면 `start.bat`을 쓰고 http://localhost:8090 으로 들어가요.
