# stori. — Hongik Graduate Frontend

경험을 기록하고 나에게 맞는 자기소개서를 준비하는 AI 취업 준비 워크스페이스.
깔끔한 라이트 UI와 반응형 레이아웃을 가진 React + TypeScript 애플리케이션입니다.

**Frontend**: https://github.com/limjunseo/hongik-graduate-FE

**Backend**: https://github.com/limjunseo/hongik-graduate-BE

## 팀원 온보딩: Windows CMD 한 줄 설치·실행

**Windows 10/11에서 명령 프롬프트(CMD)를 열고 아래 한 줄을 복사·붙여넣으세요.**
Git/Node/JDK 사전 설치나 저장소 수동 복제가 필요 없습니다.

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $p=Join-Path $env:TEMP 'stori-bootstrap.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/limjunseo/hongik-graduate-FE/main/bootstrap.ps1' -UseBasicParsing -OutFile $p; & $p"
```

이 명령어는 공개 [FE 저장소의 `bootstrap.ps1`](./bootstrap.ps1)을 HTTPS로 내려받아 실행합니다.
팀원은 실행 전에 해당 스크립트를 읽어볼 수 있습니다. 인터넷 연결과 Windows의
**WinGet(Microsoft App Installer)**이 필요하며, PC의 설치 권한·보안 정책에 따라
관리자 권한 승인(UAC)이 필요하거나 설치가 차단될 수 있습니다.

한 번 실행하면 다음 순서로 처리합니다.

1. Git, Node.js **22+**, JDK **17+** 설치 여부와 버전을 확인합니다.
   부족한 도구만 공식 WinGet 패키지(`Git.Git`, `OpenJS.NodeJS.LTS`,
   `Microsoft.OpenJDK.17`)로 설치합니다.
2. `%USERPROFILE%\stori-workspace\` 아래에 FE와 BE GitHub 저장소를 복제합니다.
   재실행 시에는 로컬 수정사항이 없는 `main` 브랜치만 fast-forward 업데이트합니다.
   기존 수정사항과 로컬 데이터·비밀키는 유지합니다.
3. FE 패키지를 자동 설치하고, 백엔드의 JWT 비밀키/H2 파일 DB 디렉터리를 준비합니다.
   Maven Wrapper가 백엔드를 실행하며 별도 DB 서버는 필요 없습니다.
4. FE/BE 터미널이 열리고 브라우저에 **http://localhost:5173**을 표시합니다.

> 최초 Maven 다운로드는 시간이 걸릴 수 있습니다. 처음 설치하는 팀원 PC에서는
> WinGet 설치가 끝나도 OS 정책상 새 터미널이나 관리자 승인이 필요할 수 있습니다.
> 터미널 창을 닫거나 Ctrl+C를 누르면 해당 로컬 서버가 종료됩니다.

### 재실행 / 테스트

- 같은 CMD 한 줄을 다시 입력하면 안전한 경우 FE와 BE를 업데이트한 후 실행합니다.
- 이미 내려받은 FE 폴더에서는 `start-local.cmd` 더블클릭만으로 재실행할 수 있습니다.
- 설치 없이 점검: `powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 -DryRun`
- 설치 도구가 모두 있는 PC에서 테스트 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 -SkipInstall`



### localhost 주소

| 역할 | 주소 |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api (사용 중이면 8081~8090 중 빈 포트) |
| Swagger | http://localhost:8080/swagger-ui.html (백엔드 선택 포트에 따라 변경) |

Vite가 `/api` 및 `/v3`를 스크립트가 선택한 로컬 백엔드 포트로 프록시합니다. 8080을 다른 프로세스가 사용하면 기존 앱을 종료하지 않고 8081~8090에서 빈 포트를 찾습니다. 터미널에 표시된 실제 백엔드 주소를 이용하세요. CORS 설정 변경은 불필요합니다.

### 스크립트 수동 실행

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

옵션: `-FrontendOnly` (백엔드 없이 화면만 실행), `-NoBrowser` (브라우저 자동 실행 안 함), `-BackendPath "D:\projects\hongik-graduate-BE"` (별도 BE 경로). 이 옵션들은 PowerShell에서 사용합니다.

기존에 FE와 BE가 각각 있고 경로가 다른 경우 `-BackendPath`로 지정하세요. 팀원의 로컬에 `졸프` 폴더가 있을 필요는 없습니다.

## 시연/데모 모드

로그인 화면 하단의 **화면 먼저 둘러보기**에서 샘플 데이터를 이용한 읽기 전용 UI를 볼 수 있습니다.
데모 모드는 가짜 계정이 아니며 **실제 데이터 저장이나 AI 호출은 차단**됩니다.
회원가입·이메일 인증은 백엔드의 SMTP 설정이 있어야 작동합니다.
팀원이 실제 회원 기능을 사용하려면 백엔드 계정을 생성할 수 있는 환경이어야 합니다.

## DB: 별도 서버 설치 없음

- **H2 파일 데이터베이스**가 백엔드에 내장되어 있습니다. SQLite와 마찬가지로
  별도 MySQL/PostgreSQL 인스턴스나 Docker DB 컨테이너가 필요하지 않습니다.
- DB 위치: 백엔드 저장소 `be/data/hongik-graduate.mv.db`.
- `start-local.cmd`가 데이터 폴더를 만들고 백엔드 실행 시 DB가 초기화됩니다.
  이후 서버를 껐다 켜도 기존 데이터는 유지됩니다.
- 팀원마다 자기 PC의 로컬 데이터가 저장되며 실시간 데이터 동기화는 되지 않습니다.
- **백업:** 백엔드 터미널을 종료하고 FE 폴더의 **`backup-local-db.cmd`를 더블클릭**하세요. PowerShell 사용 시 아래 명령도 가능합니다.
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File .\backup-local-db.ps1
  ```
  `be/data/backups/`에 날짜별 백업을 만들며, DB 사용 중에는 안전을 위해 거부합니다.
  저장소를 통째로 삭제하기 전에는 백업 파일을 다른 곳에 보관하세요. PDF 등 첨부 파일은 `be/uploads/`에 별도로 저장되므로 필요하다면 그 폴더도 백업해야 합니다.
  DB 경로를 직접 변경한 경우 백업 스크립트의 `-DatabaseFile` 옵션을 사용하면 됩니다.

## 실제 AI 연결

백엔드의 `be/.env-local`에 다음 환경변수를 직접 추가합니다.

```properties
AI_API_KEY=YOUR_API_KEY
```

스크립트가 `JWT_SECRET`을 자동 생성하며, 이미 존재하는 파일은 덮어쓰지 않습니다.
이 파일은 Git 무시 목록에 있어야 하고 시크릿 값을 커밋하거나 공유하면 안 됩니다.
API Key 미설정 시 실제 AI 응답이 생성되지 않습니다.
사용량/비용 제한 및 모의면접 기능은 본 프로젝트 범위에서 제외했습니다.
상세: [백엔드 AI 안내](https://github.com/limjunseo/hongik-graduate-BE/blob/main/docs/AI_READY_GUIDE.md).

## UI/UX 글자 크기

초기 버전의 9~12px 초소형 텍스트를 확대해 메뉴, 카드, 버튼, 입력창 등
주요 화면 텍스트를 더 읽기 쉽게 조정했습니다. 화면 폭에 따라 사이드바,
자소서 편집기, 모바일 하단 내비게이션의 간격도 함께 조정했습니다.

## 화면

- 로그인/가입 (이메일 확인), 로그인 없는 미리보기
- 대시보드: 경험 수·완성 수·지원 현황, 최근 경험과 지원 내역
- 경험 목록: 검색·태그 필터·신규 생성·삭제
- 경험 상세: 서술형 빠른 기록·AI 경험 채팅·맞춤 꼬리질문·요약 승인 저장
- 지원 관리: 지원 카드 생성·검색·상태 필터·삭제
- 자기소개서 편집: 문항 관리, 답변, 경험 연결, 초안·첨삭·대화·지원 전략
- 채용공고: JD 저장/분석, 근거 기반 직무·기업 자료 분석
- 설정: 프로필 관리, 백엔드 연결 상태

AI 제안은 답변에 자동 반영/저장되지 않으며 사용자가 검토한 후 편집·저장해야 합니다.

## 개발

```powershell
npm ci
npm run dev
npm run build
npm run test:ui  # 실행 중인 localhost:5173 + Windows Chrome/Edge 필요
```

`npm run build`는 TypeScript 타입 검사와 Vite 배포 빌드를 수행합니다.
팀과 작업할 때는 `package-lock.json`을 반드시 함께 커밋하세요.

## 참고 및 제한

- 별도 FE/BE 저장소입니다. BE 코드는 FE 저장소에 복제/커밋하지 않습니다.
- 이 프로젝트는 로컬 시연용입니다. 운영 배포의 SSL, DB 마이그레이션과 시크릿 정책은 별도입니다.
- 팀원의 로컬 개발 데이터는 각자의 컴퓨터에 저장되며 자동 공유되지 않습니다.
- HTML/CSS/React 미리보기는 로그인 없이 확인할 수 있지만, 실사용 API에는 JWT 인증이 필요합니다.
