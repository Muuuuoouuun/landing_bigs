# ClassIn — 「수업이 즐거우면, 생각이 날아오른다.」 모션그래픽 쇼릴 — v8 작업본

> **v8.2** — 수업을 더 즐겁게 (24초, 16:9, 사람 장면 없음). 훅은 공식 ClassIn 앱 아이콘(갈매기), 마을은 회색 블록에 색이 들어서는 3D 바둑판, 펜은 스프링 리그, 펜·필기 소리는 움직임에서 합성. v7.1은 `../classin-showreel/`. 기획: [`docs/06_v8_plan.md`](docs/06_v8_plan.md) · 기록: [`docs/04_revision_log.md`](docs/04_revision_log.md)

Instagram 레퍼런스(“Amazon · From A to Z”, riki.bosso)와 제작자 공개 프롬프트를 분석해 **ClassIn** 버전으로 다시 설계한 21초 모션그래픽.
v7은 원본과 같은 레이어 구조로 만든다 — **생성 이미지(배경·질감·오브젝트)** 를 같은 2.5D 카메라 공간에 배치하고, **빛 한 줄·로고·ClassIn UI·글자는 코드**로 얹는다. AI 영상 생성은 쓰지 않는다.

| 결과물 | |
|---|---|
| `out/classin_showreel_16x9.mp4` | 1920×1080 · 60fps · 24.0s · 오리지널 음악 + SFX (−14 LUFS) · 필름 그레이딩 — **v8.2** (갈매기 앱 아이콘 훅, 3D 폰·태블릿·펜, 교실 놀이 도구, 빛 고래, 회색 → 색 블록 마을, 아침 리포트, 아이콘+워드마크 엔드카드) |
| `docs/storyboard/` | 레퍼런스 보드, 스토리보드 시트, 수정 전/후 비교, 모션 분석 그래프 |

## 문서 (작업 순서)
1. [`docs/01_reference_analysis.md`](docs/01_reference_analysis.md) — 원본 장면별 분석, 매력 포인트, 공개 프롬프트에서 배운 제작 원칙
2. [`docs/02_brief_and_concepts.md`](docs/02_brief_and_concepts.md) — 브랜드 브리프, 컨셉 3안 평가, 최종안(+ v4·v5 방향 전환)
3. [`docs/03_script_storyboard.md`](docs/03_script_storyboard.md) — **v5 최종** 비트 시트, VO 대본, 음악·사운드 큐
4. [`docs/04_revision_log.md`](docs/04_revision_log.md) — v1 → v7 리뷰·수정·디벨롭 기록
5. [`docs/05_v7_reference_tuning.md`](docs/05_v7_reference_tuning.md) — **v7** 원본 재분석 → 적용점 → 튜닝 대본(12마디) · 이미지 생성 목록

## 아이디어 한 줄
**하나에서 전국으로.** 어둠 속 연두빛이 ClassIn 로고의 `i` 점에 슬램하고, 그 점의 빛이 떨어져 서윤의 공책 위 펜 끝이 된다 — "만약에 고래가 하늘을 난다면?" 책에서 읽은 단어들이 모여 고래가 되지만 혼자서는 날지 못하고 흩어진다. 그 질문이 태블릿 속 **ClassIn 수업**에서 선생님께 닿고, 반 친구들과 함께 그린 답이 되어 돌아온다. 고래가 화면을 뚫고 창밖으로 — 새벽 마을의 **집집마다** 창문이 켜지고, 하늘 높이에서 **전국**의 도시로 빛이 번진다. 다음 날 아침, 공책의 물음표 점은 ClassIn의 `i` 점이 되어 있고, 학부모에게 수업 리포트가 도착한다.

**원칙**: 어둠 → 새벽 → 아이보리 + 연두 · 생성 이미지는 배경과 요소를 따로(누끼) · 로고는 코드로(질감 머티리얼) · ClassIn 실제 기능 · 하드컷 없는 60fps 원 테이크.

## 구조
```
src/
  index.html, styles.css, scenes.css   스테이지 + 디자인 토큰(아이보리/연두), 씬 스타일
  timeline.json                        타이밍의 단일 소스 (비트, 카피, VO) — 영상·사운드 공용
  js/core.js                           이징, 시드 랜덤, 4×4 행렬, 2.5D 카메라(CSS matrix3d와 동일 수식)
  js/line.js                           ★ 한 줄의 빛 — 모든 씬이 이 함수 하나로 빛을 그림 (밤: 가산 발광 ↔ 낮: 종이 위 연두)
  js/brandmark.js                      ★ 코드로 그린 ClassIn 워드마크 — 그레인·베벨·그림자·시인, 외곽선 트레이스·잉크 번짐
  js/world.js                          책상 → 고래 → 태블릿 → 방 → 창문을 잇는 하나의 카메라
  js/cues.js                           사운드 큐 시트 (모든 움직임 → 소리)
  js/scenes/*.js                       intro · book · words · whale · lesson(ClassIn 수업) · dawn · nation · morning · tagline · hero
  js/avatar.js                         가상 인물 일러스트
  assets/                              글리프 좌표(logo-paths.js), 폰트(Pretendard, Caveat, Nanum Pen Script 서브셋), (v4 에셋)
  dev/mark.html                        로고 머티리얼 테스트 시트
render/
  render.mjs      Playwright(Chromium)로 프레임 캡처, 모션블러 서브프레임
  audio.py        numpy로 오리지널 음악(100BPM, D장조) + SFX 합성(물방울·종이·시냅스·연필·마커·잉크), VO 슬롯
  encode.sh       서브프레임 블렌드 + 그레인 + loudnorm(−14 LUFS) + mux
  gen.py          Gemini 이미지 API로 플레이트·질감·오브젝트 생성 (매니페스트, 호출별 비용 로그 gen_log.json)
  key.py          마젠타 배경 키잉 + 디스필 + 스프라이트 분리 → src/assets/gen/*.png
  prep.py         생성 원본 → 영상용 크기/압축
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
- 화면 속 인물(서윤·한지민 선생님·반 친구들)·데이터는 가상. 기관 수치는 기존 랜딩페이지의 공식 수치(1,000+ 다지점 학원)만 사용.
- ClassIn 수업 UI는 공식 사이트의 제품 화면을 참고해 코드로 다시 그림(공식 이미지 미사용).
- 폰트: Pretendard (OFL), Caveat (OFL), Nanum Pen Script (OFL, 사용 글자만 서브셋).
- 생성 이미지: Gemini(gemini-3-pro-image / gemini-3.1-flash-image)로 만든 가상의 방·마을·사물. 실존 장소·인물·브랜드를 재현하지 않음. 한반도 형태는 생성하지 않고 실제 행정경계 도트맵을 코드로 렌더.
