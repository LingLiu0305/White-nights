import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,transition} from '../src/story.js';
import {interactions,pendingInteraction,interactionById} from '../src/interactions.js';
import {chapters} from '../src/content.js';
const reading=(chapter=0,line=0)=>{const s=createState({textRevision:2,interactionSchemaVersion:1,completed:chapter-1,chapter,line});return transition(transition(s,{type:'START',chapter}),{type:'ARRIVE'})};
test('events use valid stable anchors and progress once',()=>{
 for(const e of interactions){const c=chapters.find(c=>c.id===e.chapterId);assert.ok(c.lines.some(l=>l.id===e.anchor));assert.ok(c.lines.some(l=>l.id===e.resume))}
 let s=reading();s=transition(s,{type:'INTERACTION_OPEN',id:'n1-observe-city'});assert.equal(s.mode,'interaction');
 s=transition(s,{type:'INTERACTION_FINISH',id:'n1-observe-city'});assert.equal(s.line,1);assert.equal(s.mode,'reading');
 assert.equal(transition(s,{type:'INTERACTION_FINISH',id:'n1-observe-city'}),s);
 s=transition(s,{type:'PREVIOUS'});assert.equal(pendingInteraction(s,'night-1',chapters[0].lines[0].id),null);
});
test('old saves skip events before their cursor but keep future events',()=>{
 const s=createState({textRevision:2,completed:0,chapter:1,cursors:[0,5,0,0,0]});
 assert.equal(s.interactions['n1-observe-city'].status,'skipped');
 assert.equal(s.interactions['n3-wait-by-canal'],undefined);
});
test('interrupted observations retain objects and reject invalid phases',()=>{
 let s=transition(reading(),{type:'INTERACTION_OPEN',id:'n1-observe-city'});
 s=transition(s,{type:'INTERACTION_OBJECT',object:'window'});
 const restored=createState(s);assert.equal(restored.activeInteraction.id,'n1-observe-city');assert.deepEqual(restored.interactions['n1-observe-city'].seen,['window']);
 assert.equal(createState({...s,activeInteraction:{id:'invalid'}}).activeInteraction,null);
});
test('letter preserves the inner response and dialogue alternative',()=>{
 let s=transition(reading(4,1),{type:'INTERACTION_OPEN',id:'morning-read-letter'});
 s=transition(s,{type:'INTERACTION_PHASE',phase:'paper'});assert.equal(s.readThrough[4],3);
 s=transition(s,{type:'INTERACTION_FINISH',id:'morning-read-letter'});assert.equal(s.line,4);assert.equal(chapters[4].lines[s.line].speakerEn,'Inner voice');
 s=transition(s,{type:'INTERACTION_OPEN',id:'morning-letter-return'});s=transition(s,{type:'INTERACTION_FINISH',id:'morning-letter-return'});assert.equal(s.line,6);
 let classic=transition(reading(4,1),{type:'INTERACTION_OPEN',id:'morning-read-letter'});
 classic=transition(classic,{type:'INTERACTION_FINISH',id:'morning-read-letter',dialogue:true});assert.equal(classic.line,2);assert.equal(classic.interactions['morning-letter-return'].status,'skipped');
});

test('letter acceptance and footsteps use stable optional anchors',()=>{
 for(const id of ['n2-take-letter','n4-footsteps']){
  const e=interactionById(id);assert.ok(e);
  const ci=chapters.findIndex(c=>c.id===e.chapterId),index=chapters[ci].lines.findIndex(l=>l.id===e.anchor);
  let s=createState({textRevision:2,interactionSchemaVersion:1,completed:ci-1,chapter:ci,cursors:chapters.map((c,i)=>i===ci?index:0)});
  s=transition(transition(s,{type:'START',chapter:ci}),{type:'ARRIVE'});
  s=transition(s,{type:'INTERACTION_OPEN',id});
  s=transition(s,{type:'INTERACTION_FINISH',id,skip:true});
  assert.equal(chapters[ci].lines[s.line].id,e.resume);
 }
});
test('keepsakes require a finished chapter, replace and reset safely',()=>{
 let s=createState();const one=chapters[0].lines.at(-1).id,two=chapters[0].lines.at(-2).id;
 assert.equal(transition(s,{type:'KEEP_LINE',chapterId:'night-1',lineId:one}),s);
 s=createState({completed:0});s=transition(s,{type:'KEEP_LINE',chapterId:'night-1',lineId:one});
 s=transition(s,{type:'KEEP_LINE',chapterId:'night-1',lineId:two});
 assert.equal(createState(s).keptLines['night-1'],two);
 assert.deepEqual(transition(s,{type:'RESET'}).keptLines,{});
});
test('an open letter retains its phase when visiting another chapter',()=>{
 let s=transition(reading(4,1),{type:'INTERACTION_OPEN',id:'morning-read-letter'});
 s=transition(s,{type:'INTERACTION_PHASE',phase:'paper'});
 s=transition(s,{type:'INTERACTION_SCROLL',ratio:.6});
 s=transition(s,{type:'MAP'});s=transition(s,{type:'START',chapter:0});s=transition(s,{type:'ARRIVE'});
 s=transition(s,{type:'MAP'});s=createState(s);s=transition(s,{type:'START',chapter:4});s=transition(s,{type:'ARRIVE'});
 s=transition(s,{type:'INTERACTION_OPEN',id:'morning-read-letter'});
 assert.equal(s.activeInteraction.phase,'paper');assert.equal(s.activeInteraction.scrollRatio,.6);
});
test('a restored completed replay reopens and returns without advancing',()=>{
 let s=transition(reading(),{type:'INTERACTION_OPEN',id:'n1-observe-city'});
 s=transition(s,{type:'INTERACTION_FINISH',id:'n1-observe-city'});s=transition(s,{type:'PREVIOUS'});
 s=transition(s,{type:'INTERACTION_OPEN',id:'n1-observe-city',replay:true});s=createState(s);
 s=transition(s,{type:'START',chapter:0});s=transition(s,{type:'ARRIVE'});s=transition(s,{type:'INTERACTION_OPEN',id:'n1-observe-city'});
 assert.equal(s.mode,'interaction');s=transition(s,{type:'INTERACTION_FINISH',id:'n1-observe-city'});assert.equal(s.line,0);
});
test('letter replay opened from a dialogue paragraph restores without moving the cursor',()=>{
 let s=reading(4,2);s=transition(s,{type:'INTERACTION_OPEN',id:'morning-read-letter',replay:true});
 assert.equal(s.mode,'interaction');s=createState(s);
 s=transition(s,{type:'START',chapter:4});s=transition(s,{type:'ARRIVE'});s=transition(s,{type:'INTERACTION_OPEN',id:'morning-read-letter'});
 assert.equal(s.mode,'interaction');s=transition(s,{type:'INTERACTION_FINISH',id:'morning-read-letter'});assert.equal(s.line,2);
});
test('listening choice is optional, distinct and survives refresh without changing the story',()=>{
 let s=reading(1,17);s=transition(s,{type:'INTERACTION_OPEN',id:'n2-listen'});
 s=transition(s,{type:'INTERACTION_CHOICE',choice:'ask'});assert.equal(s.interactions['n2-listen'].choice,'ask');
 s=createState(s);s=transition(s,{type:'START',chapter:1});s=transition(s,{type:'ARRIVE'});s=transition(s,{type:'INTERACTION_OPEN',id:'n2-listen'});
 assert.equal(s.interactions['n2-listen'].choice,'ask');s=transition(s,{type:'INTERACTION_FINISH',id:'n2-listen'});assert.equal(s.line,18);
});
test('new choice does not interrupt old completed or past-anchor saves',()=>{
 const s=createState({textRevision:2,interactionSchemaVersion:1,completed:1,chapter:1,cursors:[0,25,0,0,0]});
 assert.equal(s.interactions['n2-listen'].status,'skipped');
});
test('memory observations save only valid, already reached objects',()=>{
 let s=reading(1,18);s=transition(s,{type:'MEMORY_SEEN',id:'grandmother',object:'chair'});
 assert.deepEqual(s.memories.grandmother,['chair']);s=transition(s,{type:'MEMORY_SEEN',id:'upstairs',object:'bundle'});
 assert.equal(s.memories.upstairs,undefined);assert.deepEqual(createState(s).memories.grandmother,['chair']);
});
test('listening can be skipped and cannot be completed twice',()=>{
 let s=reading(1,17);s=transition(s,{type:'INTERACTION_OPEN',id:'n2-listen'});
 s=transition(s,{type:'INTERACTION_FINISH',id:'n2-listen',skip:true});assert.equal(s.line,18);
 assert.equal(transition(s,{type:'INTERACTION_FINISH',id:'n2-listen'}),s);
});
test('visited memories can record observations from chapter-end history',()=>{
 let s=reading(1,18);s=transition(s,{type:'MEMORY_SEEN',id:'grandmother',object:'windows'});
 s={...s,mode:'end'};s=transition(s,{type:'MEMORY_SEEN',id:'grandmother',object:'chair'});
 assert.deepEqual(s.memories.grandmother,['windows','chair']);
});
