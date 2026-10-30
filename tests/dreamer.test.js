import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDreamer} from '../src/dreamer.js';

test('walking articulates the boots without changing the navigation root',()=>{
  const {person,animate}=createDreamer();
  person.position.set(2,0,3);person.rotation.y=.7;
  const boot=person.getObjectByName('left-boot');
  const start=boot.getWorldPosition(new THREE.Vector3());
  animate(120,true,false);
  const moved=boot.getWorldPosition(new THREE.Vector3());
  assert.ok(start.distanceTo(moved)>.02);
  assert.equal(person.position.x,2);assert.equal(person.position.z,3);
  assert.equal(person.rotation.y,.7);
  animate(250,false,false);
  assert.ok(start.distanceTo(boot.getWorldPosition(new THREE.Vector3()))<1e-6);
});

test('reduced motion immediately restores a neutral stationary pose',()=>{
  const {person,animate}=createDreamer();
  const boot=person.getObjectByName('left-boot');
  const start=boot.getWorldPosition(new THREE.Vector3());
  animate(120,true,false);animate(150,true,true);
  assert.ok(start.distanceTo(boot.getWorldPosition(new THREE.Vector3()))<1e-6);
});
