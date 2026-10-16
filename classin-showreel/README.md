# ClassIn — 「책 속의 배움이 모여, 모든 집의 상상력으로.」 모션그래픽 쇼릴 (v5)

Instagram 레퍼런스(“Amazon · From A to Z”, riki.bosso)와 제작자 공개 프롬프트를 분석해 **ClassIn** 버전으로 다시 설계한 28.8초 모션그래픽.
화면의 모든 것은 코드로 렌더링된다 — 로고까지 포함해 AI 생성 이미지·영상 없음, 실사 이미지 없음(인물은 가상 일러스트).

| 결과물 | |
|---|---|
| `out/classin_showreel_16x9.mp4` | 1920×1080 · 60fps · 28.8s · 오리지널 음악 + SFX (−14 LUFS) |
| `out/classin_showreel_9x16.mp4` | 1080×1920 · 60fps · 세로 리레이아웃(크롭 아님) |
| `docs/storyboard/` | 레퍼런스 보드, 스토리보드 시트, 수정 전/후 비교, 모션 분석 그래프 |

## 문서 (작업 순서)
1. [`docs/01_reference_analysis.md`](docs/01_reference_analysis.md) — 원본 장면별 분석, 매력 포인트, 공개 프롬프트에서 배운 제작 원칙
2. [`docs/02_brief_and_concepts.md`](docs/02_brief_and_concepts.md) — 브랜드 브리프, 컨셉 3안 평가, 최종안(+ v4·v5 방향 전환)
3. [`docs/03_script_storyboard.md`](docs/03_script_storyboard.md) — **v5 최종** 비트 시트, VO 대본, 음악·사운드 큐
4. [`docs/04_revision_log.md`](docs/04_revision_log.md) — v1 → v5 리뷰·수정·디벨롭 기록

## 아이디어 한 줄
**책 → 뇌 → 상상력 → 각각의 집 → ClassIn.**
연두빛 한 방울이 책 위에 떨어진다. 빛이 문장을 읽고, 단어·수식·그림이 페이지에서 떠올라 **뇌**를 만든다. 박자마다 시냅스가 발화하고, 전두엽의 불꽃이 로켓·토성·고래·나무·종이비행기를 한붓으로 그리는 **상상력**이 된다. 상상은 씨앗이 되어 마을로 떨어져 **집집마다 창문을 밝히고** — 그 창문 안에서는 ClassIn 라이브 수업이 열리고 있다. 모든 집의 빛이 다시 모여 로고의 `i` 점에 착지하고, 빛이 로고를 그리며 잉크가 번진다.

**원칙**: 아이보리 종이 무대 + 연두는 포인트로만 · 로고는 코드로(질감 머티리얼) · 하드컷 없는 60fps 원 테이크.

## 구조
```
src/
  index.html, styles.css, scenes.css   스테이지 + 디자인 토큰(아이보리/연두), 씬 스타일
  timeline.json                        타이밍의 단일 소스 (비트, 카피, VO) — 영상·사운드 공용
  js/core.js                           이징, 시드 랜덤, 4×4 행렬, 2.5D 카메라(CSS matrix3d와 동일 수식)
  js/line.js                           ★ 한 줄의 빛 — 모든 씬이 이 함수 하나로 빛을 그림 (아이보리용 연두 필라멘트)
  js/brandmark.js                      ★ 코드로 그린 ClassIn 워드마크 — 그레인·베벨·그림자·시인, 외곽선 트레이스·잉크 번짐
  js/world.js                          책·뇌·상상력을 잇는 하나의 카메라
  js/cues.js                           사운드 큐 시트 (모든 움직임 → 소리)
  js/scenes/*.js                       book · brain · imagine · homes · tagline · hero
  js/avatar.js                         가상 인물 일러스트
  assets/                              글리프 좌표(logo-paths.js), 폰트, (v4 에셋)
  dev/mark.html                        로고 머티리얼 테스트 시트
render/
  render.mjs      Playwright(Chromium)로 프레임 캡처, 모션블러 서브프레임
  audio.py        numpy로 오리지널 음악(100BPM, D장조) + SFX 합성(물방울·종이·시냅스·연필·마커·잉크), VO 슬롯
  encode.sh       서브프레임 블렌드 + 그레인 + loudnorm(−14 LUFS) + mux
  trace-logo.mjs  공식 PNG → 글리프 외곽선(1회성)
```

## 실행
```bash
cd classin-showreel
npm install                      # playwright (Chromium 필요: npx playwright install chromium)
npx serve src                    # 실시간 프리뷰 + 스크럽 (…/?fmt=9x16 로 세로판, dev/mark.html 로 로고 테스트)

bash render/build.sh             # 전체: 두 포맷 프레임 → 음악/SFX → 인코딩 (아래는 단계별)
node render/render.mjs --fmt 16x9 --fps 60 --sub 2 --workers 4   # 프레임
python3 render/audio.py                                          # 음악 + SFX (+ render/vo/vo_01..08.wav 있으면 VO)
bash render/encode.sh 16x9                                       # → out/classin_showreel_16x9.mp4
# 세로판: 위 세 줄에서 16x9 → 9x16
```
Python 3 + numpy, ffmpeg, Node 18+ 필요.

## 브랜드 · 데이터 원칙
- 로고는 공식 워드마크(`public/image/ClassIn logo-1.png`)에서 추출한 글리프 외곽선을 그대로 사용 — 형태는 바꾸지 않고, 재질(빛·그레인·베벨·그림자)만 코드로 입힘. 몸체 중심색은 공식 그린 #04BC09.
- 화면 속 인물(서윤·한지민 선생님 등)·데이터는 가상. 기관 수치는 기존 랜딩페이지의 공식 수치(1,000+ 다지점 학원)만 사용.
- ClassIn 수업 UI는 공식 사이트의 제품 화면을 참고해 코드로 다시 그림(공식 이미지 미사용).
- 폰트: Pretendard (OFL), Caveat (OFL).
