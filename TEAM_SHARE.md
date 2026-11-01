# 팀원에게 공유할 짧은 안내

Windows 기준: Node.js 22+, JDK 17+, Git을 설치하고
https://github.com/limjunseo/hongik-graduate-FE 저장소를 내려받은 후
`start-local.cmd`를 더블클릭하세요.

첫 실행 때 BE 저장소와 npm 패키지를 자동으로 내려받을 수 있으며,
`http://localhost:5173` 화면을 열어 줍니다.
별도 DB 설치는 필요 없습니다. `be/data/hongik-graduate.mv.db`에 로컬 파일로
저장되며 서버 재시작 후에도 유지됩니다. 각자 별도 DB이며 데이터는 자동 공유되지 않습니다.
백업이 필요하면 백엔드를 종료하고 `backup-local-db.ps1`을 실행하세요.

로그인 없는 샘플 화면은 **'화면 먼저 둘러보기'**로 확인할 수 있습니다.
실제 로그인/회원가입 기능은 백엔드 및 이메일 설정이 필요하고,
실제 AI는 BE의 `be/.env-local`에 개인 `AI_API_KEY`가 필요합니다.
비밀키는 Git에 올리지 마세요.

개발 중 문제: `npm run build`, BE의 `.\mvnw.cmd verify`,
localhost:8080/swagger-ui.html을 확인하세요.
