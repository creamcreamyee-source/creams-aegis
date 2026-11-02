# CREAM’S AEGIS — 채팅 플레이 및 GitHub 새 캐릭터 저장

- 초기화: 2026-11-02
- 현재: **등록된 캐릭터 0명, 활성 세션 없음.**
- 삭제된 과거 REBIRTH/천마신교의 캐릭터별 세이브·서사·성장 자료는 자동으로 불러오지 않는다.

## 실제 신규 플레이

1. GitHub `CAMPAIGN_REGISTRY.json`을 읽고 빈 세션임을 확인한다.
2. `MASTER_CANON.md`/`DECISION_LOG.md`/`GAME_RULES.md`/`rules/CHARACTER_CREATION_V2.md`/`rules/CHARACTER_GROWTH_V2.md`를 확인한다.
3. 사용자가 새 인물의 종족·출신·선천 재능·사문/독행·27PB·핵심 심법·기술 10슬롯을 설정한다.
4. 캐릭터를 실제로 확정하면 새 ID의 `sessions/<NEW_ID>.json`와 `sessions/<NEW_ID>_LEDGER.md`를 생성하고 `CAMPAIGN_REGISTRY.json`에 등록한다. **새 캐릭터 생성 없이 기존 장면을 이어가지 않는다.**
5. 주요 결정/전투/성장/심법 수련/챕터 종료 시 SHA 충돌 검사 후 파일 갱신·GitHub 재조회. 모두 검증될 때만 동기화 성공을 선언한다.

## 성장

- `game_data/PROGRESSION_TABLE_V1.json`: Lv1~12 누적 XP, 성장 보상 유형.
- `game_engine/growth_reducer.js`: XP 중복 방지·전투 종료 반영·선택 대기 관리.
- `rules/CHARACTER_GROWTH_V2.md`: 레벨 / 심법 숙련 / 내공 / 무공 / 경지 / 문파 신뢰의 분리.
- 상세 공격력·회복·내공 성장 수치는 승인과 밸런스 시험이 끝날 때까지 실험안으로만 적용.

## 한계

- GitHub 도구를 **호출할 때만** 저장 가능; 백그라운드·웹게임과의 실시간 자동 동기화는 아님.
- 현재 저장소는 Public. 실제 개인정보·비밀 기록 금지.
- 현재 브랜치에서 삭제한 파일은 Git 과거 커밋에는 남을 수 있다.

**새 게임 명령:** “CREAM’S AEGIS 새 캐릭터 시작”.
