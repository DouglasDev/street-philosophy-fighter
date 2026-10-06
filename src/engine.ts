import { Dialogue, ROSTER, MOVES } from './dialogue.ts';
import type { FighterId, MoveId } from './dialogue.ts';
export type Phase='ready'|'playing'|'paused'|'finished';
export interface Input { left:boolean;right:boolean;up:boolean;down:boolean;a:boolean;b:boolean }
export const emptyInput=():Input=>({left:false,right:false,up:false,down:false,a:false,b:false});
export interface Fighter { id:FighterId;x:number;y:number;vy:number;hp:number;facing:number;cooldown:number;active:number;immune:number;guard:boolean;crouch:boolean;stun:number;move:MoveId|null;hit:number;previous:Input }
export interface Projectile {owner:number;x:number;y:number;direction:number;life:number}
export interface Effect {id:number;kind:'hit'|'block'|'cast'|'dodge';x:number;y:number;color:string;life:number}
export class Match {
 phase:Phase='ready'; time=90;mode:'solo'|'versus'='solo';winner:FighterId|'draw'|null=null;
 fighters:Fighter[]=[];projectiles:Projectile[]=[];effects:Effect[]=[];dialogue=new Dialogue();
 private clock=0;private aiThink=0;private aiInput=emptyInput();private serial=0;
 private random:()=>number;
 constructor(random:()=>number=Math.random){this.random=random;this.reset();}
 reset(mode:'solo'|'versus'=this.mode){this.mode=mode;this.phase='ready';this.time=90;this.winner=null;this.clock=0;this.aiThink=0;this.aiInput=emptyInput();this.projectiles=[];this.effects=[];this.dialogue=new Dialogue();this.fighters=(['buddha','rand'] as FighterId[]).map((id,i)=>({id,x:i?700:260,y:425,vy:0,hp:100,facing:i?-1:1,cooldown:0,active:0,immune:0,guard:false,crouch:false,stun:0,move:null,hit:0,previous:emptyInput()}));}
 start(mode:'solo'|'versus'=this.mode){this.reset(mode);this.phase='playing';}
 pause(){if(this.phase==='playing')this.phase='paused';else if(this.phase==='paused')this.phase='playing';}
 effect(kind:Effect['kind'],x:number,y:number,fighter:Fighter){this.effects.push({id:++this.serial,kind,x,y,color:ROSTER[fighter.id].color,life:.5});}
 tick(dt:number,p1:Input,p2:Input=emptyInput()){
  if(this.phase!=='playing')return;dt=Math.min(dt,.04);this.clock+=dt;this.time=Math.max(0,this.time-dt);
  const inputs=[p1,this.mode==='solo'?this.computer(dt):p2];
  this.fighters.forEach((f,i)=>{
   const input=inputs[i],op=this.fighters[1-i];f.facing=op.x>=f.x?1:-1;
   for(const key of ['cooldown','active','immune','stun','hit'] as const)f[key]=Math.max(0,f[key]-dt);
   f.guard=input.b&&f.y>=425;f.crouch=input.down&&f.y>=425;
   const axis=Number(input.right)-Number(input.left);
   if(!f.stun && f.active<.12){f.x=Math.max(65,Math.min(895,f.x+axis*(f.guard?65:f.crouch?85:185)*dt));if(input.up&&!f.previous.up&&f.y>=425){f.vy=-465;}}
   f.vy+=1150*dt;f.y=Math.min(425,f.y+f.vy*dt);if(f.y===425)f.vy=0;
   if(!f.stun&&f.cooldown===0){
    if(input.a&&!f.previous.a)this.perform(i,ROSTER[f.id].moves[axis===f.facing?1:0]);
    else if(input.b&&!f.previous.b)this.perform(i,ROSTER[f.id].moves[axis===-f.facing?3:2]);
   }f.previous={...input};
  });
  const [a,b]=this.fighters; if(Math.abs(a.x-b.x)<65&&Math.abs(a.y-b.y)<85){const mid=(a.x+b.x)/2;const sign=a.x<=b.x?1:-1;a.x=mid-33*sign;b.x=mid+33*sign;}
  this.projectiles=this.projectiles.filter(p=>{p.x+=p.direction*420*dt;p.life-=dt;const target=this.fighters[1-p.owner];if(Math.abs(p.x-target.x)<32&&Math.abs(p.y-(target.y-65))<(target.crouch?22:55)){this.damage(p.owner,10,p.x,p.y);return false;}return p.life>0&&p.x>0&&p.x<960;});
  this.effects=this.effects.filter(e=>{e.life-=dt;return e.life>0;});
  if(this.time===0||this.fighters.some(f=>f.hp===0)){this.phase='finished';this.winner=a.hp===b.hp?'draw':a.hp>b.hp?a.id:b.id;}
 }
 perform(index:number,id:MoveId){
  const f=this.fighters[index],target=this.fighters[1-index];f.move=id;f.active=.58;f.cooldown=MOVES[id].kind==='defense'?1.15:.85;this.dialogue.say(f.id,id);
  if(MOVES[id].kind==='defense'){
   f.immune=id==='release'? .65:.3;
   if(id==='release'){f.x=Math.max(65,Math.min(895,f.x-f.facing*85));this.effect('dodge',f.x,f.y-70,f);}
   else if(id==='rights'){if(Math.abs(f.x-target.x)<150)target.x=Math.max(65,Math.min(895,target.x+f.facing*75));this.effect('block',f.x,f.y-65,f);}
   else this.effect('block',f.x,f.y-65,f);
  }else if(id==='cause'||id==='identity'){
   this.projectiles.push({owner:index,x:f.x+f.facing*45,y:f.y-65,direction:f.facing,life:2.4});this.effect('cast',f.x+f.facing*45,f.y-65,f);
  }else {
   f.x=Math.max(65,Math.min(895,f.x+f.facing*35));this.effect('cast',f.x+f.facing*65,f.y-65,f);
   if(Math.abs(f.x-target.x)<160&&Math.abs(f.y-target.y)<90)this.damage(index,17,target.x,target.y-65);
  }
 }
 damage(owner:number,amount:number,x:number,y:number){const target=this.fighters[1-owner];if(target.immune>0){this.effect('dodge',x,y,target);return;}const blocked=target.guard;target.hp=Math.max(0,target.hp-(blocked?amount*.2:amount));target.hit=.24;target.stun=blocked?.08:.24;target.x=Math.max(65,Math.min(895,target.x+this.fighters[owner].facing*(blocked?6:20)));this.effect(blocked?'block':'hit',x,y,target);}
 private computer(dt:number):Input{
  this.aiThink-=dt;const f=this.fighters[1],op=this.fighters[0],distance=Math.abs(f.x-op.x),toward=op.x>f.x?1:-1;
  if(this.aiThink<=0){this.aiThink=.24+this.random()*.3;this.aiInput=emptyInput();const danger=this.projectiles.some(p=>p.owner===0&&Math.abs(p.x-f.x)<230);
   if(danger&&this.random()<.65){this.aiInput.b=true;if(this.random()<.4)this.aiInput[toward===1?'left':'right']=true;}
   else if(distance>280)this.aiInput[toward===1?'right':'left']=true;
   else if(f.cooldown===0){this.aiInput.a=true;if(distance<170&&this.random()<.65)this.aiInput[toward===1?'right':'left']=true;}
   else if(distance<100)this.aiInput[toward===1?'left':'right']=true;
   if(this.random()<.045)this.aiInput.up=true;
  }return this.aiInput;
 }
}
