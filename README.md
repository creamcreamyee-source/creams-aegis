# CREAM’S AEGIS — 신무협 프로젝트

**현재 정본:** 2026-11-02 기준 v0.3.0 / 문파·심법 중심 D-038~D-041 + 기존 세이브 초기화 D-042 + 성장 독립 원장 D-043.

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

## 3. 새 캐릭터 시작 준비 — 현재 캐릭터 0개

- [CAMPAIGN_REGISTRY.json](CAMPAIGN_REGISTRY.json): 세션 등록부. 현재 **활성 세션 없음 / 캐릭터 0개**.
- 기존 REBIRTH·천마신교 시연의 캐릭터별 세이브·서사·성장 원장은 현재 브랜치에서 삭제됨. 과거 플레이 기록은 Git 커밋 이력에 남을 수 있음.
- 다음 플레이는 종족·재능·출신·사문/독행·27 Point Buy·핵심 심법·시작 기술 10슬롯을 **전부 새로 선택**한다.
- 새로운 세이브는 새 캠페인 생성 후 `sessions/<NEW_ID>.json`, `sessions/<NEW_ID>_LEDGER.md`로 만든다.
- [PLAY_FROM_CHAT.md](PLAY_FROM_CHAT.md): 신규 플레이·재개·체크포인트 저장 절차.

## 4. 과거 설계자료 및 상태

- [WEB_ENGINE_RULES.md](WEB_ENGINE_RULES.md) — v10의 2차 요약·웹엔진 초안. 원문 자체와 대조 필요.
- [proposals/STATS_SKILLS_V1.md](proposals/STATS_SKILLS_V1.md) — 과거 5직업 공격·방어 스킬/자원 계산. **현 정본으로 채택하지 않음**.
- [proposals/MARTIAL_ARTS_DESIGN_GATE_V1.md](proposals/MARTIAL_ARTS_DESIGN_GATE_V1.md) — 무공 전술의 재미·연계·대응 구분을 위한 검증 기준.
- [proposals/MARTIAL_SECT_INNER_ARTS_V1.md](proposals/MARTIAL_SECT_INNER_ARTS_V1.md) — 최신 개편 직전의 발상 초안. 신무협 2.0 문서가 우선.

## 5. 다음 개발 순서

- [rules/CHARACTER_GROWTH_V2.md](rules/CHARACTER_GROWTH_V2.md): 레벨·성장 선택·심공·경지 분리 운영 원칙.
- [game_engine/growth_reducer.js](game_engine/growth_reducer.js): XP·레벨 보상 선택권·중복 지급 제어 엔진.
- [game_data/PROGRESSION_TABLE_V1.json](game_data/PROGRESSION_TABLE_V1.json): Lv1~12 성장 보상 데이터.

1. 재능 등급을 선택/판정하는 방법, 심법 품질·숙련 등급 표 및 시작 특혜 **구체 승인**.
2. 대표 문파·세외·무문파 출발 경로별 심법과 비기 완전 명세 작성.
3. 27PB/10슬롯/XP/HP·SP·MP 호환성 및 동료·전투 규칙 전수 검증.
4. 신규 캐릭터 생성부터 새 캠페인의 제1장으로 진행, 중요한 선택·성장마다 GitHub 체크포인트 검증.

이 저장소는 현재 **Public**이므로 게임 세계의 허구 데이터만 저장합니다. 현실 개인정보나 비밀은 업로드하지 않습니다.

## 6. 첫 문파·무공 실험 패키지 (2026-11-02 / PROPOSED)

- [시작 경로·심법·무공 11종 경로 데이터](game_data/SECT_STARTER_PACK_V1.json): 시작 11경로, Lv.1 기술 110개와 Lv.3 후보 11개. 계열별 전용 전투 토큰·비전 심법 관문.
- [11개 문파/독행 도입 장면](game_data/SECT_INTRO_SCENES_V1.json): 시작 이야기 11개, 선택지 33개, 5재능×11경로 오버레이 55개.
- **정적 무결성 감사:** 27개 항목 검사 통과(검사 시점의 원본 데이터를 재조회하여 슬롯·ID·관문·세이브 불변성 확인).
- **미검증:** 엔진을 통한 효과 실행/실전 전투 승률/레벨 고도화/출판 유사성. 효과·명칭·구체 수치는 공식 정본으로 자동 승인하지 않음.
- 현재 캐릭터 0명. 삭제된 옛 세이브를 새로운 캐릭터에 이식하지 않는다.

## 7. 신규 캐릭터·성장 시스템 (2026-11-02)

- [캐릭터 성장 운영 명세 v3.0](rules/CHARACTER_GROWTH_V2.md): 레벨·재능·심법·내공·무공·경지·사회적 성장의 분리.
- [누적 XP 및 보상](game_data/PROGRESSION_TABLE_V1.json): Lv1~12 확정 기준(v10 2차 정리).
- [실험 성장 수치 후보](game_data/GROWTH_EXPERIMENT_V1.json): HP/MP/SP·수련·재능 계수·20장 페이싱. **아직 정본 수치가 아님**.
- [경험치·성장 보상 엔진](game_engine/growth_reducer.js): Lv1 스타터 선택권, 보상 중복·전투 종료·대기/완료 분리.
- [심법·경지 수련 엔진](game_engine/cultivation_reducer.js): 구결 접근/운기/숙련/돌파, 재능 고정, 이벤트 중복 제어.
- [새 캐릭터 생성 빌더](game_engine/character_builder.js): 27PB·시작10슬롯·11경로×5재능 검증 및 실험 자원 상한.
- [성장 통합 회귀 검사](tests/GROWTH_V2_TEST.js): 53개 실행 테스트, 165개 새 인물 조합 통과.
- **캐릭터 0명 / 활성 세션 없음.** 새 세이브는 신규 캐릭터 생성 후에만 GitHub에 추가.

## 8. A안 — 실전 플레이 우선형 초기 게임 (2026-11-02)

- [실전 운영 규칙](rules/PLAY_FIRST_CORE_V1.md): Lv1~3 문파 입교·심법 수련·d20·자원·퇴각·교섭·저장.
- [전투 계산 엔진](game_engine/combat_v1.js): 11개 무학의 주행동·추가행동·반응, SP/MP, 사거리, 동료 호위, 전투 결과.
- [실제 배운 무공만 허용](game_engine/campaign_battle_gate_v1.js): 전수/심법 활성 검증 및 상태 체크포인트 생성.
- [신규 캐릭터 세션 생성](game_engine/session_bootstrap_v1.js): 플레이어 확정 후 Lv1 새 캐릭터만 준비.
- [초반 적/입문 대련 카드](game_data/STARTER_ENCOUNTERS_V1.json): 난도별 7개 시험 시나리오.
- [실행 회귀 테스트](tests/COMBAT_V1_TEST.js): **44/44 통과, 11,000회** 초기 전투 샘플.
- [검증 보고서](tests/PLAY_FIRST_VALIDATION_V1.md): 성장 53/53, 신규 생성 165 조합, 전투/수련 연결과 남은 한계.
- **현재 정식 캐릭터 0명.** 정본 D-038~D-043 유지, 새 수치는 실험값이며 플레이어가 새 캐릭터를 확정하기 전 옛 세이브가 부활하지 않는다.
