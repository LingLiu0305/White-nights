import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, transition, readSave, writeSave } from '../src/story.js';

test('unread future chapters stay locked', () => {
  const s = createState();
  assert.equal(s.completed, -1);
  assert.deepEqual(transition(s, {type:'START', chapter:3}), s);
});
test('a repeated start and a stale arrival cannot change an active chapter', () => {
  const moving = transition(createState(), {type:'START', chapter:0});
  assert.equal(moving.mode, 'travel');
  assert.deepEqual(transition(moving, {type:'START', chapter:1}), moving);
  const reading = transition(moving, {type:'ARRIVE'});
  assert.equal(reading.mode, 'reading');
  assert.deepEqual(transition(reading, {type:'ARRIVE'}), reading);
});
test('finishing a chapter unlocks the next without skipping it', () => {
  let s = transition(transition(createState(), {type:'START',chapter:0}),{type:'ARRIVE'});
  for(let i=0;i<100 && s.mode==='reading';i++) s=transition(s,{type:'NEXT'});
  assert.equal(s.mode,'end'); assert.equal(s.completed,0);
  s=transition(s,{type:'MAP'});
  assert.equal(s.chapter,1); assert.equal(s.line,0);
  assert.equal(transition(s,{type:'START',chapter:2}).mode,'map');
});
test('replaying an earlier night preserves unlocked chapters', () => {
  let s=createState({completed:2,chapter:3,line:0});
  s=transition(s,{type:'START',chapter:0});
  s=transition(s,{type:'ARRIVE'});
  s=transition(s,{type:'MAP'});
  assert.equal(s.completed,2);
  assert.equal(transition(s,{type:'START',chapter:3}).mode,'travel');
});
test('returning from reading and reloading resumes the same paragraph', () => {
  let s=transition(transition(createState(),{type:'START',chapter:0}),{type:'ARRIVE'});
  s=transition(s,{type:'NEXT'});
  s=transition(s,{type:'MAP'});
  const reloaded=createState(s);
  assert.equal(reloaded.line,1); assert.equal(reloaded.mode,'map');
  assert.equal(transition(reloaded,{type:'START',chapter:0}).line,1);
});
test('corrupted saves cannot unlock chapters or create out-of-range reading', () => {
  for(const saved of [null,[],{completed:999,chapter:999,line:-2},{completed:'4',chapter:1.2,line:Infinity}]) {
    const s=createState(saved);
    assert.equal(s.completed,-1); assert.equal(s.chapter,0); assert.equal(s.line,0);
  }
});
test('blocked storage and malformed JSON do not interrupt reading', () => {
  assert.equal(readSave({getItem(){throw new Error('blocked')}}),null);
  assert.equal(readSave({getItem(){return '{broken'}}),null);
  assert.equal(writeSave({setItem(){throw new Error('quota')}},createState()),false);
});
test('save round trip retains chapter, completed nights and reading cursor', () => {
  let raw; const storage={getItem(){return raw},setItem(k,v){raw=v}};
  assert.equal(writeSave(storage,{chapter:1,completed:0,line:2,mode:'reading'}),true);
  assert.equal(createState(readSave(storage)).line,2);
  assert.equal(createState(readSave(storage)).completed,0);
});
