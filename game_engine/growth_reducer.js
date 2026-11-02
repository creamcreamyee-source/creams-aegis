/* CREAM'S AEGIS — deterministic growth bookkeeping v1.0
 * Authority: WEB_ENGINE_RULES.md Section 3 (V10 SECONDARY), D-038..D-041.
 * No fictitious HP/SP/MP bonuses, automatic cultivation, or realm breakthrough.
 * CommonJS Node + plain browser global AEGIS_GROWTH. No storage or network calls.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else if (root) root.AEGIS_GROWTH = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const THRESHOLDS = Object.freeze([0,200,500,900,1500,2300,3300,4600,6200,8200,10700,13700]);
  const REWARDS = Object.freeze([
    "STARTER_10_SLOTS","PASSIVE_CHOICE","ACTIVE_CHOICE","ABILITY_OR_FEAT",
    "CORE_COMBAT_UPGRADE","BONUS_OR_REACTION_UPGRADE","PASSIVE_CHOICE",
    "ABILITY_OR_FEAT","SUPERIOR_ACTIVE","HEART_ART_EVOLUTION",
    "ULTIMATE_TECHNIQUE","FINAL_FEAT"
  ]);
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function validInt(n, label, min) {
    if (!Number.isSafeInteger(n) || n < min) throw new TypeError(label + " must be a safe integer >= " + min);
  }
  function levelAt(xp) {
    validInt(xp, "xp", 0);
    let lv = 1;
    for (let i=0; i<THRESHOLDS.length; i++) if (xp >= THRESHOLDS[i]) lv=i+1;
    return lv;
  }
  function nextThreshold(xp) {
    const level = levelAt(xp);
    return level === 12 ? null : THRESHOLDS[level];
  }
  function rewardType(level) {
    validInt(level, "level", 1);
    if (level > 12) throw new RangeError("Level cap 12");
    return REWARDS[level-1];
  }
  function requireShape(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) throw new TypeError("state object required");
    validInt(state.xp, "xp", 0);
    if (state.growth && (!Array.isArray(state.growth.earnedRewards) || !Array.isArray(state.growth.pendingGrowth) ||
      !Array.isArray(state.growth.appliedGrowth) || !Array.isArray(state.growth.queuedAwards)))
      throw new TypeError("malformed growth ledger");
  }
  function missingRewardEntries(state, pendingStatus) {
    const g=state.growth;
    const pending=new Set(g.pendingGrowth.map(v=>v.level));
    const settled=new Set(g.appliedGrowth.map(v=>v.level));
    for(let lv=(g.imported?2:1);lv<=levelAt(state.xp);lv++) {
      if(pending.has(lv) || settled.has(lv)) continue;
      g.pendingGrowth.push({level:lv,rewardType:rewardType(lv),status:pendingStatus,
        entitlementOnly:true,selectedOption:null,approvedEffectRef:null});
    }
    g.pendingGrowth.sort((a,b)=>a.level-b.level);
  }
  /** New campaign or imported save. Imported rewards require manual review; never silently grant. */
  function initialize(input, options) {
    requireShape(input);
    const s=copy(input);
    const imported=Boolean(options && options.imported);
    if(!s.growth) s.growth={schemaVersion:1,earnedRewards:[],queuedAwards:[],pendingGrowth:[],
      appliedGrowth:[], cultivation:{heartArtId:null,heartMastery:"UNKNOWN",innerPower:null,
        realm:"UNKNOWN",breakthroughStatus:"NOT_ASSESSED"}, imported};
    if(s.growth.imported===undefined) s.growth.imported=imported;
    s.level=levelAt(s.xp);
    missingRewardEntries(s, imported ? "REVIEW_REQUIRED" : "AWAITING_USER_SELECTION");
    return s;
  }
  function idUsed(g, rewardKey, objectiveId) {
    return g.earnedRewards.some(e=>e.rewardKey===rewardKey || e.objectiveId===objectiveId) ||
      g.queuedAwards.some(e=>e.rewardKey===rewardKey || e.objectiveId===objectiveId);
  }
  function awardXP(input, award) {
    requireShape(input);
    if(!input.growth) throw new Error("initialize growth ledger before awarding XP");
    if(!award || typeof award !== "object") throw new TypeError("award object required");
    validInt(award.amount, "amount", 1);
    if(typeof award.rewardKey!=="string" || !award.rewardKey.trim()) throw new TypeError("rewardKey required");
    if(typeof award.objectiveId!=="string" || !award.objectiveId.trim()) throw new TypeError("objectiveId required");
    const s=copy(input), g=s.growth;
    if(idUsed(g,award.rewardKey,award.objectiveId)) return {state:s,credited:false,duplicate:true,deferred:false};
    const record={rewardKey:award.rewardKey,objectiveId:award.objectiveId,
      amount:award.amount,category:award.category || "QUEST",source:award.source || "UNSPECIFIED"};
    if(award.inCombat===true) {
      g.queuedAwards.push(record);
      return {state:s,credited:false,duplicate:false,deferred:true};
    }
    const prev=s.xp;
    if(s.xp > Number.MAX_SAFE_INTEGER - award.amount) throw new RangeError("XP overflow");
    s.xp+=award.amount;
    s.level=levelAt(s.xp);
    g.earnedRewards.push(record);
    missingRewardEntries(s, "AWAITING_USER_SELECTION");
    return {state:s,credited:true,duplicate:false,deferred:false,fromXP:prev,toXP:s.xp,
      unlockedLevels:g.pendingGrowth.filter(p=>p.level>levelAt(prev)).map(p=>p.level)};
  }
  function finishCombat(input) {
    requireShape(input);
    if(!input.growth) throw new Error("initialize growth ledger before finishing combat");
    const s=copy(input), g=s.growth, old=s.xp;
    let gain=0;
    for(const event of g.queuedAwards){
      if(s.xp>Number.MAX_SAFE_INTEGER-event.amount) throw new RangeError("XP overflow");
      s.xp+=event.amount;gain+=event.amount;g.earnedRewards.push(event);
    }
    g.queuedAwards=[];
    s.level=levelAt(s.xp);
    missingRewardEntries(s,"AWAITING_USER_SELECTION");
    return {state:s,creditedXP:gain,fromXP:old,toXP:s.xp,level:s.level};
  }
  /** Acknowledges a reward ALREADY applied under approved rules in a separate, auditable transaction.
    * Does not grant stats, heal HP, teach arts or break through realms on its own.
    */
  function acknowledgeAppliedReward(input, info) {
    requireShape(input);
    if(!input.growth) throw new Error("growth ledger missing");
    if(!info || !Number.isInteger(info.level) || info.level<1 || info.level>12) throw new TypeError("level 1..12 required");
    if(typeof info.confirmedRuleRef!=="string" || !info.confirmedRuleRef.trim() ||
       typeof info.effectEventId!=="string" || !info.effectEventId.trim())
       throw new Error("confirmedRuleRef and external effectEventId required");
    const s=copy(input),g=s.growth,i=g.pendingGrowth.findIndex(p=>p.level===info.level);
    if(i<0) throw new Error("no pending growth for level "+info.level);
    if(g.appliedGrowth.some(p=>p.level===info.level || p.effectEventId===info.effectEventId))
      throw new Error("duplicate growth receipt");
    const p=g.pendingGrowth.splice(i,1)[0];
    g.appliedGrowth.push({level:p.level,rewardType:p.rewardType,confirmedRuleRef:info.confirmedRuleRef,
      effectEventId:info.effectEventId,selectedOption:info.selectedOption || null});
    return s;
  }
  function snapshot(input) {
    requireShape(input);
    const lv=levelAt(input.xp);
    return {level:lv,xp:input.xp,nextXP:nextThreshold(input.xp),
      xpToNext:lv===12?0:nextThreshold(input.xp)-input.xp,
      pendingGrowth:input.growth?copy(input.growth.pendingGrowth):[],
      queuedXP:input.growth?input.growth.queuedAwards.reduce((n,a)=>n+a.amount,0):0,
      realm:input.growth?input.growth.cultivation.realm:"UNKNOWN"};
  }
  return Object.freeze({THRESHOLDS,REWARDS,levelAt,nextThreshold,rewardType,
    initialize,awardXP,finishCombat,acknowledgeAppliedReward,snapshot});
});
