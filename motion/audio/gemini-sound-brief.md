# Gemini(Lyria)로 쇼릴 사운드 만들기: 브리프 · 시안 5개 · 프롬프트

27초 ClassIn Enterprise 쇼릴의 음악을 Gemini(Lyria)로 만들 때 쓰는 문서입니다.

- 0장: 어디서 어떻게 만들지
- 1장: 이 영상이 음악에 요구하는 것(사운드 특징)
- 2장: 방향이 다른 시안 5개와 바로 붙여 넣는 프롬프트
- 3장: 편집용 조각 프롬프트
- 4장: 효과음
- 5장: 받은 음악을 영상에 맞추는 법

기준일은 2026-11-09입니다. Lyria 사양은 자주 바뀌니 맨 아래 출처의 공식 안내를 한 번 확인하세요.

---

## 0. 어디서, 어떻게 만들까

| 도구 | 길이 | 특징 | 쓰임 |
|---|---|---|---|
| Gemini 앱 · Lyria 3 | 30초 | 텍스트·사진·짧은 영상으로 생성, 한국어 프롬프트 가능 | 시안 탐색 (가장 빠름) |
| Gemini 앱 · Lyria 3 Pro (유료 요금제) | 최대 3분 | 같은 방식, 더 긴 곡 | 긴 버전 |
| AI Studio / Gemini API · `lyria-3-clip-preview` | 항상 30초 | 참고 이미지 최대 10장, MP3 | 시안을 같은 조건으로 여러 번 |
| AI Studio / Gemini API · `lyria-3.5` | 몇 분 (프롬프트로 조절) | WAV로 받을 수 있음 | 최종본 |
| Google Cloud · Lyria 3 Pro / Clip | 최대 184초 / 30초 | 프리뷰 약관상 제작·상업 용도 사용 가능 | 광고용 최종본 (권리 확인이 가장 쉬움) |
| AI Studio · Lyria RealTime | 끝없이 스트리밍 | BPM(60~200 정수)·조성·밀도·밝기를 숫자로 고정, 연주곡 전용 | 템포·키가 정확한 반주 베드 |

### 공식 문서 기준으로 알아둘 한계

- **기본값이 보컬 곡입니다.** 프롬프트에 `Instrumental only, no vocals.`를 꼭 넣으세요.
- **네거티브 프롬프트와 시드가 없습니다.** 만든 곡을 대화로 고쳐 쓰는 기능도 없습니다. 바꾸고 싶으면 프롬프트를 고쳐 새로 생성합니다.
- **템포·키·구조·타임스탬프는 프롬프트 글로만 지정합니다.** `[0:00 - 0:02]`처럼 씁니다. "2초에 드롭" 같은 시점 지시는 **대략**만 따르므로, 같은 프롬프트로 3~4번 뽑아 가장 가까운 것을 고르세요. 정확한 정렬은 후반에서 합니다(5장).
- **특정 아티스트의 목소리나 기존 곡 가사를 요청하면 차단됩니다.** 이름 대신 소리를 묘사하세요.
- **모든 결과물에 SynthID 워터마크가 들어갑니다.**
- **광고에 쓸 최종본은 상업 이용 조건이 명시된 경로로 만드세요.** Google Cloud의 Lyria 3가 그런 경로입니다. Gemini 앱 결과물을 광고에 써도 되는지는 공개 문서에 분명하지 않으니, 쓰기 전에 그 서비스의 약관을 확인하세요.

### 권장 순서

1. 시안 5개를 앱이나 Clip(30초)으로 각 3~4번 생성해 방향을 고릅니다.
2. 고른 방향의 프롬프트를 다듬어 최종본을 WAV로 생성합니다(`lyria-3.5` 또는 Google Cloud).
3. 받은 WAV를 넘겨주세요. 템포·첫 강박·구간을 영상에 맞추고, 효과음을 새 음악의 키와 박자에 다시 맞춰 마스터링합니다(5장).

---

## 1. 이 쇼릴이 음악에 요구하는 것 (사운드 특징)

### 기술 스펙

| 항목 | 값 | 프롬프트에 쓰는 말 |
|---|---|---|
| 길이 | 27.0초 (30초로 받아서 자름) | `30 seconds` |
| 템포 | 128.57 BPM. 1박 = 14프레임 = 0.467초이고, 모든 장면 전환과 컷이 박에 떨어집니다 | `128 BPM` (받은 뒤 +0.45% 맞춤, 귀로는 구분 안 됨) |
| 박자 | 4/4, 128 BPM에서 한 마디 = 1.87초 | `steady 4/4` |
| 첫 강박 | 1.93초, 화면이 열리는 임팩트 | `big impact on the downbeat at 2 seconds` |
| 조성 | D단조(Dm–B♭–C–F 진행 계열), 마지막 로고에서 D장조로 해결 | `D minor, resolving to D major at the very end` |
| 보컬 | 없음 | `Instrumental only, no vocals.` |
| 음량 | 마스터 −14 LUFS / −1 dBTP (후반에서 맞춤) | 따로 쓰지 않음 |

### 장면 타임라인과 음악이 할 일

| 시간 | 장면 | 화면 | 음악이 할 일 |
|---|---|---|---|
| 0.0–1.9초 | 01 훅 | 흩어진 지점 노드들이 정렬되기 직전 | 어둡고 조용한 시작, 짧은 모티프, 임팩트 직전 한 박 숨 |
| **1.93초** | ★ 임팩트 | 카드 프레임이 풀 블리드로 열림 "하나의 기준." | 첫 강박, 큰 히트와 함께 드롭 |
| 1.9–8.9초 | ① 표준화 | 같은 인프라·수업·콘텐츠, 클로즈업 컷이 많음 | 앞으로 미는 그루브가 층층이 쌓임 (3.8초 피아노, 7.5초 클랩) |
| 8.93초 | ② 관리 | 2×2 관제판, 기능 4개 클로즈업 | 더 정밀하고 단단하게 (투비트 펄스, 스타카토) |
| **14.07초** | 인터루드 | 하드컷, 아이보리 종이 위 블록 스탬프 | 갑자기 가볍게: 마림바·피치카토 |
| 15.93초 | 브릿지 | "쌓인 데이터 위에서," | 숨 고르기: 지속음과 스웰 |
| **16.87초** | ★ AI 슬램 | AI가 터지며 등장 | 가장 큰 섹션 진입 (직전 0.1초 무음) |
| 16.9–21.1초 | ③ AI 강의평가 | 리포트 대시보드, 레이더 차트 | 최대 에너지, 합창이나 넓은 패드 |
| 21.07초 | ④ 가치 | 낭비 블록이 하나씩 빠짐 | 하프타임 긴장, 스네어 롤 빌드 |
| **22.47초** | ★ 해방 | ClassIn 블록 착지, 품질 블록이 쌓임 | 장조로 밝게 풀림 |
| 24.33초 | 엔드 | 로고 직전 | 짧은 텐션 |
| **24.8초** | ★ 로고 | ClassIn 로고 리빌 | 마지막 D장조 히트 (직전 0.1초 무음), 여운 |
| 27.0초 | 끝 | 카드 프레임이 닫힘 | 페이드 아웃 |

**숨은 규칙이 있습니다.** AI 슬램은 임팩트에서 정확히 32박(8마디), 해방은 44박(11마디) 뒤라 4/4 음악의 마디 경계에 자연스럽게 떨어집니다. 그래서 다음 네 지점만 잘 맞으면 나머지는 편집으로 맞출 수 있습니다.

- 2초 드롭
- 17초 두 번째 드롭
- 22.5초 해방
- 25초 마지막 히트

### 톤: 지킬 것과 피할 것

- **지킬 것**
  - 신뢰감, 무게감, 따뜻함, 고급스러움
  - 밝은 파스텔 화면에 어울리는 깨끗한 공간감
  - 숨(직전 무음) 뒤에 오는 큰 히트
  - 마지막의 장조 해결
- **피할 것**
  - 날카로운 신스 리드, 비프·글리치·틱 소리
  - 지나친 하이햇
  - 금속성 브람(braam), 덥스텝 워블
  - 보컬·허밍
  - 어린이 프로그램 같은 유치함
- **지금 버전 참고:** 펠트 피아노의 네 음 모티프(레–라–파–미)가 챕터마다 다른 악기로 돌아옵니다. 스트링·합창·호른·팀파니에 딥 킥과 웜 스네어를 얹은 시네마틱 하이브리드이고, 시안 A가 이 방향의 고급판입니다.

---

## 2. 시안 5개

| 시안 | 방향 | 한 줄 |
|---|---|---|
| A | 시네마틱 오케스트라 하이브리드 | 큰 기관이 믿고 맡길 만한 무게, 마지막에 장조로 풀림 |
| B | 프리미엄 미니멀 테크 | 신제품 키노트처럼 깨끗하고 정확함, 여백이 고급스러움 |
| C | 업리프팅 피아노 하우스 | 밝고 리드미컬, 박마다 킥이 전환을 끌고 감 |
| D | 따뜻한 어쿠스틱 퍼커시브 | 마림바·피치카토·핸드클랩, 똑똑하고 친근한 교실의 리듬 |
| E | 다크 → 라이트 하이브리드 트레일러 | 긴장에서 승리로, 행사 오프닝처럼 크지만 거칠지 않게 |

각 시안 안내 순서는 같습니다.

1. 영문 전체 프롬프트 (권장, 30초 타임스탬프 포함)
2. 앱에서 빠르게 쓰는 한국어 짧은 프롬프트
3. Lyria RealTime으로 베드를 뽑을 때의 설정값

### 시안 A · 시네마틱 오케스트라 하이브리드 (지금 방향의 고급판)

- **이럴 때 좋습니다.** 본사·대형 기관 대상 발표처럼 신뢰와 규모를 보여 줘야 할 때.
- **주의할 점.** 너무 비장해지면 교육 브랜드의 따뜻함이 사라집니다. 그래서 `warm`을 빼지 마세요.

```text
Cinematic orchestral hybrid score for a premium enterprise brand film. Instrumental only, no vocals. 128 BPM, steady 4/4, D minor, resolving to D major at the very end. 30 seconds.
Warm, weighty, confident and trustworthy, never harsh. Felt piano, a string section (driving spiccato and warm legato), soft French horns, timpani and low taiko, a deep round kick, warm snare, sub bass, a wordless choir pad and soft glass bell accents. A simple falling four-note piano motif (D, A, F, E) is the theme and returns on different instruments.
[0:00 - 0:02] Intro: a dark string drone and the felt-piano motif, a quick swell, then a breath of silence.
[0:02 - 0:09] A big orchestral impact on the downbeat at 2 seconds, then a driving groove: kick on every beat, spiccato strings, violins singing the motif. Piano joins at 4 seconds, claps at 7 seconds.
[0:09 - 0:14] Tighter and more precise: a two-beat pulse, staccato cellos, muted piano.
[0:14 - 0:16] Sudden lightness: soft marimba and pizzicato.
[0:16 - 0:17] A held chord and a choir swell, then one short breath of silence.
[0:17 - 0:21] The biggest section: full drums, choir, horns and bells.
[0:21 - 0:22] Half-time tension with a building snare roll.
[0:22 - 0:24] A bright, uplifting release at 22.5 seconds.
[0:24 - 0:30] A timpani roll, a breath of silence, then a final triumphant D major hit at 25 seconds that rings out and fades.
No vocals, no harsh synth leads, no glitch sounds.
```

앱용 한국어:

```text
대형 교육기관 브랜드 필름용 시네마틱 오케스트라 음악, 보컬 없는 연주곡, 30초. 128 BPM, D단조로 시작해 마지막에 D장조로 해결. 펠트 피아노의 네 음 모티프(레-라-파-미), 스트링 스피카토, 프렌치 호른, 팀파니, 합창 패드, 깊은 킥. 2초에 큰 임팩트, 17초에 가장 큰 클라이맥스, 22.5초에 밝게 풀리고, 25초에 승리감 있는 마지막 화음. 따뜻하고 무게감 있게, 날카로운 소리 없이.
```

RealTime: `bpm 128` · `scale F_MAJOR_D_MINOR` · `density 0.6` · `brightness 0.45` · `guidance 4.0`

| 가중 프롬프트 | 가중치 |
|---|---|
| Cinematic orchestral hybrid | 1.0 |
| Spiccato strings | 0.8 |
| Felt piano | 0.6 |
| Taiko drums | 0.4 |

피날레만 `D_MAJOR_B_MINOR`로 따로 뽑습니다. 조성을 바꾸면 RealTime 문맥을 초기화해야 하기 때문입니다.

### 시안 B · 프리미엄 미니멀 테크 (키노트 스타일)

- **이럴 때 좋습니다.** 밝은 파스텔 화면과 UI 클로즈업에 가장 잘 맞고, 기술 신뢰감을 줄 때.
- **주의할 점.** 너무 밋밋하면 임팩트와 AI 슬램이 약해집니다. 히트 지점을 꼭 적으세요.

```text
Premium minimal tech music for a product keynote film. Instrumental only, no vocals. 128 BPM, steady 4/4, D minor, ending on a warm D major chord. 30 seconds.
Clean, precise, airy and expensive-sounding: soft felt piano, muted synth plucks in tight sixteenth notes, a warm analog pad, deep clean sub bass, a soft round kick, gentle claps, a subtle tape texture and glassy bell accents. Lots of space; every element is precise and quietly confident. No harsh leads, no EDM drop.
[0:00 - 0:02] Intro: one soft piano chord and an airy reverse swell.
[0:02 - 0:09] A clean, punchy downbeat at 2 seconds; a precise plucked sixteenth-note pattern and a soft kick enter and build gently.
[0:09 - 0:14] Even more focused: a sub bass pulse and small piano chords.
[0:14 - 0:16] Light, playful marimba-like plucks.
[0:16 - 0:17] A held pad and a short pause.
[0:17 - 0:21] The fullest moment: wide pads, layered plucks, warm bass, claps on 2 and 4.
[0:21 - 0:22] The filter closes and tension rises.
[0:22 - 0:24] The filter opens at 22.5 seconds, bright and optimistic.
[0:24 - 0:30] A short pause, then a warm final D major chord at 25 seconds with a soft shimmer, fading out.
```

앱용 한국어:

```text
제품 키노트 영상용 프리미엄 미니멀 테크 음악, 보컬 없는 연주곡, 30초. 128 BPM, D단조, 마지막은 따뜻한 D장조 화음. 펠트 피아노, 16분음표로 정확하게 뜯는 뮤트 신스 플럭, 따뜻한 패드, 깨끗한 서브 베이스, 부드러운 킥과 클랩. 여백이 많고 정확하고 고급스럽게. 2초에 깨끗한 첫 박, 17초에 가장 풍성하게, 25초에 마지막 화음.
```

RealTime: `bpm 128` · `scale F_MAJOR_D_MINOR` · `density 0.45` · `brightness 0.6`

| 가중 프롬프트 | 가중치 |
|---|---|
| Minimal tech | 1.0 |
| Muted synth plucks | 0.8 |
| Felt piano | 0.6 |
| Deep sub bass | 0.5 |

### 시안 C · 업리프팅 피아노 하우스 (에너지형)

- **이럴 때 좋습니다.** SNS·숏폼, 박람회 부스 루프 영상처럼 젊은 톤이 필요할 때.
- **주의할 점.** 기업 신뢰감보다 '신남'이 앞설 수 있습니다. 하이햇과 리드가 가벼워지지 않게 하세요.

```text
Uplifting modern piano house for an energetic tech brand spot. Instrumental only, no vocals. 128 BPM, four-on-the-floor, D minor turning to a bright D major finish. 30 seconds.
Optimistic, catchy and polished: piano house chords, plucky synth stabs, a warm rolling bass, clean claps, shakers, soft white-noise risers and a short hook played on a bright pluck synth. Full but not harsh: no screaming leads, no aggressive hi-hats.
[0:00 - 0:02] Intro: filtered piano chords and a riser.
[0:02 - 0:09] The drop at 2 seconds: a full groove with piano chords on the off-beats.
[0:09 - 0:14] A bass-led groove, chords slightly filtered.
[0:14 - 0:16] Breakdown: plucks only.
[0:16 - 0:17] A snare build into one beat of silence.
[0:17 - 0:21] A second drop at 17 seconds, the biggest energy, the hook on top.
[0:21 - 0:22] The kick drops out and a snare roll builds.
[0:22 - 0:24] A euphoric lift at 22.5 seconds.
[0:24 - 0:30] A final big chord stab at 25 seconds with a long reverb tail.
```

앱용 한국어:

```text
테크 브랜드 광고용 밝은 피아노 하우스, 보컬 없는 연주곡, 30초. 128 BPM 포 온 더 플로어, D단조에서 마지막엔 밝은 D장조. 피아노 하우스 코드, 플럭 신스, 따뜻한 베이스, 깨끗한 클랩과 셰이커, 부드러운 라이저. 2초에 드롭, 17초에 두 번째 드롭(가장 크게), 22.5초에 다시 끌어올리고, 25초에 마지막 코드. 신나지만 날카롭지 않게.
```

RealTime: `bpm 128` · `scale F_MAJOR_D_MINOR` · `density 0.75` · `brightness 0.7`

| 가중 프롬프트 | 가중치 |
|---|---|
| Piano house | 1.0 |
| Four on the floor | 0.8 |
| Pluck synth | 0.6 |

### 시안 D · 따뜻한 어쿠스틱 퍼커시브 (교육 브랜드)

- **이럴 때 좋습니다.** 수업·선생님·학생의 따뜻함을 강조할 때. 종이와 스탬프가 나오는 인터루드와 특히 잘 맞습니다.
- **주의할 점.** 유치해지지 않게 `confident, never childish`를 지키세요.

```text
Warm, bright acoustic-percussive score for a smart education brand film. Instrumental only, no vocals. 128 BPM, steady 4/4, D minor, ending happily in D major. 30 seconds.
Human, friendly, clever and precise: marimba and kalimba patterns, pizzicato strings, nylon-string guitar plucks, glockenspiel, upright bass, hand claps, shakers, a soft kick drum and a little felt piano. Playful but confident, never childish.
[0:00 - 0:02] Intro: a ticking pizzicato pulse and a marimba motif.
[0:02 - 0:09] A full, warm groove from the downbeat at 2 seconds: claps, shaker, bass and a marimba counter-melody.
[0:09 - 0:14] Tighter: a pizzicato ostinato and soft percussion.
[0:14 - 0:16] Solo marimba and glockenspiel, very light.
[0:16 - 0:17] A short breath.
[0:17 - 0:21] The fullest section: strings, claps and a glockenspiel melody.
[0:21 - 0:22] Building pizzicato tension.
[0:22 - 0:24] A bright, joyful release at 22.5 seconds.
[0:24 - 0:30] A final D major chord at 25 seconds with a glockenspiel sparkle, ringing out.
```

앱용 한국어:

```text
교육 브랜드 필름용 따뜻한 어쿠스틱 퍼커시브 음악, 보컬 없는 연주곡, 30초. 128 BPM, D단조, 마지막은 밝은 D장조. 마림바, 칼림바, 피치카토 스트링, 나일론 기타, 글로켄슈필, 핸드클랩, 셰이커. 친근하고 똑똑하게, 유치하지 않게. 2초에 그루브 시작, 14초에 마림바만 남아 가볍게, 17초에 가장 풍성하게, 25초에 반짝이는 마지막 화음.
```

RealTime: `bpm 128` · `scale F_MAJOR_D_MINOR` · `density 0.55` · `brightness 0.65`

| 가중 프롬프트 | 가중치 |
|---|---|
| Marimba | 1.0 |
| Pizzicato strings | 0.8 |
| Hand claps | 0.5 |
| Glockenspiel | 0.4 |

### 시안 E · 다크 → 라이트 하이브리드 트레일러 (임팩트형)

- **이럴 때 좋습니다.** 컨퍼런스·설명회 오프닝처럼 큰 화면에서 틀 때.
- **주의할 점.** 다섯 시안 중 가장 무겁고 어둡습니다. 밝은 화면과의 대비가 크고, 교육 브랜드에는 과할 수 있습니다.

```text
Modern hybrid trailer music for a tech keynote opener. Instrumental only, no vocals. 128 BPM, steady 4/4, D minor, ending on a powerful D major chord. 30 seconds.
From tension to triumph: a pulsing low synth ostinato, ticking clock-like sixteenth notes, deep cinematic hits (soft and round, not harsh), big taiko drums, driving string ostinatos, a rising synth arpeggio, and heroic brass and choir in the final section. Weighty and premium; no screeching, no metallic braams, no dubstep.
[0:00 - 0:02] Intro: a ticking pulse and a low swell, cut to silence just before 2 seconds.
[0:02 - 0:09] A massive hit on the downbeat at 2 seconds; a driving string ostinato and taiko.
[0:09 - 0:14] A precise, mechanical pulse that keeps building.
[0:14 - 0:16] A sudden drop to a light, curious arpeggio.
[0:16 - 0:17] A rising reverse swell into silence.
[0:17 - 0:21] Huge: full drums, choir, brass and the arpeggio.
[0:21 - 0:22] Ticking tension; everything pulls back.
[0:22 - 0:24] A heroic release in major at 22.5 seconds.
[0:24 - 0:30] A final huge D major hit with timpani at 25 seconds and a long ring-out.
```

앱용 한국어:

```text
테크 키노트 오프닝용 하이브리드 트레일러 음악, 보컬 없는 연주곡, 30초. 128 BPM, D단조, 마지막은 힘찬 D장조. 낮은 신스 펄스, 시계 같은 16분음표, 묵직하지만 둥근 시네마틱 히트, 타이코, 스트링 오스티나토, 상승하는 아르페지오, 후반엔 브라스와 합창. 2초 직전 무음 후 거대한 히트, 17초에 가장 크게, 22.5초에 영웅적으로 풀리고, 25초에 마지막 히트. 금속성 브람이나 날카로운 소리 없이.
```

RealTime: `bpm 128` · `scale F_MAJOR_D_MINOR` · `density 0.7` · `brightness 0.4`

| 가중 프롬프트 | 가중치 |
|---|---|
| Hybrid trailer | 1.0 |
| String ostinato | 0.8 |
| Taiko drums | 0.6 |
| Low synth pulse | 0.5 |

### 영상·이미지를 함께 넣기

- **Gemini 앱:** 위 프롬프트와 함께 프리뷰 영상(`preview/classin-showreel-preview.mp4`)이나 참고 이미지를 첨부하면, 화면 분위기를 읽어 반영합니다(출시 안내 기준). 참고 이미지는 `audio/gemini-refs/` 아래 6장입니다: 임팩트, 같은 수업, 인터루드, AI, 가치, 로고.
- **API:** 이미지를 최대 10장까지 붙일 수 있으니 `audio/gemini-refs/*.jpg` 6장을 같이 넣으세요. Lyria 모델 자체는 영상을 받지 않으므로, 영상은 분위기 참고용입니다.
- **주의:** 밝은 파스텔 화면은 모델을 '가볍고 귀여운' 쪽으로 끌 수 있습니다. 이미지를 넣을 때도 프롬프트의 `weighty`, `confident` 같은 말은 남겨 두세요.

### 프롬프트를 고칠 때

- **장르를 맨 앞에 둡니다.** 악기는 원하는 것만 적어도 됩니다. 나머지는 장르에 맞게 Lyria가 고릅니다.
- **템포와 키는 숫자로 씁니다.** 예: `128 BPM, D minor`.
- **소리가 너무 밝거나 가벼우면** `warm, weighty, deep, round`를 더하고, 고음 악기(글로켄슈필·플럭)를 줄입니다.
- **히트가 약하면** 그 줄에 `massive`, `a breath of silence just before`를 더합니다.
- **같은 프롬프트로 3~4번 뽑아 비교합니다.** 같은 문장이어도 매번 다르게 나옵니다.

---

## 3. 편집용 조각 프롬프트 (선택)

타임스탬프가 잘 안 지켜지면, 구간별 조각을 따로 뽑아 마디 경계에서 이어 붙이는 쪽이 확실합니다. `[INSTRUMENTS]` 자리에 고른 시안의 악기 문장을 그대로 붙이세요.

메인 베드 (30초, 처음부터 끝까지 같은 에너지, 편집 재료):

```text
[GENRE OF THE CHOSEN DIRECTION], instrumental only, no vocals. 128 BPM, steady 4/4, D minor. 30 seconds. [INSTRUMENTS]. A steady loop with the same energy from start to end: no intro, no breakdown, no ending. Clear downbeats, consistent groove.
```

인트로 → 드롭 (앞 2초가 조용하고, 2초에 첫 강박):

```text
[GENRE], instrumental only, no vocals. 128 BPM, D minor. 30 seconds. [INSTRUMENTS]. Starts almost silent with a soft motif and a rising swell, a breath of silence just before 2 seconds, then a big impact on the downbeat at 2 seconds and a full groove until the end.
```

인터루드 (가볍게 바뀌는 4박):

```text
Light, playful marimba and pizzicato interlude, instrumental only, no vocals. 128 BPM, F major. 30 seconds. Dry wooden mallets, soft hand claps, a tiny glockenspiel pickup. Bright and clever, never childish.
```

피날레 스팅어 (로고):

```text
[GENRE], instrumental only, no vocals. 128 BPM. 30 seconds. A short building roll on an A major chord, one breath of silence, then a single huge, warm D major final chord at 2 seconds with strings, brass, choir and a bell shimmer, ringing out slowly to silence.
```

---

## 4. 효과음은?

- **Lyria는 음악 모델이라, 효과음만 따로 정밀하게 뽑는 기능은 없습니다.** 곡 안에 `sound of rain` 같은 질감을 섞는 정도만 됩니다.
- **지금 효과음 54종은 그대로 쓰는 것을 권합니다.** 화면의 컷과 전환에 맞춰 합성되고, 이미 16분음표 그리드와 그 순간의 코드에 맞춰져 있습니다. Gemini 음악으로 바꿔도 새 음악의 키와 템포로 다시 생성하면 됩니다(5장).

| 무리 | 소리 | 위치 |
|---|---|---|
| 히트 | 오케스트라 붐 4종(그 순간 코드로 스탭), 텍스트 슬램 '쿵' | 1.93초, 16.87초, 22.47초, 24.8초 |
| 스웰 | 히트 직전에 숨을 들이쉬는 리버스 스웰 3종 | 임팩트·AI 슬램·로고 직전 |
| 전환 | 줌, 푸시, 아이리스, 와이프, 윕, 딥 | 장면 전환 6곳 |
| 컷 | 클로즈업 포커스 풀(16분음표 길이) | 클로즈업 컷 10곳 |
| UI | 펠트 말렛 탭, 벨, 체크 사다리, 그리드 채움 | 코드음을 타고 오름, 점8분 에코 |
| 폴리 | 자물쇠, 차단, 녹화, 블록 적재, 마커 판서, 종이, 도장 | ② 관리 · 인터루드 |
| 가치 장면 | 블록이 빠지는 스와이프 4개, 블록 착지 '톡' 4개 | 21.8~23.4초 |

---

## 5. 받은 음악을 영상에 맞추는 법

**넘겨주실 것**
- WAV 원본. MP3라면 192 kbps 이상.
- 여러 테이크가 있으면 전부. 비교해서 고르겠습니다.

**제가 할 일**
1. **템포와 첫 강박을 맞춥니다.** 박자를 측정해 128.57 BPM으로 미세 조정하고(128 BPM이면 +0.45%, 귀로는 구분 안 됨), 첫 강박을 1.93초에 정렬합니다.
2. **구간을 편집합니다.** 2초·17초·22.5초·25초 히트가 화면과 어긋나면 마디 경계에서 자르고 이어 맞춥니다. 큰 히트 직전에는 0.1초 숨을 둡니다.
3. **효과음을 다시 맞춥니다.** 새 음악의 키와 코드 진행을 분석해, 효과음의 음정과 박자 그리드를 다시 생성합니다.
4. **마무리합니다.** 마스터링(−14 LUFS / −1 dBTP) 후 프리뷰와 마스터를 렌더합니다.

---

## 출처

- [Use Lyria 3 to create music tracks in the Gemini app (Google 블로그)](https://blog.google/innovation-and-ai/products/gemini-app/lyria-3/)
- [Generate music with Lyria (Gemini API)](https://ai.google.dev/gemini-api/docs/music-generation)
- [Lyria prompt guide (AI Studio)](https://aistudio.google.com/docs/lyria-prompt-guide)
- [Lyria 3 (Google Cloud): 모델, 길이, 상업 이용 조건](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/lyria/lyria-3)
- [Lyria RealTime 실시간 음악 생성 (Gemini API)](https://ai.google.dev/gemini-api/docs/realtime-music-generation)
- [Lyria 3 Pro 앱 출시와 요금제별 한도 (Android Authority)](https://www.androidauthority.com/gemini-lyria-3-pro-rollout-3652057)
