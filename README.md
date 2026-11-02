# CREAM’S AEGIS — 신무협 프로젝트

**현재 정본:** 2026-11-02 기준 v0.2.0 / 문파·심법 중심 구조 개편 D-038~D-041.

CREAM’S AEGIS는 선택의 결과가 동료와 세력, 지역에 오래 남는 싱글플레이 무협 다크판타지 RPG입니다.
- 웹게임: 이전 D-001의 아이폰용 오프라인 지향 버전 보존(계속된 개발 목표)
- 채팅 캠페인: D-037에 따라 ChatGPT에서 플레이하고 GitHub를 설정·서사·상태 외부 원장으로 활용
- 최신 구조: **고정 5직업 대신 사문·교단·독행의 수련 경로를 선택하고 심법을 중심으로 비기를 익힘**
- 아직 최종 전투 수치/무공 밸런스와 개별 문파 명단은 승인되지 않음.

## 1. 권위 문서: 실제로 확정된 내용

1. [MASTER_CANON.md](MASTER_CANON.md) — 정본 헌법/게임 구조. **최신 개정 D-038~D-041을 먼저 읽을 것**.
2. [DECISION_LOG.md](DECISION_LOG.md) — 모든 결정의 승인·변경 이력. 기존 5직업 D-031~D-036과 새 규칙의 효력 표 포함.
3. [GAME_RULES.md](GAME_RULES.md) — 채팅 캠페인 수치·기존 v10 기준·새 문파 운영 원칙.
4. [CHAT_CAMPAIGN_PROTOCOL.md](CHAT_CAMPAIGN_PROTOCOL.md) — 실제 GitHub 체크포인트 동기화 절차.

**주의:** 위 문서의 CONFIRMED 부분과 아래 설계 문서의 PROPOSED 세부치를 혼동하지 않습니다.

## 2. 무협 2.0 설계서

- [rules/CULTIVATION_SYSTEM_V1.md](rules/CULTIVATION_SYSTEM_V1.md) — 선천 재능·심법·내공·비기. **구조 확정, 구체 명칭/효과 후보**.
- [world/SECT_ATLAS_V1.md](world/SECT_ATLAS_V1.md) — 정파·사파·천마신교·세외·독행 조직. **개별 명단 미확정 후보**.
- [rules/CHARACTER_CREATION_V2.md](rules/CHARACTER_CREATION_V2.md) — 문파/무문파 선택·출신·전수·현재 캐릭터 호환 절차.
- [tests/SECT_REFORM_VALIDATION.md](tests/SECT_REFORM_VALIDATION.md) — 정본 구조 16개 검사 통과, 150개 조합 구성 확인. **전투 밸런스 검증과 구분**.

## 3. 진행 중인 채팅 캠페인

- [CAMPAIGN_STATE.json](CAMPAIGN_STATE.json) — 마지막으로 **실제 저장된** 캐릭터/세계 상태.
- [STORY_LEDGER.md](STORY_LEDGER.md) — 과거 선택, 증인, 소지품, 기억 상실, 미회수 복선.
- 기존 REBIRTH 프롤로그는 종료, **Lv.2/270XP/HP23/SP8/MP12**를 보존.
- 현재 캐릭터의 종족·선천 재능·사문·활성 심법·10슬롯은 **아직 플레이어가 선택하지 않았으므로 UNKNOWN**.
- 제1장 다음 선택, 무공 전수, 새로운 난수 결과는 아직 진행되지 않았습니다.

## 4. 과거 설계자료 및 상태

- [WEB_ENGINE_RULES.md](WEB_ENGINE_RULES.md) — v10의 2차 요약·웹엔진 초안. 원문 자체와 대조 필요.
- [proposals/STATS_SKILLS_V1.md](proposals/STATS_SKILLS_V1.md) — 과거 5직업 공격·방어 스킬/자원 계산. **현 정본으로 채택하지 않음**.
- [proposals/MARTIAL_ARTS_DESIGN_GATE_V1.md](proposals/MARTIAL_ARTS_DESIGN_GATE_V1.md) — 무공 전술의 재미·연계·대응 구분을 위한 검증 기준.
- [proposals/MARTIAL_SECT_INNER_ARTS_V1.md](proposals/MARTIAL_SECT_INNER_ARTS_V1.md) — 최신 개편 직전의 발상 초안. 신무협 2.0 문서가 우선.

## 5. 다음 개발 순서

1. 재능 등급을 선택/판정하는 방법, 심법 품질·숙련 등급 표 및 시작 특혜 **구체 승인**.
2. 대표 문파·세외·무문파 출발 경로별 심법과 비기 완전 명세 작성.
3. 27PB/10슬롯/XP/HP·SP·MP 호환성 및 동료·전투 규칙 전수 검증.
4. 실제 채팅 캠페인 캐릭터 선택·심법 전수 후 제1장 진행, 챕터 중간 체크포인트 동기화.

이 저장소는 현재 **Public**이므로 게임 세계의 허구 데이터만 저장합니다. 현실 개인정보나 비밀은 업로드하지 않습니다.

## 6. 첫 문파·무공 실험 패키지 (2026-11-02 / PROPOSED)

- [시작 경로·심법·무공 11종 경로 데이터](game_data/SECT_STARTER_PACK_V1.json): 시작 11경로, Lv.1 기술 110개와 Lv.3 후보 11개. 계열별 전용 전투 토큰·비전 심법 관문.
- [11개 문파/독행 도입 장면](game_data/SECT_INTRO_SCENES_V1.json): 시작 이야기 11개, 선택지 33개, 5재능×11경로 오버레이 55개.
- **정적 무결성 감사:** 27개 항목 검사 통과(검사 시점의 원본 데이터를 재조회하여 슬롯·ID·관문·세이브 불변성 확인).
- **미검증:** 엔진을 통한 효과 실행/실전 전투 승률/레벨 고도화/출판 유사성. 효과·명칭·구체 수치는 공식 정본으로 자동 승인하지 않음.
- 현재 CAMPAIGN_STATE.json은 그대로이며 어떤 문파·재능·비기도 주인공에게 자동 지급하지 않았다.

