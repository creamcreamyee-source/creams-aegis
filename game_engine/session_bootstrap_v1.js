/* CREAM'S AEGIS — new wuxia campaign bootstrap (no network/storage)
 * Generates an uncommitted new session and ledger. GitHub host must commit and reread.
 * No legacy character or past story data is read.
 */
(function(root,factory){
 "use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else if(root)root.AEGIS_SESSION_BOOTSTRAP=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const RACES=["human","wild","arcane"],SCHEMA=1;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function check(b,msg){if(!b)throw new Error(msg);}
 function build(input){
   const {selection,registry,starterPack,introPack,builder,growth,cultivation}=input||{};
   check(registry&&Array.isArray(registry.sessions)&&registry.sessions.length===0&&!registry.active_session_id,
     "start from empty registry; never merge a legacy character");
   check(selection&&typeof selection==="object","user-confirmed character required");
   check(typeof selection.sessionId==="string"&&/^AEGIS_[A-Z0-9_-]{6,30}$/.test(selection.sessionId),"valid new session ID required");
   check(RACES.includes(selection.raceType),"raceType must match one of three types");
   check(selection.confirmedByPlayer===true,"explicit player confirmation required");
   check(selection.numericRuleStatus==="EXPERIMENTAL_V1","experimental rules must be acknowledged");
   const path=starterPack.paths.find(x=>x.id===selection.pathId);
   check(path,"selected sect path absent");
   const intro=introPack.scenes.find(x=>x.path_id===selection.pathId);
   check(intro,"selected introduction absent");
   const draft=builder.draft({characterName:selection.characterName,raceType:selection.raceType,
     origin:selection.origin,pathId:selection.pathId,talentId:selection.talentId,
     abilityScores:selection.abilityScores,level:1,xp:0},starterPack,growth);
   const talentName=({ordinary:"범재",promising:"수재",gifted:"천재",monster:"괴물",transcendent:"초월"})[selection.talentId];
   const overlay=intro.talent_overlay_by_rank.find(o=>o.rank===talentName);
   check(overlay&&overlay.guaranteed_manuscript_id===draft.cultivationSelection.entitlementArtId,
     "talent overlay and manuscript mismatch");
   const trained=cultivation.init({xp:0,character:{talentId:selection.talentId},growth:draft.growth});
   const state={
     schema_version:SCHEMA,session_id:selection.sessionId,kind:"NEW_OFFICIAL_CHAT_CAMPAIGN",
     mode:"CHAT_CAMPAIGN",rule_status:"EXPERIMENTAL_NUMERICS_NOT_CANON",
     numeric_rules_snapshot:"game_data/GROWTH_EXPERIMENT_V1.json (version at creation; change requires explicit migration)",
     canonical_decisions:["D-038","D-039","D-040","D-041","D-042","D-043"],
     checkpoint:{chapter:1,scene_id:intro.id,scene_title:intro.title,phase:"INTRO_AWAITING_FIRST_USER_CHOICE",
       revision:0,last_committed_event_id:"CHARACTER_CREATION",
       pending_choices:intro.choice_set.map(x=>({id:x.id,label:x.label})),in_world_minutes:0},
     character:{
       name:draft.character.name,raceType:draft.character.raceType,
       raceOfficialNameStatus:"PROPOSED_TYPE_LABEL",origin:draft.character.origin,
       talentId:draft.character.talentId,talentName,sectPathId:selection.pathId,
       sectNameCandidate:path.name,sectStatus:selection.pathId==="wanderer"?"UNAFFILIATED_WANDERER":"ENTRY_CANDIDATE",currentAffiliation:null,
       abilities:draft.character.abilities,abilityMods:draft.character.abilityMods,
       level:1,xp:0,hp:draft.character.HP,sp:draft.character.SP,mp:draft.character.MP,
       resourceCaps:draft.character.resourceCaps,resourceStatus:"EXPERIMENTAL_V1",
       trainedDisciplines:[],knownTechniqueIds:[],
       starterLoadoutProposed:clone(path.starter_loadout),
       loadoutStatus:"TEN_SLOTS_RESERVED_PENDING_REAL_TRAINING",
       uniqueTalentRights:clone(overlay),activeHeartArtId:null},
     growth:trained.growth,
     story:{eventIds:["CHARACTER_CREATION"],relationships:[],npcKnowledge:[],
       irreversibleCosts:[],clues:[],inventory:[],openThreads:selection.pathId==="wanderer"?["고비급의 출처","비전 심법 첫 관문","순례자의 정체"]:["입문 시험","심법 첫 관문","사부/기연 정체"]},
     run:{combatStarted:false,synchronized:false,lastVerifiedSha:null}
   };
   check(state.growth.pendingGrowth.some(x=>x.level===1&&x.rewardType==="STARTER_10_SLOTS"),
     "Lv1 starting slots pending missing");
   check(state.growth.cultivation.heartArtId===null,"no automatic advanced heart activation");
   const ledger=[
     "# CREAM’S AEGIS — 신규 캠페인 "+selection.sessionId,
     "",
     "- 상태: 신규 캐릭터 생성 완료 / 첫 독행·입교 장면 선택 미진행.",
     "- 규칙: D-038~D-043, 현재 수치 [EXPERIMENTAL_V1].",
     "- 인물: "+state.character.name+" / "+talentName+" / "+path.name+" / Lv1·XP0.",
     "- 비급: "+draft.cultivationSelection.entitlementArtId+" 첫 관문 접근 후보. 실제 전수·운기 미실행.",
     "- 시작 기술: 10슬롯 후보. 실제 수련 완료 전 기술 자동 습득 없음.",
     "- 첫 장면: "+intro.id+" — "+intro.title+". 플레이어 선택 미진행.",
     "- 이전 REBIRTH·천마신교 시연 캐릭터의 설정과 NPC 이력은 계승하지 않음.",
     "- CHARACTER_CREATION: 플레이어가 실제 선택한 내용만 기록.",""
   ].join("\n");
   const nextRegistry=clone(registry);
   check(!nextRegistry.sessions.some(x=>x.id===selection.sessionId),"session ID reused");
   nextRegistry.sessions.push({id:selection.sessionId,kind:"OFFICIAL_CHAT_CAMPAIGN",
     status:"INTRO_AWAITING_FIRST_CHOICE",state_path:"sessions/"+selection.sessionId+".json",
     ledger_path:"sessions/"+selection.sessionId+"_LEDGER.md",phase:"INTRO",last_known_checkpoint:intro.id});
   nextRegistry.active_session_id=selection.sessionId;
   nextRegistry.last_interactive_session_id=selection.sessionId;
   return {state,ledger,registry:nextRegistry,intro:clone(intro),
     preview:{name:state.character.name,heartAccess:draft.cultivationSelection.entitlementArtId}};
 }
 return Object.freeze({RACES,SCHEMA,build});
});
