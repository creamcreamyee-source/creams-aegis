/* AEGIS D-044 aptitude XP adapter. Apply before growth_reducer.awardXP; never twice. */
(function(root,factory){"use strict";const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else if(root)root.AEGIS_TALENT_XP=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const RATIOS=Object.freeze({ordinary:[100,100],promising:[110,100],gifted:[125,100],monster:[150,100],transcendent:[200,100]});
const THRESHOLDS=Object.freeze([0,200,500,900,1500,2300,3300,4600,6200,8200,10700,13700]);
function effectiveXP(baseXP,talentId){if(!Number.isSafeInteger(baseXP)||baseXP<0)throw new TypeError("baseXP nonnegative safe integer required");const r=RATIOS[talentId];if(!r)throw new TypeError("unknown talentId");const result=Math.floor(baseXP*r[0]/r[1]);if(!Number.isSafeInteger(result))throw new RangeError("XP overflow");return result;}
function adaptAward(award,talentId){if(!award||!Number.isSafeInteger(award.amount)||award.amount<1)throw new TypeError("positive base award required");if(award.xpAlreadyAdjusted)throw new Error("award already adjusted");return {...award,amount:effectiveXP(award.amount,talentId),baseAmount:award.amount,talentId,xpAlreadyAdjusted:true};}
function levelAt(xp){if(!Number.isSafeInteger(xp)||xp<0)throw new TypeError("invalid xp");let level=1;for(let i=0;i<THRESHOLDS.length;i++)if(xp>=THRESHOLDS[i])level=i+1;return level;}
function reconcileUnsavedBaseXP(baseXP,talentId){const xp=effectiveXP(baseXP,talentId);const level=levelAt(xp);return {baseXP,effectiveXP:xp,level,nextXP:level<12?THRESHOLDS[level]:null,pendingReward:level>=2?"PASSIVE_CHOICE":null,migrationRequired:true};}
return Object.freeze({RATIOS,THRESHOLDS,effectiveXP,adaptAward,levelAt,reconcileUnsavedBaseXP});
});
