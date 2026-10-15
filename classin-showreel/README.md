# ClassIn Enterprise — 「Class, In.」 모션그래픽 쇼릴

Instagram 레퍼런스(“Amazon · From A to Z”, riki.bosso)의 화면 속 광고를 분석해 **ClassIn Enterprise** 버전으로 다시 설계한 26.4초 모션그래픽.
화면의 모든 것은 코드로 렌더링된다 — AI 영상 생성 없음.

| 결과물 | |
|---|---|
| `out/classin_showreel_16x9.mp4` | 1920×1080 · 60fps · 26.4s · 음악+SFX (−14 LUFS) |
| `out/classin_showreel_9x16.mp4` | 1080×1920 · 60fps · 세로 리레이아웃(크롭 아님) |
| `docs/storyboard/` | 레퍼런스 보드, 키프레임, 컨택트시트, 수정 전/후 비교 |

## 문서 (작업 순서)
1. [`docs/01_reference_analysis.md`](docs/01_reference_analysis.md) — 원본 장면별 분석, 매력 포인트, 공개 프롬프트에서 배운 제작 원칙
2. [`docs/02_brief_and_concepts.md`](docs/02_brief_and_concepts.md) — 랜딩페이지 데이터로 만든 브랜드 브리프, 컨셉 3안 평가, 최종안(녹여내기)
3. [`docs/03_script_storyboard.md`](docs/03_script_storyboard.md) — 프레임 단위 비트 시트, VO 대본, 음악·사운드 큐
4. [`docs/04_revision_log.md`](docs/04_revision_log.md) — 리뷰 → 수정 → 디벨롭 기록

## 아이디어 한 줄
**Class + In = "모든 수업(Class)을, 하나의 시스템 안(In)으로."**
ClassIn 로고의 기울어진 `i` 점에서 태어난 한 줄의 그린 라인이 모든 일을 한다 — 로고 슬램 → 콘솔 입력창 포커스 라인 → 커리큘럼 카드 트레이스 → `전 지점에 배포` 버튼 채움 → 서울 본사에서 전국 128개 지점으로 뻗는 배포 경로 → 교실을 한 바퀴 감고 칠판 정답 밑줄로 착지 → 16개 교실에서 다시 본사 대시보드 차트 라인으로 → `안으로` 밑줄 → `Class`+`In` 화살표 → 공식 로고의 `i` 점에 슬롯인.

## 구조
```
src/
  index.html, styles.css, scenes.css   스테이지 + UI 디자인 (Pretendard, Caveat)
  timeline.json                        타이밍의 단일 소스 (비트, 카피, VO) — 영상·사운드 공용
  js/core.js                           이징, 시드 랜덤, 4×4 행렬, 2.5D 카메라(CSS matrix3d와 동일 수식)
  js/line.js                           ★ 한 줄의 빛 — 모든 씬이 이 함수 하나로 빛을 그림
  js/logo.js                           공식 로고(PNG) 마스크·지오메트리, 브랜드 화살표
  js/cues.js                           사운드 큐 시트 (모든 움직임 → 소리)
  js/scenes/*.js                       slam · console · map · classroom · dashboard · tagline · hero
  assets/                              로고 사전 스케일본, 글리프 좌표, 한국 도트맵, 폰트
render/
  render.mjs      Playwright(Chromium)로 프레임 캡처, 모션블러 서브프레임
  audio.py        numpy로 오리지널 음악(100BPM, D장조) + SFX 합성, VO 슬롯
  encode.sh       서브프레임 블렌드 + 그레인 + loudnorm(−14 LUFS / −1.25 dBTP) + mux
  trace-logo.mjs, make-korea-map.py   에셋 생성 도구(1회성)
```

## 실행
```bash
cd classin-showreel
npm install                      # playwright (Chromium 필요: npx playwright install chromium)
npx serve src                    # 실시간 프리뷰 + 스크럽 (…/?fmt=9x16 로 세로판)

node render/render.mjs --fmt 16x9 --fps 60 --sub 2 --workers 3   # 프레임
python3 render/audio.py                                          # 음악 + SFX (+ render/vo/vo_01..09.wav 있으면 VO)
bash render/encode.sh 16x9                                       # → out/classin_showreel_16x9.mp4
# 세로판: 위 세 줄에서 16x9 → 9x16
node render/render.mjs --stills 0.17,7.2,21.6 --out docs/storyboard --prefix sb_   # 스틸만
```
Python 3 + numpy, ffmpeg, Node 18+ 필요.

## 브랜드 · 데이터 원칙
- 공식 워드마크(`public/image/ClassIn logo-1.png`)만 사용 — 이동·스케일·페이드·마스크만, 재작도·재색상 없음, 정지 시 픽셀 정확(사전 스케일 PNG). 빛의 화살표는 별도의 드로잉.
- 화면 속 학원명(하람에듀)·인물·지점 데이터는 가상. 수치는 기존 랜딩페이지의 공식 수치(1,000+ 도입, 0.3초, 100%, 4분, 99.9%)만 사용.
- 폰트: Pretendard (OFL), Caveat (OFL). 지도: KOSTAT 2013 행정경계(southkorea/southkorea-maps) → 도트로 래스터화.
