# ClassIn — 「Class, In.」 모션그래픽 쇼릴 (교실 · 학생 · 가족 · 미래)

Instagram 레퍼런스(“Amazon · From A to Z”, riki.bosso)와 제작자 공개 프롬프트를 분석해 **ClassIn** 버전으로 다시 설계한 28.8초 모션그래픽.
화면의 모든 것은 코드로 렌더링된다 — AI 영상 생성 없음, 실사 이미지 없음(인물은 가상 일러스트).

| 결과물 | |
|---|---|
| `out/classin_showreel_16x9.mp4` | 1920×1080 · 60fps · 28.8s · 오리지널 음악 + SFX (−14 LUFS) |
| `out/classin_showreel_9x16.mp4` | 1080×1920 · 60fps · 세로 리레이아웃(크롭 아님) |
| `docs/storyboard/` | 레퍼런스 보드, 스토리보드 시트, 수정 전/후 비교, 모션 분석 그래프 |

## 문서 (작업 순서)
1. [`docs/01_reference_analysis.md`](docs/01_reference_analysis.md) — 원본 장면별 분석, 매력 포인트, 공개 프롬프트에서 배운 제작 원칙
2. [`docs/02_brief_and_concepts.md`](docs/02_brief_and_concepts.md) — 브랜드 브리프, 컨셉 3안 평가, 최종안(+ v4 방향 전환)
3. [`docs/03_script_storyboard.md`](docs/03_script_storyboard.md) — **v4 최종** 비트 시트, VO 대본, 음악·사운드 큐
4. [`docs/04_revision_log.md`](docs/04_revision_log.md) — v1 → v4 리뷰·수정·디벨롭 기록

## 아이디어 한 줄
**Class + In = "교실(Class)에서 시작된 배움을, 아이의 미래 안(In)으로."**
ClassIn 로고의 기울어진 `i` 점에서 태어난 한 줄의 빛이 사람을 따라간다 — 로고 슬램 → 지후의 폰 `수업 입장` → 선생님의 펜 끝 → 답변기 → 손들기 · 무대 → 지후의 펜 끝 → **트로피 +1** → 엄마 폰의 알림 · 리포트 → **감사의 하트** → 미래의 경로(72 → 88 → 오늘 → 지후의 꿈) → 전국 모든 교실의 빛기둥 → 태그라인을 쓰는 빛 → 모든 연결선이 수렴 → 공식 로고의 `i` 점에 슬롯인.

**원칙**: 초록은 포인트 컬러로만(뉴트럴 무대 + ClassIn 실제 UI의 보조색) · ClassIn 실제 기능으로만 이야기 · 하드컷 없는 60fps 원 테이크 · 감정의 온도(교실 → 집 → 새벽 → 로고).

## 구조
```
src/
  index.html, styles.css, scenes.css   스테이지 + UI 디자인 (Pretendard, Caveat)
  timeline.json                        타이밍의 단일 소스 (비트, 카피, VO) — 영상·사운드 공용
  js/core.js                           이징, 시드 랜덤, 4×4 행렬, 2.5D 카메라(CSS matrix3d와 동일 수식)
  js/line.js                           ★ 한 줄의 빛 — 모든 씬이 이 함수 하나로 빛을 그림
  js/logo.js                           공식 로고(PNG) 마스크·지오메트리, 브랜드 화살표
  js/cues.js                           사운드 큐 시트 (모든 움직임 → 소리)
  js/scenes/*.js                       slam · app · classroom · family · future · map · tagline · hero
  js/phone.js, js/avatar.js            폰 프레임 · 가상 인물 일러스트
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

bash render/build.sh             # 전체: 두 포맷 프레임 → 음악/SFX → 인코딩 (아래는 단계별)
node render/render.mjs --fmt 16x9 --fps 60 --sub 2 --workers 3   # 프레임
python3 render/audio.py                                          # 음악 + SFX (+ render/vo/vo_01..09.wav 있으면 VO)
bash render/encode.sh 16x9                                       # → out/classin_showreel_16x9.mp4
# 세로판: 위 세 줄에서 16x9 → 9x16
node render/render.mjs --stills 0.17,7.2,21.6 --out docs/storyboard --prefix sb_   # 스틸만
```
Python 3 + numpy, ffmpeg, Node 18+ 필요.

## 브랜드 · 데이터 원칙
- 공식 워드마크(`public/image/ClassIn logo-1.png`)만 사용 — 이동·스케일·페이드·마스크만, 재작도·재색상 없음, 정지 시 픽셀 정확(사전 스케일 PNG). 빛의 화살표는 별도의 드로잉.
- 화면 속 인물(지후·이서연 선생님 등)·학원·데이터는 가상. 기관 수치는 기존 랜딩페이지의 공식 수치(1,000+ 다지점 학원)만 사용.
- ClassIn UI는 공식 사이트의 제품 화면을 참고해 코드로 다시 그림(공식 이미지 미사용).
- 폰트: Pretendard (OFL), Caveat (OFL). 지도: KOSTAT 2013 행정경계(southkorea/southkorea-maps) → 도트로 래스터화.
