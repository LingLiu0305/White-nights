import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,transition} from '../src/story.js';
import {interactions,pendingInteraction} from '../src/interactions.js';
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
