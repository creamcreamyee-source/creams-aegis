/* CREAM'S AEGIS -- new character builder, EXPERIMENTAL numeric model
 * Requires an explicit choice; never reads deleted REBIRTH/DEMO saves.
 * This is a standalone pure function for generating a DRAFT, not a GitHub commit.
 * Character data are not canon until approved by the player.
 */
(function(root,factory) {
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else if(root)root.AEGIS_CHARACTER_BUILDER=api;
})(typeof globalThis!=="undefined"?globalThis:this,function() {
 "use strict";
 const ABILITIES=Object.freeze(["STR","DEX","CON","INT","WIS","CHA"]);
 const COST=Object.freeze({8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9});
 const TALENTS=Object.freeze(["ordinary","promising","gifted","monster","transcendent"]);
 const REQUIRED=Object.freeze({heart:1,active:2,bonus:1,reaction:1,passive:3,unique:2});
 const clone=v=>JSON.parse(JSON.stringify(v));
 const mod=n=>Math.floor((n-10)/2);
 function nonempty(s,label){if(typeof s!=="string"||!s.trim())throw new Error(label+" is required");return s.trim();}
 function pointBuy(scores) {
   if(!scores||typeof scores!=="object"||Array.isArray(scores))throw new TypeError("six scores required");
   if(Object.keys(scores).sort().join()!==ABILITIES.slice().sort().join())throw new Error("exactly six ability scores required");
   const cost=ABILITIES.reduce((n,k)=>{
      const value=scores[k];
      if(!Number.isInteger(value)||value<8||value>15)throw new Error(k+" must be 8..15 before bonuses");
      return n+COST[value];
   },0);
   if(cost!==27)throw new Error("Point Buy must spend 27, got "+cost);
   return {cost,mods:Object.fromEntries(ABILITIES.map(k=>[k,mod(scores[k])]))};
 }
 function caps(scores,level,mode){
   if(mode!=="EXPERIMENTAL_V1")throw new Error("no approved HP/MP/SP caps formula yet");
   if(!Number.isInteger(level)||level<1||level>12)throw new Error("level outside 1..12");
   const p=pointBuy(scores);
   return {HP:Math.max(1,20+2*p.mods.CON+6*(level-1)),SP:Math.max(1,10+2*p.mods.WIS+2*(level-1)),
     MP:Math.max(1,10+2*p.mods.INT+2*(level-1)),
     proficiency:level<=4?2:level<=8?3:4,DEF:10+p.mods.DEX,
     formula_status:"EXPERIMENTAL_NOT_CANON"};
 }
 function draft(selection,pack,growthEngine) {
   if(!selection||typeof selection!=="object")throw new Error("new character selection required");
   if(!pack||!Array.isArray(pack.paths))throw new Error("starter sect pack required");
   if(!growthEngine||typeof growthEngine.initialize!=="function")throw new Error("growth reducer required");
   const name=nonempty(selection.characterName,"characterName");
   const race=nonempty(selection.raceType,"raceType");
   const origin=nonempty(selection.origin,"origin");
   const talent=nonempty(selection.talentId,"talentId");
   if(!TALENTS.includes(talent))throw new Error("invalid talentId");
   const pathId=nonempty(selection.pathId,"pathId");
   const path=pack.paths.find(p=>p.id===pathId);
   if(!path)throw new Error("unknown sect or wanderer path");
   const scores=clone(selection.abilityScores);
   const point=pointBuy(scores);
   if(selection.level!==undefined&&selection.level!==1)throw new Error("new character must begin level 1");
   if(selection.xp!==undefined&&selection.xp!==0)throw new Error("new character must begin XP 0");
   const talentHeartType=talent==="transcendent"?"secret":talent==="monster"?"advanced":"entry";
   const targetArt=path.heart_variants[talentHeartType];
   if(!targetArt)throw new Error("missing heart art entitlement");
   const skillIds=Object.values(path.starter_loadout).flat();
   if(skillIds.length!==10||new Set(skillIds).size!==10)throw new Error("starter loadout wrong size");
   for(const [category,n] of Object.entries(REQUIRED)) {
     if(!Array.isArray(path.starter_loadout[category])||path.starter_loadout[category].length!==n)
       throw new Error("slot violation "+category);
     for(const id of path.starter_loadout[category]) if(!path.skills.some(s=>s.id===id&&s.level===1&&s.slot===category))
       throw new Error("illegal Lv1 skill "+id);
   }
   const resourceCaps=caps(scores,1,"EXPERIMENTAL_V1");
   const draft={
      schema_version:1,mode:"CHAT_CAMPAIGN",kind:"NEW_CHARACTER_DRAFT",play_committed:false,
      character:{name,raceType:race,race_approval_status:"PENDING_OFFICIAL_MAPPING",
        origin,talentId:talent,pathId,sectNameCandidate:path.name,
        abilities:scores,abilityMods:point.mods,pointBuySpent:point.cost,
        level:1,xp:0,HP:resourceCaps.HP,SP:resourceCaps.SP,MP:resourceCaps.MP,
        resourceCaps,resource_formula_status:"EXPERIMENTAL_NOT_CANON"},
      cultivationSelection:{entitlementArtId:targetArt.id,entitlementQuality:targetArt.quality_candidate,
         status:"FIRST_GATE_CANDIDATE_NOT_MASTERED",activeHeartArtId:null,grantedTechniques:[],
         candidateLoadout:clone(path.starter_loadout)},
      growthPreconditions:{needsExplicitUserChoice:true,needsCanonNumericApproval:true,
        needsStarterTrainingEvent:true,needsStartingRealmSelection:true},
      source:"game_data/SECT_STARTER_PACK_V1.json; D-038..D-041"
   };
   const started=growthEngine.initialize({xp:0,level:1,character:{talentId:talent}}, {imported:false});
   draft.growth=started.growth;
   return draft;
 }
 return Object.freeze({ABILITIES,COST,TALENTS,REQUIRED,pointBuy,caps,draft});
});
