# 팀원에게 공유할 실행 방법

**Windows 10/11에서 CMD(명령 프롬프트)를 열고 아래 한 줄을 그대로 붙여넣으세요.**

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $p=Join-Path $env:TEMP 'stori-bootstrap.ps1'; Invoke-WebRequest 'https://raw.githubusercontent.com/limjunseo/hongik-graduate-FE/main/bootstrap.ps1' -UseBasicParsing -OutFile $p; & $p"
```

이 한 줄이 WinGet으로 Git·Node.js 22+·JDK 17+의 부족한 항목을 설치하고
FE+BE 저장소를 자동 복제/업데이트한 뒤 localhost 서버를 실행합니다.
브라우저는 http://localhost:5173 으로 열립니다.

- 설치할 때 인터넷과 Windows의 WinGet(Microsoft App Installer)이 필요합니다.
- 관리자 권한 승인(UAC)이 뜰 수 있으며 회사/학교 PC 정책상 설치가 거부될 수 있습니다.
- 저장소는 `%USERPROFILE%\stori-workspace\` 아래에 만들어집니다.
- 다시 실행할 땐 **같은 한 줄**을 입력하거나 FE의 `start-local.cmd`를 더블클릭하세요.
- 로그인 화면의 **화면 먼저 둘러보기**로 샘플 UI를 확인할 수 있습니다.
- DB는 각자 `BE/be/data/hongik-graduate.mv.db`에 저장되며 팀원 간 동기화되지 않습니다.
- 실제 회원가입에는 SMTP 메일 설정, 실제 AI에는 개인 AI_API_KEY가 추가로 필요합니다.
- 시크릿은 GitHub에 절대 올리지 마세요.

설치 스크립트: [bootstrap.ps1](./bootstrap.ps1) · 상세 안내: [README](./README.md)
