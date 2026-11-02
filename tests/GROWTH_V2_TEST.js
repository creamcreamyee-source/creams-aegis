/* CREAM'S AEGIS growth integration test suite.
 * Run: node tests/GROWTH_V2_TEST.js, or load exported runSuite({growth,builder,cultivation,pack}).
 * Static/functional checks are not full combat balance.
 */
"use strict";
function runSuite({growth,builder,cultivation,pack}) {
 const cases=[];
 function check(label,fn){let ok=false,error=null;try{ok=fn()===true;}catch(e){error=String(e);}cases.push({label,pass:ok,error});}
 function mustFail(fn){try{fn();return false;}catch(e){return true;}}
 const valid={STR:10,DEX:14,CON:14,INT:10,WIS:13,CHA:12};
 const talents=builder.TALENTS;
 const races=["human","wild","arcane"];
 check("progression levels=12",()=>growth.THRESHOLDS.length===12&&growth.THRESHOLDS[11]===13700);
 check("level edge 0,199,200",()=>growth.levelAt(0)===1&&growth.levelAt(199)===1&&growth.levelAt(200)===2);
 check("level edge 499,500,899,900",()=>growth.levelAt(499)===2&&growth.levelAt(500)===3&&growth.levelAt(899)===3&&growth.levelAt(900)===4);
 check("max level 12",()=>growth.levelAt(2000000)===12&&growth.nextThreshold(2000000)===null);
 check("negative XP blocked",()=>mustFail(()=>growth.levelAt(-1)));
 check("fractional XP blocked",()=>mustFail(()=>growth.levelAt(12.4)));
 check("27 PB sample valid",()=>builder.pointBuy(valid).cost===27);
 check("ability modifier correct",()=>builder.pointBuy(valid).mods.CON===2&&builder.pointBuy(valid).mods.WIS===1&&builder.pointBuy(valid).mods.STR===0);
 check("26 PB rejected",()=>mustFail(()=>builder.pointBuy({...valid,CHA:11})));
 check("score over15 rejected",()=>mustFail(()=>builder.pointBuy({...valid,STR:16})));
 check("missing ability rejected",()=>mustFail(()=>builder.pointBuy({STR:15,DEX:15})));
 check("Lv2 experimental sample caps",()=>{const c=builder.caps(valid,2,"EXPERIMENTAL_V1");return c.HP===30&&c.SP===14&&c.MP===12&&c.formula_status==="EXPERIMENTAL_NOT_CANON";});
 check("no default official numeric caps",()=>mustFail(()=>builder.caps(valid,2)));
 check("all 11 starter routes",()=>pack.paths.length===11&&new Set(pack.paths.map(x=>x.id)).size===11);
 let combos=0,broken=0,accessError=0;const combinations=[];
 for(const path of pack.paths)for(const talent of talents)for(const race of races) {
   try {
     const s=builder.draft({characterName:"새 인물",raceType:race,origin:"new story",pathId:path.id,talentId:talent,abilityScores:valid},pack,growth);
     const chosen=talent==="transcendent"?"secret":talent==="monster"?"advanced":"entry";
     if(s.character.xp!==0||s.character.level!==1||s.growth.pendingGrowth.length!==1||s.growth.pendingGrowth[0].level!==1)throw Error("no Lv1 start choice");
     if(s.cultivationSelection.entitlementArtId!==path.heart_variants[chosen].id||s.cultivationSelection.activeHeartArtId!==null)throw Error("wrong heart gate");
     if(Object.values(s.cultivationSelection.candidateLoadout).flat().length!==10||s.character.pointBuySpent!==27)throw Error("wrong starter");
     if(s.play_committed!==false||s.character.resource_formula_status!=="EXPERIMENTAL_NOT_CANON")throw Error("premature commit or canon");
     combos++;combinations.push(s);
   } catch(e) {broken++;accessError++;} 
 }
 check("165 race/talent/sect starting drafts valid",()=>combos===165&&broken===0&&combinations.length===165);
 check("no legacy level or XP copied into fresh drafts",()=>combinations.every(c=>c.character.level===1&&c.character.xp===0));
 check("no script automatically activated in 165 drafts",()=>combinations.every(c=>c.cultivationSelection.activeHeartArtId===null));
 check("monster upper entitlements",()=>combinations.filter(c=>c.character.talentId==="monster").every(c=>c.cultivationSelection.entitlementArtId.includes("UPPER")));
 check("transcendent secret entitlements",()=>combinations.filter(c=>c.character.talentId==="transcendent").every(c=>c.cultivationSelection.entitlementArtId.includes("SECRET")));
 check("fresh path starts with Level1 pending 10 slots",()=>combinations.every(c=>c.growth.pendingGrowth[0].rewardType==="STARTER_10_SLOTS"));
 check("bad route rejected",()=>mustFail(()=>builder.draft({characterName:"x",raceType:"human",origin:"x",pathId:"missing",talentId:"monster",abilityScores:valid},pack,growth)));
 check("invalid talent rejected",()=>mustFail(()=>builder.draft({characterName:"x",raceType:"human",origin:"x",pathId:"cheonma",talentId:"freeXP",abilityScores:valid},pack,growth)));
 check("user may not start with legacy level 2",()=>mustFail(()=>builder.draft({characterName:"x",raceType:"human",origin:"x",pathId:"cheonma",talentId:"monster",abilityScores:valid,level:2},pack,growth)));
 const first=builder.draft({characterName:"검사",raceType:"human",origin:"새 이야기",pathId:"cheonma",talentId:"monster",abilityScores:valid},pack,growth);
 const a=growth.awardXP({xp:0,level:1,hp:24,sp:12,mp:10,growth:first.growth},{amount:500,rewardKey:"q-1",objectiveId:"quest-one"});
 check("500 XP reaches Level3 with all three rewards",()=>a.state.xp===500&&a.state.level===3&&a.state.growth.pendingGrowth.map(v=>v.level).join(",")==="1,2,3");
 const dup=growth.awardXP(a.state,{amount:1,rewardKey:"different-reward-key",objectiveId:"quest-one"});
 check("same objective blocked even across reward keys",()=>dup.duplicate===true&&dup.state.xp===500);
 check("different objective can award",()=>growth.awardXP(a.state,{amount:1,rewardKey:"q-2",objectiveId:"quest-two"}).state.xp===501);
 const waiting=growth.awardXP(a.state,{amount:400,rewardKey:"combat-1",objectiveId:"combat-one",inCombat:true});
 check("in combat XP is deferred",()=>waiting.deferred===true&&waiting.state.xp===500&&waiting.state.growth.queuedAwards.length===1);
 const finished=growth.finishCombat(waiting.state);
 check("end combat applies 400 XP and Level4",()=>finished.state.xp===900&&finished.state.level===4&&finished.state.growth.pendingGrowth.map(v=>v.level).join(",")==="1,2,3,4");
 check("growth never heals or modifies inner status",()=>finished.state.hp===24&&finished.state.sp===12&&finished.state.mp===10&&finished.state.growth.cultivation.realm==="UNKNOWN");
 check("cannot acknowledge level reward without proof",()=>mustFail(()=>growth.acknowledgeAppliedReward(finished.state,{level:2})));
 const acknowledged=growth.acknowledgeAppliedReward(finished.state,{level:1,confirmedRuleRef:"CONDITIONAL_STORY_TEST_RULE",effectEventId:"INIT_STARTER_CONFIRMED",selectedOption:"10-starter"});
 check("Level1 initial loadout can be acknowledged",()=>acknowledged.growth.appliedGrowth.length===1&&acknowledged.growth.pendingGrowth.map(x=>x.level).join(",")==="2,3,4");
 check("Level1 reward cannot be granted twice",()=>mustFail(()=>growth.acknowledgeAppliedReward(acknowledged,{level:1,confirmedRuleRef:"TEST",effectEventId:"DOUBLE"})));
 const start=cultivation.init({xp:0,character:{talentId:"monster"},growth:first.growth,hp:24,sp:12,mp:10});
 const accessed=cultivation.grantManuscript(start,{artId:"CHEONMA_HEART_UPPER",sourceEventId:"TEACH_001",quality:"upper",sourceType:"CULT",provenance:"호법 첫 관문"});
 check("access is not activation",()=>accessed.growth.cultivation.arts.length===1&&accessed.growth.cultivation.heartArtId===null);
 check("cannot activate untrained heart",()=>mustFail(()=>cultivation.activateArt(accessed,{eventId:"ACT_BAD",artId:"CHEONMA_HEART_UPPER"})));
 check("cannot multiply same manuscript",()=>mustFail(()=>cultivation.grantManuscript(accessed,{artId:"CHEONMA_HEART_UPPER",sourceEventId:"TEACH_002",quality:"upper",sourceType:"CULT",provenance:"x"})));
 check("training min 60 minutes",()=>mustFail(()=>cultivation.recordTraining(accessed,{eventId:"TR_ERR",artId:"CHEONMA_HEART_UPPER",dayIndex:0,minutes:59,marks:1,trainingEvidence:"x"})));
 const trained=cultivation.recordTraining(accessed,{eventId:"TR1",artId:"CHEONMA_HEART_UPPER",dayIndex:0,minutes:60,marks:1,trainingEvidence:"구결 이해"});
 check("training credits mark but not mastery",()=>trained.growth.cultivation.arts[0].trainingMarks===1&&trained.growth.cultivation.arts[0].masteryStage==="untrained");
 check("duplicate training event blocked",()=>mustFail(()=>cultivation.recordTraining(trained,{eventId:"TR1",artId:"CHEONMA_HEART_UPPER",dayIndex:1,minutes:60,marks:1,trainingEvidence:"replay"})));
 check("daily training cap blocks third mark",()=>mustFail(()=>cultivation.recordTraining(trained,{eventId:"TR2",artId:"CHEONMA_HEART_UPPER",dayIndex:0,minutes:60,marks:2,trainingEvidence:"insight",majorInsightProof:"new finding"})));
 check("talent reroll cannot speed mastery",()=>mustFail(()=>cultivation.advanceMastery(trained,{eventId:"MA_BAD",artId:"CHEONMA_HEART_UPPER",targetStage:"entry",talent:"transcendent",insightEvidence:"x",evaluator:"mentor"})));
 const grown=cultivation.advanceMastery(trained,{eventId:"MA1",artId:"CHEONMA_HEART_UPPER",targetStage:"entry",talent:"monster",insightEvidence:"호흡 성공",evaluator:"사부"});
 check("first mastery gate requires verified training",()=>grown.growth.cultivation.arts[0].masteryStage==="entry"&&grown.growth.cultivation.arts[0].trainingMarks===1);
 const active=cultivation.activateArt(grown,{eventId:"ACT1",artId:"CHEONMA_HEART_UPPER"});
 check("activation after mastery changes only art state",()=>active.growth.cultivation.heartArtId==="CHEONMA_HEART_UPPER"&&active.hp===24&&active.sp===12);
 check("untrained -> great cannot be skipped",()=>mustFail(()=>cultivation.advanceMastery(grown,{eventId:"MA_SKIP",artId:"CHEONMA_HEART_UPPER",targetStage:"great",talent:"monster",insightEvidence:"x",evaluator:"master"})));
 check("monstrous talent faster for same quality",()=>cultivation.stageRequirement("secret","monster","great")<cultivation.stageRequirement("secret","ordinary","great"));
 check("quality affects effort",()=>cultivation.stageRequirement("secret","monster","small")>cultivation.stageRequirement("basic","monster","small"));
 check("realm cannot rise before starting realm set",()=>mustFail(()=>cultivation.recordBreakthrough(active,{eventId:"BR1",approvedRuleRef:"PROOF",trialEventId:"TRIAL",insightEvidence:"x",costEventId:"COST",targetRealm:"이류",outcome:"SUCCESS"})));
 const realm=cultivation.selectStartingRealm(active,{eventId:"REALM_INIT",realm:"삼류",userOrCharacterEvidence:"새 캐릭터 시작 경지 선택"});
 check("realm starts only with explicit event",()=>realm.growth.cultivation.realm==="삼류");
 check("realm skip blocked",()=>mustFail(()=>cultivation.recordBreakthrough(realm,{eventId:"BR_SKIP",approvedRuleRef:"PROOF",trialEventId:"TRIAL",insightEvidence:"x",costEventId:"COST",targetRealm:"일류",outcome:"SUCCESS"})));
 const failed=cultivation.recordBreakthrough(realm,{eventId:"BR_FAIL",approvedRuleRef:"PROOF",trialEventId:"TRIAL_FAIL",insightEvidence:"failed insight",costEventId:"cost1",targetRealm:"이류",outcome:"FAILURE"});
 check("failed realm trial preserves stage",()=>failed.growth.cultivation.realm==="삼류");
 check("identical trial cannot be reused",()=>mustFail(()=>cultivation.recordBreakthrough(failed,{eventId:"BR_RETRY_FRAUD",approvedRuleRef:"PROOF",trialEventId:"TRIAL_FAIL",insightEvidence:"repeated",costEventId:"cost2",targetRealm:"이류",outcome:"SUCCESS"})));
 const success=cultivation.recordBreakthrough(failed,{eventId:"BR_WIN",approvedRuleRef:"PROOF",trialEventId:"TRIAL_NEW",insightEvidence:"new insight",costEventId:"cost3",targetRealm:"이류",outcome:"SUCCESS"});
 check("new qualifying realm proof succeeds",()=>success.growth.cultivation.realm==="이류"&&success.growth.cultivation.breakthroughEvents.length===2);
 check("realm trial doesn't auto heal HP",()=>success.hp===24);
 check("original draft not mutated",()=>first.growth.pendingGrowth.length===1&&first.cultivationSelection.activeHeartArtId===null);
 return {total:cases.length,passed:cases.filter(x=>x.pass).length,failed:cases.filter(x=>!x.pass),cases,combinationsVerified:combos};
}
module.exports={runSuite};
if(typeof require!=="undefined"&&require.main===module){
 const fs=require("fs"),path=require("path");
 const modules={growth:require("../game_engine/growth_reducer.js"),
   builder:require("../game_engine/character_builder.js"),
   cultivation:require("../game_engine/cultivation_reducer.js"),
   pack:JSON.parse(fs.readFileSync(path.join(__dirname,"../game_data/SECT_STARTER_PACK_V1.json"),"utf8"))};
 const result=runSuite(modules);
 console.log(JSON.stringify({total:result.total,passed:result.passed,failed:result.failed,combinationsVerified:result.combinationsVerified},null,2));
 if(result.failed.length)process.exitCode=1;
}
