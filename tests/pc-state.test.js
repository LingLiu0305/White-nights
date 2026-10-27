import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,transition} from '../src/story.js';
import {chapters} from '../src/content.js';
import {nearbyPlace,cameraDirection,walkStep} from '../src/walking.js';
test('paragraph IDs are unique and persisted cursors survive round trips',()=>{
 const ids=chapters.flatMap(c=>c.lines.map(l=>l.id));
 assert.ok(ids.every(id=>typeof id==='string')); assert.equal(new Set(ids).size,ids.length);
 const state=createState({textRevision:2,completed:1,chapter:2,cursors:[0,0,8,0,0]});
 assert.equal(state.line,8);assert.equal(state.introSeen,true);
 assert.equal(createState(state).line,8);
});
test('intro and map player state reset without accepting invalid positions',()=>{
 let s=createState();assert.equal(s.introSeen,false);
 s=transition(s,{type:'INTRO_DONE'});assert.equal(s.introSeen,true);
 s=transition(s,{type:'PLAYER',player:{x:3.1,z:-3.8,facing:1}});
 assert.equal(createState(s).mapPlayer.x,3.1);
 assert.equal(createState({...s,mapPlayer:{x:0,z:4,facing:NaN}}).mapPlayer.x,-3.1);
 assert.equal(transition(s,{type:'RESET'}).introSeen,false);
});
test('proximity has hysteresis and camera-relative movement is normalized',()=>{
 assert.equal(nearbyPlace([-3.1,5.8],1.25,'home'),'home');
 assert.equal(nearbyPlace([-3.1,6.1],1.25,'home'),null);
 assert.deepEqual(cameraDirection([0,-1],[0,-1]),[0,-1]);
 assert.deepEqual(cameraDirection([0,-1],[1,0]),[1,0]);
 const diagonal=cameraDirection([1,-1],[0,-1]);assert.ok(Math.abs(Math.hypot(...diagonal)-1)<1e-9);
 for(const fps of [30,60,120]){let p=[-3.1,4.4];for(let i=0;i<fps;i++)p=walkStep(p,[0,-1],2.65/fps);assert.ok(Math.abs(p[1]-1.75)<.001);}
});
