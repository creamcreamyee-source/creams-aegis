/* CREAM'S AEGIS cultivation reducer v1.0
 * Experimental thresholds. Does not auto-award combat stats or canonize new magic.
 * The caller must verify story evidence, approved rules and enforce GitHub transaction safety.
 * No network/storage. Pure (input never mutated).
 */
(function(root,factory) {
 "use strict";
 const api=factory();
 if(typeof module!=="undefined" && module.exports)module.exports=api;
 else if(root)root.AEGIS_CULTIVATION=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const QUALITY=Object.freeze({basic:1,orthodox:1.2,upper:1.5,secret:2,supreme:3});
 const TALENT=Object.freeze({ordinary:1,promising:0.9,gifted:0.8,monster:0.65,transcendent:0.5});
 const STAGES=Object.freeze(["untrained","entry","small","great","complete"]);
 const BASE_MARKS=Object.freeze([0,1,4,10,20]);
 const REALMS=Object.freeze(["삼류","이류","일류","절정","초절정","화경","현경","생사경·검선지경"]);
 function clone(v){return JSON.parse(JSON.stringify(v));}
 function str(v,label){if(typeof v!=="string"||!v.trim())throw new TypeError(label+" required");return v;}
 function int(v,label,min){if(!Number.isSafeInteger(v)||v<min)throw new TypeError(label+" must be integer >= "+min);return v;}
 function ensure(input){if(!input||typeof input!=="object"||Array.isArray(input))throw new TypeError("state object required");if(!input.growth||!input.growth.cultivation)throw new Error("initialize XP growth before cultivation");return input;}
 function init(input){
   if(!input||!input.growth||!input.growth.cultivation)throw new Error("initialize game_engine/growth_reducer.js first");
   const s=clone(input),c=s.growth.cultivation;
   if(!Array.isArray(c.arts))c.arts=[];
   if(!Array.isArray(c.trainingEvents))c.trainingEvents=[];
   if(!Array.isArray(c.masteryEvents))c.masteryEvents=[];
   if(!Array.isArray(c.breakthroughEvents))c.breakthroughEvents=[];
   if(!Array.isArray(c.techniqueRecords))c.techniqueRecords=[];
   if(!Array.isArray(c.realmStartEvents))c.realmStartEvents=[];
   if(!Array.isArray(c.activationEvents))c.activationEvents=[];
   if(c.heartArtId===undefined)c.heartArtId=null;
   if(c.realm===undefined)c.realm="UNKNOWN";
   return s;
 }
 function unique(c,id){
   const groups=["arts","trainingEvents","masteryEvents","breakthroughEvents","techniqueRecords","realmStartEvents","activationEvents"];
   if(groups.some(k=>c[k].some(x=>x.eventId===id || x.sourceEventId===id)))throw new Error("duplicate event id "+id);
 }
 function stageRequirement(quality,talent,target){
   if(!Object.prototype.hasOwnProperty.call(QUALITY,quality))throw new Error("invalid quality");
   if(!Object.prototype.hasOwnProperty.call(TALENT,talent))throw new Error("invalid talent");
   const idx=STAGES.indexOf(target);
   if(idx<1)throw new Error("invalid target stage");
   return Math.max(1,Math.ceil(BASE_MARKS[idx]*QUALITY[quality]*TALENT[talent]));
 }
 function grantManuscript(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;
   const artId=str(event?.artId,"artId"),sourceEventId=str(event?.sourceEventId,"sourceEventId");
   if(c.arts.some(a=>a.id===artId))throw new Error("art already known; amend via separate evidence");
   if(!Object.prototype.hasOwnProperty.call(QUALITY,event.quality))throw new Error("quality unknown");
   str(event.sourceType,"sourceType");
   unique(c,sourceEventId);
   c.arts.push({id:artId,quality:event.quality,sourceType:event.sourceType,
    provenance:str(event.provenance,"provenance"),sourceEventId,
    accessStatus:event.accessStatus==="FIRST_GATE_OPEN"?"FIRST_GATE_OPEN":"MANUSCRIPT_ACQUIRED",
    masteryStage:"untrained",trainingMarks:0,active:false});
   return s;
 }
 function recordTraining(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;
   const eventId=str(event?.eventId,"eventId"),artId=str(event?.artId,"artId");
   unique(c,eventId);
   int(event.minutes,"minutes",60);int(event.dayIndex,"dayIndex",0);
   if(event.marks!==1&&event.marks!==2)throw new Error("marks allowed: 1 or 2");
   if(event.marks===2)str(event.majorInsightProof,"majorInsightProof");
   str(event.trainingEvidence,"trainingEvidence");
   const art=c.arts.find(a=>a.id===artId);if(!art)throw new Error("unknown art");
   const today=c.trainingEvents.filter(x=>x.dayIndex===event.dayIndex).reduce((sum,x)=>sum+x.marks,0);
   if(today+event.marks>2)throw new Error("daily training mark cap:2");
   art.trainingMarks+=event.marks;
   c.trainingEvents.push({eventId,artId,minutes:event.minutes,dayIndex:event.dayIndex,
    marks:event.marks,trainingEvidence:event.trainingEvidence,
    majorInsightProof:event.majorInsightProof||null});
   return s;
 }
 function advanceMastery(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;
   const eventId=str(event?.eventId,"eventId"),artId=str(event?.artId,"artId");
   unique(c,eventId);
   str(event.insightEvidence,"insightEvidence");str(event.evaluator,"evaluator");
   const art=c.arts.find(a=>a.id===artId);if(!art)throw new Error("unknown art");
   const idx=STAGES.indexOf(art.masteryStage);
   if(idx===STAGES.length-1)throw new Error("mastery already complete");
   if(event.targetStage!==STAGES[idx+1])throw new Error("must advance exactly one mastery stage");
   const talent=str(event.talent,"talent");const req=stageRequirement(art.quality,talent,event.targetStage);
   if(art.trainingMarks<req)throw new Error("not enough verified training: "+art.trainingMarks+"/"+req);
   const prev=art.masteryStage;art.masteryStage=event.targetStage;
   c.masteryEvents.push({eventId,artId,before:prev,after:event.targetStage,
    marksAtGate:art.trainingMarks,requiredMarks:req,talent,
    insightEvidence:event.insightEvidence,evaluator:event.evaluator,
    effectsGranted:"NONE_TRAINING_STAGE_ONLY"});
   if(c.heartArtId===artId)c.heartMastery=art.masteryStage;
   return s;
 }
 function activateArt(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;
   const eventId=str(event?.eventId,"eventId"),artId=str(event?.artId,"artId");unique(c,eventId);
   const art=c.arts.find(a=>a.id===artId);if(!art)throw new Error("unknown art");
   if(art.masteryStage==="untrained")throw new Error("access to manuscript is not active mastery");
   if(c.heartArtId===artId)throw new Error("heart art already active");
   if(c.heartArtId!==null)str(event.switchProof,"switchProof");
   const previous=c.heartArtId;
   c.arts.forEach(x=>{x.active=x.id===artId;});
   c.heartArtId=artId;c.heartMastery=art.masteryStage;
   c.activationEvents.push({eventId,previous,current:artId,switchProof:event.switchProof||null});
   return s;
 }
 function learnTechnique(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;
   const eventId=str(event?.eventId,"eventId"),techniqueId=str(event?.techniqueId,"techniqueId");unique(c,eventId);
   if(c.techniqueRecords.some(x=>x.techniqueId===techniqueId))throw new Error("technique already learned");
   str(event.sourceEventId,"sourceEventId");str(event.qualificationEvidence,"qualificationEvidence");
   str(event.trainingEvidence,"trainingEvidence");
   c.techniqueRecords.push({eventId,techniqueId,sourceEventId:event.sourceEventId,
    qualificationEvidence:event.qualificationEvidence,trainingEvidence:event.trainingEvidence,
    status:"LEARNED_RECORDED_NO_AUTO_STAT_EFFECT"});
   return s;
 }
 function selectStartingRealm(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;const id=str(event?.eventId,"eventId");unique(c,id);
   if(c.realm!=="UNKNOWN")throw new Error("realm already set");
   if(event.realm!=="삼류"&&event.realm!=="UNESTABLISHED")throw new Error("starting realm must be initial");
   str(event.userOrCharacterEvidence,"userOrCharacterEvidence");
   c.realm=event.realm;c.realmStartEvents.push({eventId:id,realm:event.realm,evidence:event.userOrCharacterEvidence});
   return s;
 }
 function recordBreakthrough(input,event){
   const s=init(ensure(input)),c=s.growth.cultivation;const eventId=str(event?.eventId,"eventId");unique(c,eventId);
   str(event.approvedRuleRef,"approvedRuleRef");str(event.trialEventId,"trialEventId");
   str(event.insightEvidence,"insightEvidence");str(event.costEventId,"costEventId");
   if(event.outcome!=="SUCCESS"&&event.outcome!=="FAILURE")throw new Error("explicit SUCCESS/FAILURE outcome required");
   const from=REALMS.indexOf(c.realm);
   if(from<0)throw new Error("starting realm unresolved; cannot break through");
   if(from>=REALMS.length-1)throw new Error("at max realm");
   if(event.targetRealm!==REALMS[from+1])throw new Error("cannot skip realm");
   c.breakthroughEvents.push({eventId,from:c.realm,targetRealm:event.targetRealm,outcome:event.outcome,
    approvedRuleRef:event.approvedRuleRef,trialEventId:event.trialEventId,
    insightEvidence:event.insightEvidence,costEventId:event.costEventId,
    sideEffectsApplied:"EXTERNAL_EVENT_REQUIRED"});
   if(event.outcome==="SUCCESS")c.realm=event.targetRealm;
   return s;
 }
 function summarize(input){
   const c=ensure(input).growth.cultivation;
   return {activeHeartArtId:c.heartArtId||null,mastery:c.heartMastery||"UNKNOWN",
    realm:c.realm,arts:clone(c.arts||[]).map(x=>({id:x.id,quality:x.quality,mastery:x.masteryStage,marks:x.trainingMarks,active:x.active})),
    techniqueCount:(c.techniqueRecords||[]).length,trainingCount:(c.trainingEvents||[]).length,
    breakthroughCount:(c.breakthroughEvents||[]).length};
 }
 return Object.freeze({QUALITY,TALENT,STAGES,BASE_MARKS,REALMS,stageRequirement,init,grantManuscript,recordTraining,
  advanceMastery,activateArt,learnTechnique,selectStartingRealm,recordBreakthrough,summarize});
});
