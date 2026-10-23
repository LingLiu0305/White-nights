// Walkable paving on both banks and across the two bridges. The narrow
// connection prevents the character from walking through water or facades.
export const BRIDGES = [1.3, -5.5];
export const WALK_START = [-3.1, 4.4];
export const WALK_PLACES = {
  home: [-3.1, 4.4],
  canal: [3.1, 1.3],
  house: [3.1, -3.8],
  bridge: [0, -5.5],
};

export function canWalk(x, z) {
  if (z < -8 || z > 8) return false;
  const bank = Math.abs(x) >= 2.55 && Math.abs(x) <= 3.7;
  const crossing = Math.abs(x) <= 3.7 && BRIDGES.some(bridge => Math.abs(z - bridge) <= .48);
  return bank || crossing;
}

export function walkStep(position, direction, distance) {
  const length = Math.hypot(direction[0], direction[1]);
  if (!length || distance <= 0) return position;
  let [x, z] = position;
  const steps = Math.max(1, Math.ceil(distance / .1));
  const dx = direction[0] / length * distance / steps;
  const dz = direction[1] / length * distance / steps;
  for (let i = 0; i < steps; i++) {
    if (canWalk(x + dx, z)) x += dx;
    if (canWalk(x, z + dz)) z += dz;
  }
  return [x, z];
}

export function nearbyPlace(position, radius = 1.25) {
  let closest = null, best = radius;
  for (const [id, point] of Object.entries(WALK_PLACES)) {
    const distance = Math.hypot(position[0] - point[0], position[1] - point[1]);
    if (distance < best) { closest = id; best = distance; }
  }
  return closest;
}

export function routeOnPaving(start, end) {
  const startSide = Math.sign(start[0]) || Math.sign(end[0]) || -1;
  const endSide = Math.sign(end[0]) || startSide;
  const route = [start];
  if (Math.abs(start[0]) < 2.55) route.push([startSide * 3.1, start[1]]);
  if (startSide !== endSide) {
    const bridge = BRIDGES.reduce((best, z) =>
      Math.abs(start[1] - z) + Math.abs(end[1] - z) < Math.abs(start[1] - best) + Math.abs(end[1] - best) ? z : best
    );
    route.push([startSide * 3.1, bridge], [endSide * 3.1, bridge]);
  }
  route.push([endSide * 3.1, end[1]], end);
  const distinct = route.filter((point, index) => !index || Math.hypot(point[0] - route[index - 1][0], point[1] - route[index - 1][1]) > .01);
  // The travel animation always interpolates between two points, even when
  // the reader resumes while already standing at this chapter's destination.
  return distinct.length === 1 ? [distinct[0], [...distinct[0]]] : distinct;
}

export function pavingHeight(x, z) {
  const distance = Math.min(...BRIDGES.map(bridge => Math.abs(z - bridge)));
  if (distance >= .48 || Math.abs(x) > 3.7) return .17;
  const rise = Math.min(1, (.48 - distance) / .34);
  const deck = Math.abs(x) >= 3
    ? .17 + (.9 - .17) * (3.7 - Math.abs(x)) / .7
    : .9 + .4 * (1 - (x / 3) ** 2);
  return .17 + (deck - .17) * rise;
}
