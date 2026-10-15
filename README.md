# Vite + TypeScript

프레임워크 없이 Vite의 vanilla-ts 템플릿으로 만든 프로젝트입니다.

## 로컬 사용

```sh
npm ci
npm run dev
```

`npm run build`는 TypeScript 검사와 프로덕션 빌드를 수행하고 `dist/`에 결과를 만듭니다.

## GitHub Pages 배포

1. 저장소 `Wanseo/swag2`의 **Settings → Pages**에서 **Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
2. 변경한 파일을 커밋하고 `main` 브랜치에 푸시합니다.
3. **Actions → Deploy to GitHub Pages**에서 배포 성공 여부를 확인합니다. **Run workflow**로 수동 실행할 수도 있습니다.
4. 배포 완료 후 https://wanseo.github.io/swag2/ 에 접속합니다.

워크플로는 Node.js 24에서 `npm ci`, `npm run build`를 실행한 뒤 `dist/`를 배포합니다. 별도 배포 토큰이나 `gh-pages` 브랜치는 필요하지 않습니다.

`vite.config.ts`의 `base`는 `/swag2/`입니다. 저장소 이름을 바꾸면 이 값도 바꾸세요. 사용자 사이트(`사용자명.github.io`)나 사용자 지정 도메인을 쓰면 `/`로 설정하세요.

`src/assets/` 파일은 import하여 사용하세요. `public/` 파일을 TypeScript 문자열에서 참조할 때는 `${import.meta.env.BASE_URL}파일명`으로 경로를 만드세요. HTML에서는 `%BASE_URL%파일명`을 사용할 수 있습니다.

## SWAG II 미리듣기

시작 화면은 기존 이미지입니다. 플레이어의 양옆 버튼으로 곡을 고르면 앨범 표지가 표시되고, 가운데 버튼으로 로그인 없이 공식 미리듣기를 재생·정지합니다. 재생 중 곡을 넘기면 새 미리듣기가 이어집니다. 미리듣기가 끝나면 자동 재생을 멈춥니다.

`src/swag-ii.json`은 Apple iTunes Lookup API의 미국 카탈로그 앨범 `1837867200` 중 disc 1의 신곡 23곡 메타데이터입니다. 기존 SWAG 수록곡은 제외했습니다. 오디오는 Apple의 원본 미리듣기 URL에서 스트리밍하며 저장소에 음원을 저장하지 않습니다. 제공 구간은 Apple이 지정한 미리듣기이며 곡의 시작 부분과 다를 수 있습니다.

앨범을 홍보하는 iTunes 배지·구매 링크와 `provided courtesy of iTunes` 출처 표기를 유지하세요. 공식 조건: https://performance-partners.apple.com/search-api

재생 중에는 Web Audio API의 저주파 에너지와 순간적인 상승을 분석해 배경에 파장을 만듭니다. 분석은 재생 클릭 이후에만 시작하며, 오디오를 녹음하거나 별도로 저장하지 않습니다. 일시정지·버퍼링·종료 시 효과가 잦아들고, 운영체제의 움직임 줄이기 설정에서는 파장을 표시하지 않습니다.

플레이어 왼쪽의 목록 버튼은 검정 배경의 SWAG II 곡 목록을 열고 닫습니다. 위·아래 버튼으로 선택을 옮기고 가운데 버튼으로 선택한 미리듣기를 재생합니다. 목록 탐색 중에는 현재 재생을 유지합니다. 곡을 직접 클릭하거나 키보드의 위·아래/Enter로 선택할 수도 있습니다.

곡별 배경은 `src/atmospheres.ts`의 8가지 팔레트와 `trackAtmospheres` 매핑으로 정합니다. 레퍼런스를 바탕으로 지정한 색 조합이며 자동 장르 분석 결과는 아닙니다. 곡을 선택하거나 이전·다음 곡으로 넘어가면 새 팔레트로 부드럽게 전환되고, 기존 오디오 비트 파장은 유지됩니다.

파장은 `src/ripples.ts`에서 중앙을 기준으로 비대칭 물결을 만듭니다. 비트마다 물결 방향이 바뀌고 저음 강도에 따라 확산 폭이 달라집니다. 각도 계산을 캐시하며 화면 밖 탭과 움직임 줄이기 설정에서는 기존 렌더링 제한을 유지합니다.
