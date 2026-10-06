import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match, emptyInput } from '../src/engine.ts';
import { Dialogue } from '../src/dialogue.ts';

test('dialogue answers the opposing topic and rotates repeated responses',()=>{
 const d=new Dialogue();d.say('rand','achievement');const first=d.say('buddha','cause');assert.match(first.text,/Create/);d.say('rand','achievement');const next=d.say('buddha','cause');assert.notEqual(next.text,first.text);assert.match(next.text,/work/);
});
test('direction selects the appropriate move relative to opponent',()=>{
 const m=new Match();m.start('versus');m.tick(.016,{...emptyInput(),right:true,a:true});assert.equal(m.fighters[0].move,'aggregates');
 m.start('versus');m.tick(.016,{...emptyInput(),left:true,b:true});assert.equal(m.fighters[0].move,'release');
 m.start('versus');m.fighters[0].x=700;m.fighters[1].x=250;m.tick(.016,{...emptyInput(),left:true,a:true});assert.equal(m.fighters[0].move,'aggregates');
});
test('holding offense fires once per press and requires a fresh press',()=>{
 const m=new Match();m.start('versus');for(let i=0;i<100;i++)m.tick(.02,{...emptyInput(),a:true});assert.equal(m.dialogue.history.length,1);m.tick(.02,emptyInput());m.tick(.02,{...emptyInput(),a:true});assert.equal(m.dialogue.history.length,2);
});
test('close strike deals damage, held guard reduces it, immunity avoids it',()=>{
 const m=new Match();m.start('versus');m.fighters[1].x=350;m.perform(0,'aggregates');assert.equal(m.fighters[1].hp,83);
 m.start('versus');m.fighters[1].x=350;m.fighters[1].guard=true;m.perform(0,'aggregates');assert.equal(m.fighters[1].hp,96.6);
 m.start('versus');m.fighters[1].x=350;m.fighters[1].immune=.5;m.perform(0,'aggregates');assert.equal(m.fighters[1].hp,100);
});
test('ranged projectile travels and hits, melee outside range misses',()=>{
 const m=new Match();m.start('versus');m.perform(0,'aggregates');assert.equal(m.fighters[1].hp,100);m.perform(0,'cause');for(let i=0;i<100;i++)m.tick(.02,emptyInput());assert.equal(m.fighters[1].hp,90);assert.equal(m.projectiles.length,0);
});
test('pause freezes time; KO ends the round; restart clears history and damage',()=>{
 const m=new Match();m.start('versus');m.pause();m.tick(.04,emptyInput());assert.equal(m.time,90);m.pause();m.fighters[1].hp=0;m.tick(.02,emptyInput());assert.equal(m.phase,'finished');assert.equal(m.winner,'buddha');m.start();assert.equal(m.dialogue.history.length,0);assert.equal(m.fighters[1].hp,100);
});
test('timeout awards the fighter with more health and supports draws',()=>{
 const m=new Match();m.start('versus');m.time=.01;m.fighters[0].hp=40;m.tick(.02,emptyInput());assert.equal(m.winner,'rand');m.start('versus');m.time=.01;m.tick(.02,emptyInput());assert.equal(m.winner,'draw');
});
