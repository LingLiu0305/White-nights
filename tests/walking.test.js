import test from 'node:test';
import assert from 'node:assert/strict';
import {canWalk, nearbyPlace, pavingHeight, routeOnPaving, walkStep} from '../src/walking.js';

test('walking follows banks and crosses only at a bridge', () => {
  assert.equal(canWalk(0, 4), false);
  assert.equal(canWalk(0, 1.3), true);
  const bankEdge = walkStep([-3.1, 4.4], [1, 0], 6);
  assert.ok(bankEdge[0] > -3.1 && bankEdge[0] < -2.55 && bankEdge[1] === 4.4);
  const across = walkStep([-3.1, 1.3], [1, 0], 6.2);
  assert.ok(across[0] > 2.9);
  assert.ok(walkStep([0, 1.3], [0, -1], 2)[1] > .8);
});

test('walking has sensible limits and place proximity', () => {
  assert.equal(walkStep([-3.1, 7.9], [0, 1], 5)[1] <= 8, true);
  assert.equal(nearbyPlace([-3.1, 4.4]), 'home');
  assert.equal(nearbyPlace([3.1, -3.8]), 'house');
  assert.equal(nearbyPlace([0, -5.5]), 'bridge');
  assert.equal(nearbyPlace([-3.1, -2]), null);
  assert.ok(pavingHeight(0, 1.3) > pavingHeight(3.7, 1.3));
  assert.ok(pavingHeight(3.1, 1.3) > pavingHeight(3.1, 1.6));
  assert.ok(pavingHeight(3.1, 1.6) > pavingHeight(3.1, 1.9));
});

test('journey from either bank remains on the paving', () => {
  for (const [start, end] of [[[-3.1, 4.4], [3.1, 1.3]], [[3.1, -3.8], [-3.1, 4.4]], [[0, -5.5], [3.1, 1.3]]]) {
    const route = routeOnPaving(start, end);
    for (let i = 1; i < route.length; i++) {
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        const x = route[i - 1][0] * (1 - t) + route[i][0] * t;
        const z = route[i - 1][1] * (1 - t) + route[i][1] * t;
        assert.ok(canWalk(x, z), `${x}, ${z} left the path`);
      }
    }
  }
});

test('a journey beginning at its destination keeps two animation waypoints', () => {
  const place = [3.1, 1.3];
  assert.deepEqual(routeOnPaving(place, place), [place, place]);
});
