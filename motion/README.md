# ClassIn Enterprise — 15초 시네마틱 쇼릴 (데모)

미리보기: [`preview/classin-showreel-preview.mp4`](preview/classin-showreel-preview.mp4) · 스토리보드: [`preview/classin-showreel-storyboard.jpg`](preview/classin-showreel-storyboard.jpg)

대형 교육기관(다지점 학원 본사)을 타깃으로 한 15초 키네틱 타이포그래피 모션 그래픽입니다.
[Remotion](https://www.remotion.dev) (React 기반 영상 렌더링)으로 제작되어, 코드 수정 → 즉시 미리보기 → MP4 렌더가 가능합니다.

- 해상도 / 프레임: 1920×1080 · 30fps · 450프레임 (정확히 15.00초)
- 톤: 딥 포레스트 블랙 + ClassIn 그린(#00df45) + 골드 포인트 — 랜딩 페이지와 동일한 브랜드 팔레트
- 폰트: Pretendard(본문/헤드라인), JetBrains Mono(HUD·숫자) — 모두 npm에서 로컬 로드, 렌더 시 네트워크 불필요
- 사운드: 컷에 맞춘 BGM(128.6 BPM, 1박 = 14프레임) + 효과음 30종 — 전부 코드로 합성한 오리지널 사운드라 저작권 걱정 없음, -14 LUFS / -1 dBFS 마스터링

## 실행

```bash
cd motion
npm install
npm run studio          # 브라우저 스튜디오에서 타임라인 미리보기/스크럽
npm run render          # 마스터 MP4 (CRF 17) → out/classin-showreel.mp4
npm run render:preview  # 공유용 경량 MP4 (CRF 27) → out/classin-showreel-preview.mp4
```

> Chrome Headless Shell은 첫 렌더 시 Remotion이 자동으로 내려받습니다.
> 이미 설치된 브라우저를 쓰려면 `--browser-executable=<path>`를 붙이세요.

특정 프레임만 확인: `./render-stills.sh ClassInShowreel 120 240 400` → `out/stills/`

## 사운드 (BGM + 효과음)

모든 사운드는 `audio/generate.py`가 numpy/scipy로 합성합니다 (샘플·외부 음원 없음).

```bash
pip install -r audio/requirements.txt   # numpy, scipy
npm run audio                           # public/audio/ 아래 WAV 재생성
```

- `src/audio/soundtrack.json` — 오디오 싱크의 단일 기준. 음악 구간(임팩트·AI 히트·필인·로고 히트 프레임)과 효과음 큐(`at` 프레임, `sfx`, `volume`)가 모두 여기 있습니다.
- `public/audio/soundtrack.wav` — 음악 + 효과음 프리믹스를 리미터로 마스터링한 최종본. 렌더 기본값.
- `public/audio/music.wav`, `public/audio/sfx/*.wav` — 스템. 스튜디오의 Props 패널에서 `audio: "stems"`로 바꾸면 큐를 개별 트랙으로 재생하므로, JSON만 고쳐서 바로 들어볼 수 있습니다. 확정 후 `npm run audio`로 마스터를 다시 만드세요. (`"off"`는 무음)

| 구간 | 음악 | 주요 효과음 |
|---|---|---|
| 0–1.9s | 저음 드론 · 심장박동 킥 · 가속하는 시계 틱 | 스캔 스윕, 노드 블립, 카운터 롤, 리버스 심벌, 글리치 |
| 1.9s | **드롭** — 4/4 킥 · 클랩 · 16비트 하이햇 · 펌핑 베이스 · 아르페지오 (Dm–B♭–C–A) | 시네마틱 임팩트 + 서브 드롭, 2.6s 슬램 |
| 3.3–8.0s | 그루브 유지, 표준화 3단 전환이 박에 맞춰 떨어짐 | 펜 판서음, 데이터 칩, 카드 플립, 토글 클릭, 컷 |
| 7.9–8.1s | 브레이크 — "그리고 이제," 정적 | 라이저 |
| 8.1s | **AI 드롭** — 스퀘어 아르페지오 · 옥타브 베이스 | 대형 임팩트 + 글리치 + 서브 드롭 |
| 9–11.6s | AI 그루브 | 분석 험, 휠 틱, 점수 카운터, 타이핑, A+ 딩, 완료 차임 |
| 11.4–11.9s | 스네어 롤 필인 → 크래시 | 위프팬 우쉬, 슬램, KPI 플립 |
| 13.0–13.7s | 드럼 아웃, A 코드 텐션 상승 | 롱 라이저 |
| 13.7s | **D 메이저 피날레 코드** · 페이드아웃 | 로고 임팩트 + 시머 |

## 스토리보드 (전체 15초)

| 시간 | 씬 | 카피 | 주요 모션 |
|---|---|---|---|
| 0.0–3.7s | 01 BRANCHES | 지점이 늘어날수록, 수업은 **제각각**이 됩니다. → 모든 지점에, **하나의 기준.** | 128개 지점 노드 혼돈 부유 · 글리치 · 지점 카운터 롤링 → 임팩트(플래시·쇼크웨이브·카메라 셰이크·렌즈 스트릭) 후 그리드 정렬, 본사→전 지점 전파 라인, 레터박스 오픈 |
| 3.3–8.0s | 02 STANDARDIZE | 표준화 **수업 / 콘텐츠 / 관리** | 슬롯머신 워드 롤(모션블러) · ① ClassIn 수업 화면 — 펜이 이차함수 그래프를 판서(눈금·절편·대칭축·꼭짓점·y<0 영역), 풀이 3단계, 학생 커서 주석, 추적점 P 좌표, 손들기 → 9개 지점으로 복제·동기화 ② 본사 커리큘럼 카드 → 12개 지점 원클릭 배포 ③ 본사→원장→강사 권한 트리 + 권한 토글 |
| 7.7–9.2s | 03 AI | 그리고 이제, **AI** — 수업을 읽고, 평가하고, 관리합니다. | 푸시컷 → 거대 AI 슬램 · RGB 스플릿 · 슬라이스 글리치 · 회전 HUD 링 · 스피드라인 |
| 8.9–11.6s | 04 AI 강의평가 | AI 강의평가 — 모든 강의를 같은 기준으로 자동 분석 | 라이트 와이프 → 레이더 차트 6축 · 종합 점수 롤링 → A+ · 발화비율/질문/참여도 · 음성 파형 · AI 요약 타이핑 · 3D 기능 휠(수업요약·학습리포트·참여도·이상감지·출결) |
| 11.3–13.3s | 05 EFFICIENCY | 관리는 **AI가,** 본사는 **결정만.** | 위프팬 → 상승 그래프 · KPI 타일 플립: 실시간 / 4분 / 1일 / 0건 |
| 13.0–15.0s | 06 CLASSIN | 모든 지점을, **하나의 기준**으로. | 로고 와이프 리빌 + 스페큘러 스윕 · 태그라인 · CTA · 레터박스 클로즈 |

전 구간 공통: 필름 그레인, 비네팅, 레터박스, 타임코드 HUD.

## 구조

```
src/
  Showreel.jsx            마스터 타임라인 (TransitionSeries + 글로벌 오버레이)
  theme.js / fonts.js     팔레트·이징·폰트
  components/
    Kinetic.jsx           KineticText(rise/slam/blur/flip/scramble/pop/drop), RollingNumber, WordSlot, Typewriter
    Fx.jsx                Grain, Vignette, Letterbox, Flash, Shake, Shockwave, LensStreak, SliceGlitch
    Background.jsx        GridFloor, GridPlane, Dust, SpeedLines
    ClassroomWindow.jsx   ClassIn 수업 화면 목업 (판서 그래프 · 풀이 · 학생 상호작용, `t` 하나로 전체 동기화)
  audio/
    soundtrack.json       BGM 구간 + 효과음 큐 시트 (오디오 싱크 기준)
    Soundtrack.jsx        mix / stems / off 재생
  scenes/                 씬 6개 (스튜디오의 Scenes 폴더에서 개별 미리보기 가능)
  transitions/            zoomBlur, lightWipe, whipUp, dip (커스텀 전환)
```

카피·숫자·타이밍은 각 씬 파일 상단 상수(`*_DURATION`, `IMPACT`, `SLAM`, `BEATS`, `KPIS`, `COPY` 등)에서 바로 수정할 수 있습니다. 씬 길이를 바꾸면 컷이 음악 박(14프레임)에서 벗어나니, `src/audio/soundtrack.json`의 프레임도 함께 맞추고 `npm run audio`를 다시 실행하세요.

## 확인이 필요한 부분

- **수치**: KPI(실시간 · 4분 · 1일 · 0건)와 지점 수 128은 현재 랜딩 페이지 카피를 그대로 가져온 데모 값입니다. 외부 공개 전 실제 수치로 검증이 필요합니다.
- **AI 강의평가 화면**: 레이더 점수·발화 비율·AI 요약은 연출용 샘플 데이터입니다.
- **사운드**: 합성 오리지널이라 라이선스 문제는 없지만, 최종 광고용이라면 전문 사운드 디자이너의 음원이나 라이선스 음원으로 교체하는 것도 고려해 보세요. 교체 시 `soundtrack.json`의 프레임 기준을 그대로 쓰면 싱크가 맞습니다.
- **Remotion 라이선스**: 개인 및 직원 3명 이하 회사는 무료이고, 그 이상 규모의 회사가 사용할 때는 [Company License](https://www.remotion.pro)가 필요합니다.
