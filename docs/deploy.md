# oracyblock.com 열기 (내 PC + Cloudflare Tunnel)

asmrBlock을 켜는 방법과 거의 같아요. 처음 한 번만 1~4단계를 하고, 그다음부터는 `start.bat`만 더블클릭하면 돼요.

## 준비물

- asmrBlock 서버로 쓰는 그 PC (Docker Desktop, Git이 이미 깔려 있음)
- Cloudflare 계정 (asmrBlock에 쓰는 계정 그대로)
- asmrBlock과 동시에 켜도 돼요. 주소(포트)와 DB가 따로예요 (asmrBlock 8088, OracyBlock 8090)

## 1단계. 도메인을 Cloudflare에 연결 (처음 한 번)

oracyblock.com을 **Cloudflare에서 샀다면** 이미 연결돼 있어요. 2단계로 넘어가요.

다른 곳(가비아, 후이즈, 네임칩 등)에서 샀다면:

1. Cloudflare 대시보드 → **Add a domain** (도메인 추가) → `oracyblock.com` → **Free** 요금제
2. Cloudflare가 알려 주는 **네임서버 2개**를 복사
3. 도메인을 산 곳의 "네임서버 변경" 메뉴에서 그 2개로 바꾸기
4. Cloudflare에서 "Active"가 될 때까지 기다리기 (보통 몇 분, 길면 몇 시간)

## 2단계. 터널 만들기 (처음 한 번)

asmrBlock 터널과 섞이지 않게 **새 터널**을 하나 더 만들어요. 무료예요.

1. Cloudflare 대시보드 → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel**
2. **Cloudflared** 선택 → 이름 `oracyblock` → 저장
3. 설치 방법 화면에 나오는 명령어 안의 긴 글자(`eyJ`로 시작)가 **터널 토큰**이에요. 복사해 두기 (설치 명령은 실행하지 않아요. Docker가 대신 해요)
4. 다음 화면 **Public Hostname** 추가:
   - Subdomain: 비워 두기 / Domain: `oracyblock.com`
   - Service: Type `HTTP`, URL `web:80`
5. (선택) 하나 더 추가: Subdomain `www`, Domain `oracyblock.com`, Service `HTTP` `web:80`

## 3단계. 코드 받기 (처음 한 번)

PowerShell에서 asmrBlock을 받아 둔 폴더 옆 같은 곳으로 가서:

```bash
git clone https://github.com/hacs2772/OracyBlock.git
```

(저장소가 비공개면 깃허브 로그인 창이 떠요. asmrBlock과 같은 계정으로 로그인)

```bash
cd OracyBlock
```

```bash
git checkout claude/oracyblock-mvp
```

## 4단계. 켜기

1. `OracyBlock` 폴더의 **start.bat** 더블클릭
2. 처음이면 메모장이 열려요. `CHANGE_ME` 세 곳을 채우고 저장:
   - `TUNNEL_TOKEN` = 2단계에서 복사한 토큰
   - `ADMIN_EMAIL` = 관리자로 쓸 내 이메일
   - `ADMIN_PASSWORD` = 관리자 비밀번호 (10자 이상, 나만 아는 것)
3. **start.bat 다시 더블클릭** → 처음엔 5~10분 걸려요 ("켜졌어요!"가 나오면 끝)

## 5단계. 확인

1. 내 PC 브라우저에서 http://localhost:8090 → 안내 화면이 나오면 서버는 OK
2. 휴대폰에서 https://oracyblock.com → 같은 화면이 나오면 터널도 OK
3. 사이트에서 **내 정보 → 로그인** → `ADMIN_EMAIL` / `ADMIN_PASSWORD`로 로그인
4. **내 정보 → 관리자 화면**: 오늘 방문자, 가입한 사람, 시작·끝낸 대화, 어디서 그만두는지, 대화별 튕김, 의견

## 친구들에게 보낼 때 같이 알려 줄 것

- 링크: https://oracyblock.com
- **카카오톡 안에서 열지 말고** 오른쪽 위 메뉴 → "다른 브라우저로 열기"(크롬·사파리). 카톡 안 브라우저는 마이크로 대답하기가 안 될 수 있어요
- 처음 "눌러서 말하기"를 누르면 마이크 허용 창이 떠요 → 허용
- 소리가 안 나면: 휴대폰 무음 모드 끄기. 아이폰은 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성 → 일본어 목소리 받기
- 홈 화면에 추가하면 앱처럼 쓸 수 있어요 (사파리: 공유 → 홈 화면에 추가 / 크롬: 메뉴 → 홈 화면에 추가)
- 불편한 점은 **내 정보 → 의견 보내기**로 (관리자 화면에서 바로 보여요)

## 검색에 나오게 하기 (무료, 한 번만)

주소창에 `oracyblock.com`을 치면 지금도 들어와요. `oracyblock`이나 "일본 여행 회화"로 **검색**해서 나오게 하려면 검색 엔진에 사이트를 알려 줘야 해요. 사이트 쪽 준비(검색 설명, 카톡 링크 카드 그림 `og-image.png`, `robots.txt`, `sitemap.xml`)는 다 돼 있어요.

**구글 (Google Search Console)**
1. https://search.google.com/search-console 접속 → 구글 계정으로 로그인
2. **속성 추가** → 왼쪽 **도메인** 칸에 `oracyblock.com` → 계속
3. 확인 방법에 Cloudflare가 보이면 **자동으로 확인**(Cloudflare 로그인 → 허용). 안 보이면 알려 주는 TXT 값을 Cloudflare → oracyblock.com → DNS → Records → Add record(Type `TXT`, Name `@`)에 넣고 확인
4. 왼쪽 메뉴 **Sitemaps** → `https://oracyblock.com/sitemap.xml` 입력 → 제출

**네이버 (서치어드바이저)**
1. https://searchadvisor.naver.com 접속 → 네이버 로그인 → **웹마스터 도구**
2. 사이트 등록에 `https://oracyblock.com` 입력
3. 소유 확인 방법은 **HTML 태그**를 골라요. `<meta name="naver-site-verification" content="긴글자" />`에서 **content의 긴 글자만** 복사
4. OracyBlock 폴더의 `.env`를 메모장으로 열고 맨 아래에 한 줄 추가 후 저장:
   ```
   NAVER_SITE_VERIFICATION=복사한긴글자
   ```
5. `start.bat` 다시 실행 (1~2분) → 네이버 화면에서 **소유확인** 누르기
6. 사이트를 누르고 **요청 → 사이트맵 제출**에 `https://oracyblock.com/sitemap.xml`

검색 결과에 나오기까지 며칠~2주쯤 걸려요.

## 업데이트 (새 버전을 깃에 올렸을 때)

**start.bat**을 다시 더블클릭하면 돼요. 최신 코드를 받아서(git pull) 다시 만들어 켜요. 가입자와 기록은 그대로예요.

## 끄기

**stop.bat** 더블클릭. 가입자와 기록은 그대로 남아요.

## 문제가 생기면

서버 쪽 원인 글 보기 (PowerShell, OracyBlock 폴더에서):

```bash
docker compose --env-file .env logs --tail 60 backend
```

터널 쪽:

```bash
docker compose --profile public --env-file .env logs --tail 30 tunnel
```

- localhost:8090은 되는데 oracyblock.com이 안 되면: 터널 토큰, 2단계의 Public Hostname(`web:80`), 1단계 도메인이 Active인지 확인
- 관리자 로그인이 안 되면: `ADMIN_PASSWORD`가 10자 이상인지 확인하고 start.bat 다시 실행 (켜질 때 비밀번호를 .env와 맞춰요)

## 백업

`OracyBlock\backups\db` 폴더에 하루 한 번 DB가 저장돼요 (14일치). 가끔 USB나 클라우드 드라이브에도 복사해 두세요.

- 서버를 켤 때 한 번, 그 뒤 하루에 한 번. 실패하면 10분 뒤에 다시 해요
- 파일 크기가 몇 KB 이상이면 정상이에요. 1KB도 안 되는 파일은 실패한 것이라 다음 성공 때 저절로 지워져요
- 잘 되는지 보기: `docker compose --env-file .env logs --tail 5 backup` → `DB 백업: ... (204KB)`처럼 크기가 나오면 정상

### 백업을 PC 밖에도 한 부 (추천)

PC 디스크가 고장 나면 기록과 백업이 같이 사라져요. 구글 드라이브나 OneDrive 앱을 깔면 생기는 폴더에 사본을 두면, 그 앱이 저절로 클라우드에 올려 줘요 (무료 용량이면 충분해요. 백업 하나가 몇백 KB).

1. 구글 드라이브(또는 OneDrive) 폴더 안에 `OracyBlock 백업` 폴더를 만들어요
2. 그 폴더의 주소를 복사해요 (탐색기 주소창 클릭 → 복사). 예: `C:\Users\내이름\Google Drive\OracyBlock 백업`
3. `.env` 맨 아래 `BACKUP_COPY_DIR=` 뒤에 붙여 넣고, `\` 를 `/` 로 바꿔요
   예: `BACKUP_COPY_DIR=C:/Users/내이름/Google Drive/OracyBlock 백업`
4. `start.bat` 다시 실행 → 그 폴더에 `oracyblock-날짜.sql.gz`가 생기면 성공 (최근 7개만 남겨요)
   - 안 생기면: `docker compose --env-file .env logs --tail 5 backup` 에서 "바깥 폴더에 복사하지 못했어요"가 보이는지 확인. 폴더 이름에 띄어쓰기가 있으면 `OracyBlock-backup`처럼 바꿔 보세요

PC가 망가졌을 때는 새 PC에 설치한 뒤, 그 폴더의 파일을 `backups\db` 에 넣고 `restore.bat` 을 실행하면 돼요.

### 백업에서 되살리기

DB가 망가졌거나 기록이 사라졌을 때만 써요. 그 백업 뒤에 생긴 기록은 없어져요.

1. `restore.bat` 더블클릭 → 가장 최근 백업을 보여 줘요
2. `Y`를 누르면: 지금 상태를 한 번 더 백업 → 서버 잠깐 멈춤 → 되살리기 → 서버 다시 켜기
3. 다른 날 백업을 쓰려면 PowerShell에서 `.\restore.bat oracyblock-20261125-1308.sql.gz`

(2026-11-25 시험 서버에서 기록을 지운 뒤 되살려 봤어요: 대화 596판·브릭 705개가 모두 돌아왔어요)

## 사이트가 꺼지면 알림

집 PC가 꺼지거나 인터넷·터널이 끊기면 사이트가 멈춰요. 무료 감시 서비스가 5분마다 확인하고, 멈추면 메일·휴대폰으로 알려 줘요.

1. UptimeRobot(uptimerobot.com)에 무료 가입
2. **Add New Monitor** → 종류 **HTTP(s)**
3. 주소: `https://oracyblock.com/api/v1/ping` (서버와 DB가 모두 살아 있어야 `{"ok":true}`)
4. 확인 간격 5분, 알림 받을 곳(가입한 메일)을 고르고 저장
5. 휴대폰에 UptimeRobot 앱을 깔고 로그인하면 앱 알림도 와요

꺼졌다는 알림이 오면: PC가 켜져 있는지 → Docker Desktop이 켜져 있는지 → `start.bat` 다시 실행

⚠ `docker compose down -v`는 DB(가입자·기록)를 지워요. 쓰지 마세요.
