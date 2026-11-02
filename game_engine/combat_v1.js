/* CREAM'S AEGIS | deterministic starter-combat reducer v1
 * Status: EXPERIMENTAL — values and style effects are not approved canon.
 * Input: game_data/SECT_STARTER_PACK_V1.json + chosen character + opponent cards.
 * No hidden rolls, no network/storage, no automatic NPC omniscience.
 */
(function(root,factory){
 "use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else if(root)root.AEGIS_COMBAT_V1=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ROUTES=["shaolin","wudang","hwasan","namgung","peng","tang","zhuge","cheonma","bukhae","joseon","wanderer"];
 const STATUS="EXPERIMENTAL_NOT_CANON";
 const copy=x=>JSON.parse(JSON.stringify(x));
 const mod=x=>Math.floor((x-10)/2);
 function assert(b,msg){if(!b)throw new Error(msg);}
 function roll(s,sides){assert(Number.isInteger(sides)&&sides>0,"invalid die");
   s.rng=(s.rng+0x6D2B79F5)>>>0;
   let t=s.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
   return 1+(((t^(t>>>14))>>>0)%sides);}
 function dice(s,n,sides){let total=0;for(let i=0;i<n;i++)total+=roll(s,sides);return total;}
 function range(d){return d==="근접"?0:2;}
 function current(s){return s.enemies.filter(e=>e.hp>0);}
 function pathOf(pack,id){return pack.paths.find(p=>p.id===id);}
 function initialize(args){
   const {pack,routeId,abilities,enemyCards,seed=1,initialHP,initialSP,initialMP,allyHP=null}=args||{};
   const path=pathOf(pack||{},routeId);
   assert(path&&ROUTES.includes(routeId),"unsupported starting path");
   for(const ability of ["STR","DEX","CON","INT","WIS","CHA"])assert(Number.isInteger(abilities?.[ability])&&abilities[ability]>=8&&abilities[ability]<=15,"invalid ability "+ability);
   assert(Array.isArray(enemyCards)&&enemyCards.length>=1&&enemyCards.length<=3,"1..3 enemies required");
   assert(Number.isInteger(seed)&&seed>=0,"integer seed required");
   const player={hp:initialHP??(20+2*mod(abilities.CON)),maxHp:initialHP??(20+2*mod(abilities.CON)),
     sp:initialSP??(10+2*mod(abilities.WIS)),maxSp:initialSP??(10+2*mod(abilities.WIS)),
     mp:initialMP??(10+2*mod(abilities.INT)),maxMp:initialMP??(10+2*mod(abilities.INT)),
     def:10+mod(abilities.DEX),abilities:copy(abilities),zone:0,tokens:0,
     firstDiscount:false,survivalUsed:false,brace:0,stanceAttack:0,stanceDefense:0};
   for(const f of ["hp","sp","mp"])assert(Number.isInteger(player[f])&&player[f]>0,"invalid experimental resource "+f);
   const enemies=enemyCards.map((e,i)=>{
      assert(Number.isInteger(e.hp)&&e.hp>0&&Number.isInteger(e.def)&&e.def>=1&&Number.isInteger(e.attackBonus),"enemy stats required");
      assert(Number.isInteger(e.damageBonus),"enemy damageBonus required");
      assert(Number.isInteger(e.zone)&&e.zone>=0&&e.zone<=2,"enemy zone 0..2");
      assert(e.attackRange===undefined||Number.isInteger(e.attackRange)&&e.attackRange>=0&&e.attackRange<=2,"enemy attackRange 0..2");
      return {id:e.id||"enemy"+i,hp:e.hp,maxHp:e.hp,def:e.def,attackBonus:e.attackBonus,
        damageBonus:e.damageBonus,attackRange:e.attackRange??0,targetPreference:e.targetPreference==="ally"?"ally":"player",zone:e.zone,skip:0,weaken:0,slow:0,mark:0,cover:e.cover||0};
   });
   assert(new Set(enemies.map(e=>e.id)).size===enemies.length,"enemy IDs must be unique");
   const state={version:1,scope:STATUS,rng:seed>>>0,round:1,routeId,style:path.martial_identity.token,
     player,enemies,ally:allyHP==null?null:{hp:allyHP,maxHp:allyHP,def:12,guard:0,zone:0},
     winner:null,events:[],history:[],spent:{sp:0,mp:0},turns:0};
   const playerRoll=roll(state,20),enemyRoll=roll(state,20);
   state.initiative={playerRoll,enemyRoll,first:playerRoll+mod(abilities.DEX)>=enemyRoll+2?"player":"enemy"};
   return state;
 }
 function spend(s,res,base){
   assert(Number.isInteger(base)&&base>=0,"bad cost");
   const p=s.player, k=res.toLowerCase();assert(k==="sp"||k==="mp","unknown resource");
   let cost=base;
   if(!p.firstDiscount&&cost>1){cost=Math.max(1,cost-1);p.firstDiscount=true;}
   assert(p[k]>=cost,"insufficient "+res+": need "+cost);
   p[k]-=cost;s.spent[k]+=cost;s.events.push({type:"RESOURCE",resource:k,delta:-cost,remaining:p[k]});
 }
 function attackRoll(s,bonus,def,cover=0){
   const natural=roll(s,20),total=natural+bonus,success=natural===20||(natural!==1&&total>=def+cover);
   s.events.push({type:"ROLL",die:"d20",natural,bonus,dc:def+cover,total,success});
   return {natural,success};
 }
 function effect(s,route,which,target,hit){
   if(!hit)return 0;
   const p=s.player, token=()=>{p.tokens=Math.min(2,p.tokens+1);};
   if(which==="A1"){
     switch(route){
       case"shaolin":token();if(s.ally)s.ally.guard=Math.min(6,s.ally.guard+3);break;
       case"wudang":case"hwasan":case"namgung":case"peng":case"tang":case"zhuge":
       case"bukhae":case"joseon":case"wanderer":token();break;
       case"cheonma":token();p.hp=Math.max(1,p.hp-1);s.events.push({type:"SELF_BURDEN",hp:-1});break;
     }
     if(route==="peng"){
       const second=current(s).find(e=>e.id!==target.id&&e.zone===target.zone);
       if(second){const n=dice(s,1,3);second.hp=Math.max(0,second.hp-n);s.events.push({type:"CLEAVE",target:second.id,damage:n});}
     }
     if(route==="tang")target.weaken=Math.max(target.weaken,1);
     if(route==="bukhae")target.slow=Math.min(2,target.slow+1);
     if(route==="joseon")target.mark=Math.max(target.mark,1);
     return 0;
   }
   if(which==="A2"){
     if(p.tokens===0){s.events.push({type:"UNPRIMED",message:"No style token; advanced effect unavailable"});return 0;}
     p.tokens-=1;
     switch(route){
       case"shaolin": target.skip=Math.max(target.skip,1);return 1;
       case"wudang": target.weaken=Math.max(target.weaken,2);return dice(s,1,4);
       case"hwasan": return dice(s,1,6)+(p.tokens>0?2:0);
       case"namgung": target.def=Math.max(8,target.def-2);return dice(s,1,4);
       case"peng": target.skip=Math.max(target.skip,1);return dice(s,1,3);
       case"tang": target.skip=Math.max(target.skip,1);target.mark=1;return 0;
       case"zhuge": {
         const splash=current(s).filter(e=>e.id!==target.id&&e.zone===target.zone);
         for(const enemy of splash){const n=dice(s,1,3);enemy.hp=Math.max(0,enemy.hp-n);s.events.push({type:"FORMATION_SPLASH",target:enemy.id,damage:n});}
         return dice(s,1,6);
       }
       case"cheonma": p.hp=Math.max(1,p.hp-1);s.events.push({type:"SELF_BURDEN",hp:-1});return dice(s,1,6)+1;
       case"bukhae": if(target.slow>=2){target.skip=Math.max(target.skip,1);target.slow=0;}else target.slow=1;return dice(s,1,3);
       case"joseon": return dice(s,1,6)+1;
       case"wanderer": p.sp=Math.min(p.maxSp,p.sp+1);return dice(s,1,4);
     }
   }
   return 0;
 }
 function projectedCost(player,cardCosts){
   let sp=player.sp,mp=player.mp,firstDiscount=player.firstDiscount;
   for(const entry of cardCosts){
     if(!entry)continue;
     const k=entry.resource.toLowerCase();
     if(k!=="sp"&&k!=="mp")return false;
     let amount=entry.amount;
     if(!firstDiscount&&amount>1){amount-=1;firstDiscount=true;}
     if(k==="sp"){sp-=amount;if(sp<0)return false;}
     else {mp-=amount;if(mp<0)return false;}
   }
   return true;
 }
 function validateChoice(s,pack,choice){
   assert(choice&&typeof choice==="object","choice required");
   assert(["A1","A2","BASIC","GUARD","RECOVER"].includes(choice.main),"unknown main");
   assert(choice.bonus==null||choice.bonus==="BONUS","unknown bonus");
   assert(Number.isInteger(choice.moveDelta??0)&&Math.abs(choice.moveDelta??0)<=1,"moveDelta out of range");
   assert(Number.isInteger(choice.bonusZoneDelta??0)&&Math.abs(choice.bonusZoneDelta??0)<=1,"bonusZoneDelta out of range");
   const route=s.routeId,p=s.player,path=pathOf(pack,route);
   const movingBonus=["hwasan","joseon","bukhae","wanderer","cheonma"].includes(route);
   let zone=Math.max(0,Math.min(2,p.zone+(choice.moveDelta??0)));
   if(choice.bonus==="BONUS"&&movingBonus)zone=Math.max(0,Math.min(2,zone+(choice.bonusZoneDelta??0)));
   else assert((choice.bonusZoneDelta??0)===0,"non-movement bonus cannot change zone");
   const costs=[];
   if(choice.bonus==="BONUS")costs.push(path.skills.find(x=>x.slot==="bonus").cost);
   if(choice.main==="A1"||choice.main==="A2"){
     const card=path.skills.find(x=>x.id===route.toUpperCase()+"_"+choice.main);
     assert(card&&card.level===1&&card.slot==="active","unknown starter technique");
     costs.push(card.cost);
   }
   assert(projectedCost(p,costs),"not enough SP/MP; use BASIC, GUARD or RECOVER");
   if(["BASIC","A1","A2"].includes(choice.main)){
      const target=s.enemies.find(x=>x.id===choice.targetId&&x.hp>0);
      assert(target,"living target required");
      const card=choice.main==="BASIC"?null:path.skills.find(x=>x.id===route.toUpperCase()+"_"+choice.main);
      assert(Math.abs(zone-target.zone)<=(card?range(card.range):0),"target out of range");
   }
   return true;
 }
 function legalActions(s,pack,opts){
   const targetId=opts?.targetId;
   const main=["BASIC","A1","A2","GUARD","RECOVER"];
   return main.filter(which=>{
     try {validateChoice(s,pack,{main:which,targetId,moveDelta:opts?.moveDelta??0});return true;}
     catch{return false;}
   });
 }
 function playerMain(s,pack,choice){
   const p=s.player,route=s.routeId,path=pathOf(pack,route),id=choice.main;
   assert(["A1","A2","BASIC","GUARD","RECOVER"].includes(id),"unknown main action");
   if(id==="GUARD"){p.stanceDefense=2;s.events.push({type:"GUARD",bonus:2});return;}
   if(id==="RECOVER"){
      p.sp=Math.min(p.maxSp,p.sp+3);p.mp=Math.min(p.maxMp,p.mp+2);p.stanceDefense=1;
      s.events.push({type:"RECOVER",sp:p.sp,mp:p.mp});return;
   }
   const target=s.enemies.find(e=>e.id===choice.targetId&&e.hp>0);
   assert(target,"living target required");
   const card=id==="BASIC"?null:path.skills.find(x=>x.id===route.toUpperCase()+"_"+id);
   assert(id==="BASIC"||card&&card.slot==="active"&&card.level===1,"wrong active card");
   const dist=Math.abs(p.zone-target.zone);
   assert(dist<=(card?range(card.range):0),"target out of range: move or choose different target");
   if(card)spend(s,card.cost.resource,card.cost.amount);
   const ability=card?card.effect.ability:(route==="joseon"||route==="tang"?"DEX":"STR");
   const accuracy=2+mod(p.abilities[ability])+p.stanceAttack;
   const atk=attackRoll(s,accuracy,target.def,target.cover);
   p.stanceAttack=0;
   if(!atk.success){s.events.push({type:"ATTACK_MISS",target:target.id,skill:id});return;}
   const base=dice(s,1,6),stat=Math.max(0,mod(p.abilities[ability]));
   const add=card?effect(s,route,id,target,true):0;
   const critical=atk.natural===20?dice(s,1,6):0;
   const damage=Math.max(1,base+stat+add+critical+(target.mark>0&&route==="joseon"?1:0));
   target.hp=Math.max(0,target.hp-damage);
   s.events.push({type:"DAMAGE",target:target.id,skill:id,base,stat,bonus:add,critical,amount:damage,hpAfter:target.hp});
 }
 function playerBonus(s,pack,choice){
   if(choice.bonus!=="BONUS")return;
   const p=s.player,path=pathOf(pack,s.routeId),card=path.skills.find(x=>x.slot==="bonus");
   spend(s,card.cost.resource,card.cost.amount);
   if(["hwasan","joseon","bukhae","wanderer","cheonma"].includes(s.routeId))p.zone=Math.max(0,Math.min(2,p.zone+(choice.bonusZoneDelta??0)));
   if(["wudang","shaolin","peng","namgung","tang"].includes(s.routeId))p.stanceDefense+=1;
   if(s.routeId==="zhuge")p.tokens=Math.min(2,p.tokens+1);
   s.events.push({type:"BONUS",style:s.style,position:p.zone,defenseBonus:p.stanceDefense});
 }
 function enemyPhase(s,choice){
   const p=s.player;
   for(const enemy of current(s)){
     if(enemy.skip>0){enemy.skip-=1;s.events.push({type:"ENEMY_SKIPPED",enemy:enemy.id});continue;}
     const allyTarget=Boolean(s.ally&&s.ally.hp>0&&enemy.targetPreference==="ally");
     const defender=allyTarget?s.ally:p;
     const distance=Math.abs(enemy.zone-defender.zone);
     if(distance>enemy.attackRange){
       if(enemy.slow>0){enemy.slow--;s.events.push({type:"ENEMY_SLOWED",enemy:enemy.id});continue;}
       enemy.zone+=enemy.zone>defender.zone?-1:1;
       s.events.push({type:"ENEMY_MOVE",enemy:enemy.id,zone:enemy.zone});continue;
     }
     const hit=attackRoll(s,enemy.attackBonus-Math.min(2,enemy.weaken),defender.def+(allyTarget?0:p.stanceDefense));
     enemy.weaken=0;
     if(!hit.success){s.events.push({type:"ENEMY_MISS",enemy:enemy.id,target:allyTarget?"ally":"player"});continue;}
     let dmg=Math.max(1,dice(s,1,6)+enemy.damageBonus);
     if(allyTarget&&s.ally.guard>0){
       const blocked=Math.min(dmg,s.ally.guard);s.ally.guard=0;dmg-=blocked;
       s.events.push({type:"ALLY_GUARD",blocked});
     }
     const canReact=choice.autoReaction&&p.sp>=2&&(!allyTarget||s.routeId==="shaolin"&&Math.abs(p.zone-s.ally.zone)<=1);
     if(canReact){
       spend(s,"SP",2);
       const prevented=dice(s,1,6);
       dmg=Math.max(0,dmg-prevented);
       s.events.push({type:"REACTION",prevented,remainingDamage:dmg,target:allyTarget?"ally":"player"});
       if(s.routeId==="wudang"&&!allyTarget)p.tokens=Math.min(2,p.tokens+1);
     }
     if(!allyTarget&&!p.survivalUsed&&p.hp-dmg<=0){
       p.survivalUsed=true;dmg=Math.max(0,dmg-2);s.events.push({type:"PASSIVE_LAST_STAND",prevented:2});
     }
     defender.hp=Math.max(0,defender.hp-dmg);
     s.events.push({type:"ENEMY_DAMAGE",enemy:enemy.id,target:allyTarget?"ally":"player",amount:dmg,hpAfter:defender.hp});
     if(defender.hp<=0)break;
   }
   p.stanceDefense=0;
 }
 function resolveRound(state,pack,choice){
   assert(state&&state.scope===STATUS,"state must be experimental battle");
   assert(!state.winner,"combat already completed");
   const s=copy(state);s.events=[];
   validateChoice(s,pack,choice);
   const canMove=Math.min(2,Math.max(0,s.player.zone+(choice.moveDelta??0)));
   s.player.zone=canMove;
   const enemyFirst=s.round===1&&s.initiative.first==="enemy";
   if(enemyFirst)enemyPhase(s,choice);
   if(s.player.hp>0&&(!s.ally||s.ally.hp>0)){
     playerBonus(s,pack,choice);
     playerMain(s,pack,choice);
   }
   if(!enemyFirst&&current(s).length>0&&s.player.hp>0)enemyPhase(s,choice);
   if(s.player.hp<=0||s.ally&&s.ally.hp<=0)s.winner="enemies";
   else if(current(s).length===0)s.winner="player";
   const result={round:s.round,choice:copy(choice),events:copy(s.events),hp:s.player.hp,sp:s.player.sp,mp:s.player.mp,enemies:s.enemies.map(x=>({id:x.id,hp:x.hp})),winner:s.winner,allyHp:s.ally?.hp??null};
   s.history.push(result);s.round++;s.turns++;
   return s;
 }
 function shortState(s){return {round:s.round,route:s.routeId,hp:s.player.hp,sp:s.player.sp,mp:s.player.mp,
   tokens:s.player.tokens,zone:s.player.zone,enemies:s.enemies.map(e=>({id:e.id,hp:e.hp,zone:e.zone})),
   winner:s.winner,allyHp:s.ally?.hp??null};}
 return Object.freeze({STATUS,ROUTES,initialize,legalActions,resolveRound,shortState});
});
