/* CREAM'S AEGIS — campaign combat adapter.
 * Enforces actual training/heart activation for martial abilities, without altering saves.
 * All numbers remain EXPERIMENTAL. Call GitHub separately for checkpoints.
 */
(function(root,factory){
 "use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else if(root)root.AEGIS_CAMPAIGN_BATTLE=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";const copy=x=>JSON.parse(JSON.stringify(x));
 function assert(x,msg){if(!x)throw new Error(msg)}
 function checkSession(session,pack){
   assert(session&&session.kind==="NEW_OFFICIAL_CHAT_CAMPAIGN"&&session.mode==="CHAT_CAMPAIGN","official new session required");
   assert(session.rule_status==="EXPERIMENTAL_NUMERICS_NOT_CANON","no approved numeric rules provided");
   assert(session.character&&session.growth&&session.checkpoint,"incomplete session");
   const id=session.character.sectPathId,style=pack.paths.find(p=>p.id===id);
   assert(style,"unknown session path");
   assert(Number.isInteger(session.character.hp)&&session.character.hp>0,"not fit to fight");
   assert(Number.isInteger(session.character.sp)&&session.character.sp>=0,"invalid SP");
   assert(Number.isInteger(session.character.mp)&&session.character.mp>=0,"invalid MP");
   assert(Array.isArray(session.character.knownTechniqueIds),"learned techniques list missing");
   return style;
 }
 function verifiedHeart(session,pack){
   const artId=session.character.activeHeartArtId;
   if(!artId)return false;
   const c=session.growth.cultivation;
   assert(c&&c.heartArtId===artId,"active heart and ledger mismatch");
   const record=c.arts?.find(x=>x.id===artId&&x.active===true);
   assert(record&&record.masteryStage!=="untrained","heart access is not usable cultivation");
   const sect=pack.paths.find(x=>x.id===session.character.sectPathId);
   assert(Object.values(sect.heart_variants).some(x=>x.id===artId),"art does not belong to this training lineage");
   return true;
 }
 function allowedMartialAction(session,pack,choice){
   const path=checkSession(session,pack);
   const learned=new Set(session.character.knownTechniqueIds);
   const heartReady=verifiedHeart(session,pack);
   const prefix=path.id.toUpperCase();
   if(choice.main==="A1"||choice.main==="A2")
     assert(heartReady&&learned.has(prefix+"_"+choice.main),"unlearned martial art or inactive core heart");
   if(choice.bonus==="BONUS")
     assert(heartReady&&learned.has(prefix+"_BONUS"),"bonus movement art not trained");
   if(choice.autoReaction===true)
     assert(heartReady&&learned.has(prefix+"_REACTION"),"reaction art not trained");
   return true;
 }
 function begin({session,pack,encounter,combat,seed}){
   checkSession(session,pack);
   assert(encounter&&Array.isArray(encounter.enemies),"encounter required");
   assert(combat&&typeof combat.initialize==="function","combat reducer required");
   const s=combat.initialize({pack,routeId:session.character.sectPathId,
      abilities:session.character.abilities,enemyCards:encounter.enemies,
      seed,initialHP:session.character.hp,initialSP:session.character.sp,
      initialMP:session.character.mp,allyHP:encounter.allyHP});
   s.sessionId=session.session_id;
   s.encounterId=encounter.id;
   s.provenance="OFFICIAL_CAMPAIGN_EXPERIMENTAL_RULES";
   return s;
 }
 function turn({battle,session,pack,combat,choice}){
   assert(battle.sessionId===session.session_id,"cannot use another character's battle");
   allowedMartialAction(session,pack,choice);
   return combat.resolveRound(battle,pack,choice);
 }
 function checkpoint(beforeSession,battle,eventId){
   assert(beforeSession&&battle&&battle.sessionId===beforeSession.session_id,"session/battle mismatch");
   assert(typeof eventId==="string"&&eventId.length>0,"eventId required");
   assert(battle.history.length>0,"no battle turns played");
   const s=copy(beforeSession);
   if(s.story.eventIds.includes(eventId))throw new Error("duplicate combat checkpoint");
   s.character.hp=battle.player.hp;
   s.character.sp=battle.player.sp;
   s.character.mp=battle.player.mp;
   s.story.eventIds.push(eventId);
   s.run.combatStarted=true;
   s.checkpoint.last_committed_event_id=eventId;
   s.checkpoint.revision+=1;
   s.checkpoint.phase=battle.winner?"BATTLE_RESOLVED_AWAITING_NARRATIVE":"BATTLE_IN_PROGRESS";
   const event={eventId,encounterId:battle.encounterId,rounds:battle.turns,
     result:battle.winner||"ongoing",before:{hp:beforeSession.character.hp,sp:beforeSession.character.sp,mp:beforeSession.character.mp},
     after:{hp:s.character.hp,sp:s.character.sp,mp:s.character.mp},
     enemyState:battle.enemies.map(x=>({id:x.id,hp:x.hp,zone:x.zone})),
     allyHp:battle.ally?.hp??null,ruleStatus:"EXPERIMENTAL",explicitUserAction:true};
   return {state:s,ledgerEvent:event,pendingGitHubCommit:true};
 }
 return Object.freeze({checkSession,verifiedHeart,allowedMartialAction,begin,turn,checkpoint});
});
