/* CREAM'S AEGIS experimental battle suite. Run: node tests/COMBAT_V1_TEST.js */
"use strict";
function runSuite({combat,pack}){
 const tests=[];const errors=[];
 function check(label,fn){let pass=false,reason=null;try{pass=fn()===true;}catch(e){reason=String(e)}tests.push({label,pass,reason});if(!pass)errors.push({label,reason});}
 function fails(fn){try{fn();return false}catch{return true}}
 const abilities={STR:15,DEX:13,CON:14,INT:10,WIS:12,CHA:8};
 const boss={id:"boss",hp:40,def:15,attackBonus:5,damageBonus:3,zone:0};
 const guard={id:"guard",hp:24,def:13,attackBonus:3,damageBonus:1,zone:0};
 const second={id:"second",hp:20,def:12,attackBonus:3,damageBonus:1,zone:0};
 const start=(route="cheonma",seed=7,enemy=[guard],allyHP)=>combat.initialize({pack,routeId:route,abilities,seed,enemyCards:enemy,allyHP});
 check("11 paths supported",()=>combat.ROUTES.length===11&&pack.paths.length===11);
 check("d20 version marked experimental",()=>combat.STATUS==="EXPERIMENTAL_NOT_CANON");
 check("repeated initiative deterministic",()=>JSON.stringify(start("hwasan",21))===JSON.stringify(start("hwasan",21)));
 check("initiative has both d20 values",()=>[start().initiative.playerRoll,start().initiative.enemyRoll].every(x=>Number.isInteger(x)&&x>=1&&x<=20));
 check("invalid route blocked",()=>fails(()=>start("none")));
 check("duplicate enemy IDs blocked",()=>fails(()=>start("shaolin",1,[guard,guard])));
 check("unknown opponent stat blocked",()=>fails(()=>start("hwasan",1,[{id:"e",hp:8,def:12,attackBonus:3,zone:0}])));
 check("no free teleport",()=>fails(()=>combat.resolveRound(start(),pack,{main:"GUARD",moveDelta:2})));
 check("no bonus teleport",()=>fails(()=>combat.resolveRound(start(),pack,{main:"GUARD",bonus:"BONUS",bonusZoneDelta:2})));
 check("unknown technique blocked",()=>fails(()=>combat.resolveRound(start(),pack,{main:"ULTIMATE"})));
 check("wrong target blocked",()=>fails(()=>combat.resolveRound(start(),pack,{main:"A1",targetId:"void"})));
 check("main only one per round",()=>{let s=combat.resolveRound(start(),pack,{main:"A1",targetId:"guard"});return s.turns===1&&s.history.length===1&&s.history[0].events.filter(e=>e.type==="DAMAGE").length<=1;});
 check("legalActions offers recovery",()=>combat.legalActions(start(),pack,{targetId:"guard"}).includes("RECOVER"));
 check("out of range rejected",()=>fails(()=>combat.resolveRound(start("hwasan",1,[{...guard,zone:2}]),pack,{main:"A1",targetId:"guard"})));
 check("ranged style allows range zone2",()=>combat.legalActions(start("joseon",1,[{...guard,zone:2}]),pack,{targetId:"guard"}).includes("A1"));
 check("no attacks after completed victory",()=>{let s=start("joseon",31,[{...guard,hp:1}]);for(let i=0;i<15&&!s.winner;i++)s=combat.resolveRound(s,pack,{main:"A1",targetId:"guard"});return s.winner==="player"&&fails(()=>combat.resolveRound(s,pack,{main:"GUARD"}));});
 check("non-unique reactions do not duplicate resource",()=>{let s=combat.resolveRound(start("cheonma",91),pack,{main:"GUARD",autoReaction:true});return s.spent.sp<=2;});
 check("resource unchanged on invalid choice",()=>{const s=start("hwasan",1,[{...guard,zone:2}]);fails(()=>combat.resolveRound(s,pack,{main:"A1",targetId:"guard"}));return s.player.sp===s.player.maxSp&&s.history.length===0;});
 check("recover never exceeds max",()=>{let s=start();s.player.sp=1;s.player.mp=1;s=combat.resolveRound(s,pack,{main:"RECOVER"});return s.player.sp<=s.player.maxSp&&s.player.mp<=s.player.maxMp;});
 check("SP can't be negative",()=>{let s=start();s.player.sp=0;return !combat.legalActions(s,pack,{targetId:"guard"}).includes("A1");});
 check("MP can't be negative",()=>{let s=start("zhuge");s.player.mp=0;return !combat.legalActions(s,pack,{targetId:"guard"}).includes("A1");});
 check("monster heart art not auto applied",()=>{const s=start("cheonma");return s.player.tokens===0&&s.player.sp>0&&!Object.keys(s.player).includes("talent");});
 check("all paths have unique style tags",()=>new Set(pack.paths.map(p=>p.martial_identity.token)).size===11);
 check("each path 10 slots and active A1/A2",()=>pack.paths.every(p=>Object.values(p.starter_loadout).flat().length===10&&p.skills.filter(x=>x.slot==="active"&&x.level===1).length===2));
 check("enemy ranged intent is respected",()=>{const s=start("shaolin",18,[{...guard,zone:2,attackRange:2}]);let t=combat.resolveRound(s,pack,{main:"GUARD"});return t.enemies[0].zone===2;});
 check("escort enemy attacks ally",()=>{let observed=false;for(let seed=1;seed<=90;seed++){let s=start("shaolin",seed,[{...guard,targetPreference:"ally",attackBonus:12}],12);s=combat.resolveRound(s,pack,{main:"GUARD"});if(s.history[0].events.some(e=>e.type==="ENEMY_DAMAGE"&&e.target==="ally")){observed=true;break}}return observed;});
 check("shaolin can guard ally",()=>{let observed=false;for(let seed=1;seed<=90;seed++){let s=start("shaolin",seed,[{...guard,targetPreference:"ally",attackBonus:12,damageBonus:4}],12);s=combat.resolveRound(s,pack,{main:"A1",targetId:"guard",autoReaction:true});if(s.history[0].events.some(e=>e.type==="ALLY_GUARD"||e.type==="REACTION"&&e.target==="ally")){observed=true;break}}return observed;});
 check("ally death ends escort mission",()=>{let observed=false;for(let seed=1;seed<=90;seed++){let s=start("shaolin",seed,[{...guard,targetPreference:"ally",attackBonus:12,damageBonus:8}],1);s=combat.resolveRound(s,pack,{main:"GUARD"});if(s.winner==="enemies"){observed=true;break}}return observed;});
 check("zone movement at most one per main action",()=>{let s=start();s=combat.resolveRound(s,pack,{main:"GUARD",moveDelta:1});return s.player.zone===1;});
 check("post-battle state immutable before reducer",()=>{const s=start(),before=JSON.stringify(s);combat.resolveRound(s,pack,{main:"GUARD"});return JSON.stringify(s)===before;});
 check("two identical seed battles replay byte-identical",()=>{let a=start("tang",77,[guard,second]),b=start("tang",77,[guard,second]);for(let i=0;i<3;i++){a=combat.resolveRound(a,pack,{main:"A1",targetId:"guard"});b=combat.resolveRound(b,pack,{main:"A1",targetId:"guard"});}return JSON.stringify(a)===JSON.stringify(b);});
 let hits=0,misses=0;for(let seed=1;seed<180;seed++){const s=combat.resolveRound(start("shaolin",seed),pack,{main:"A1",targetId:"guard"});for(const ev of s.history[0].events){if(ev.type==="ROLL"&&ev.die==="d20"){if(ev.natural===1){misses++;if(ev.success)errors.push({label:"natural1 auto fail",seed});}if(ev.natural===20){hits++;if(!ev.success)errors.push({label:"natural20 auto success",seed});}}}}
 check("natural 1 and 20 both observed, auto rule holds",()=>misses>0&&hits>0&&errors.length===0);
 const paths=pack.paths,scenario=[
  {name:"guard",enemies:[{...guard,hp:28,def:14,attackBonus:4,damageBonus:2}]},
  {name:"elite",enemies:[boss]},
  {name:"dual",enemies:[{...guard,hp:19},{...second,hp:19}]},
  {name:"ranged",enemies:[{...guard,hp:30,zone:2,attackRange:2,def:14,damageBonus:2}]},
  {name:"escort",enemies:[{...guard,targetPreference:"ally",damageBonus:2}],allyHP:12}
 ];
 const statsFor=primary=>{const s={STR:8,DEX:8,CON:8,INT:8,WIS:8,CHA:8};s[primary]=15;const rest=["CON","DEX","WIS","INT","STR","CHA"].filter(x=>x!==primary);[14,13,12,10,8].forEach((n,i)=>s[rest[i]]=n);return s;};
 const rows=[];
 for(const path of paths)for(const caseDef of scenario){
   let victories=0,losses=0,timeouts=0,turns=0,usedA1=0,usedA2=0;
   for(let i=1;i<=200;i++){
     let state=combat.initialize({pack,routeId:path.id,abilities:statsFor(path.primary_ability_candidate),
       enemyCards:caseDef.enemies,seed:Math.imul(i,2654435761)>>>0,allyHP:caseDef.allyHP});
     while(!state.winner&&state.turns<18){
       const target=state.enemies.filter(x=>x.hp>0).sort((a,b)=>Math.abs(a.zone-state.player.zone)-Math.abs(b.zone-state.player.zone))[0];
       let moveDelta=0,legal=combat.legalActions(state,pack,{targetId:target.id,moveDelta});
       if(!legal.includes("A1")){moveDelta=state.player.zone<target.zone?1:-1;legal=combat.legalActions(state,pack,{targetId:target.id,moveDelta});}
       const main=state.player.tokens&&legal.includes("A2")?"A2":legal.includes("A1")?"A1":legal.includes("BASIC")?"BASIC":"RECOVER";
       state=combat.resolveRound(state,pack,{main,targetId:target.id,moveDelta,autoReaction:state.player.sp>=4});
       if(main==="A1")usedA1++;else if(main==="A2")usedA2++;
       if(state.player.hp<0||state.player.sp<0||state.player.mp<0)errors.push({label:"negative resource",path:path.id});
     }
     if(state.winner==="player")victories++;else if(state.winner==="enemies")losses++;else timeouts++;
     turns+=state.turns;
   }
   rows.push({path:path.id,scenario:caseDef.name,victories,losses,timeouts,
     win_pct:+(100*victories/200).toFixed(1),avg_turns:+(turns/200).toFixed(1),A1_uses:usedA1,A2_uses:usedA2});
 }
 check("5500 test battles without engine failures",()=>rows.length===55&&rows.every(r=>r.victories+r.losses+r.timeouts===200)&&errors.length===0);
 check("every path uses starter A1 and A2 in simulation",()=>paths.every(p=>rows.filter(r=>r.path===p.id).some(r=>r.A1_uses>0&&r.A2_uses>0)));
 check("ranged specialists actually have situational advantage",()=>{const g=rows.filter(x=>x.scenario==="ranged");const s=g.find(x=>x.path==="joseon");const b=g.find(x=>x.path==="peng");return s.win_pct>b.win_pct;});
 check("escort protector has role advantage",()=>{const g=rows.filter(x=>x.scenario==="escort");const s=g.find(x=>x.path==="shaolin");const b=g.find(x=>x.path==="wanderer");return s.win_pct>b.win_pct;});
 return {passed:tests.filter(x=>x.pass).length,total:tests.length,errors,rows,tests,seedMethod:"i*2654435761 unsigned",battleCount:55*200};
}
module.exports={runSuite};
if(typeof require!=="undefined"&&require.main===module){
 const fs=require("fs"),path=require("path");
 const root=path.join(__dirname,"..");
 const result=runSuite({
 combat:require("../game_engine/combat_v1.js"),
 pack:JSON.parse(fs.readFileSync(path.join(root,"game_data/SECT_STARTER_PACK_V1.json"),"utf8"))
 });
 console.log(JSON.stringify({passed:result.passed,total:result.total,
   errors:result.errors,rows:result.rows,battleCount:result.battleCount},null,2));
 if(result.errors.length)process.exitCode=1;
}
