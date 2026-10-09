/**
 * Breadth-first search over the connection graph (undirected, accepted connections).
 * Mirrors cpp/graph/connection_bfs.cpp.
 *
 * @param edges  array of [userIdA, userIdB]
 * @returns shortest path as an array of ids from `source` to `target`, or null.
 */
function buildGraph(edges) {
  const adj = new Map();
  const link = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  };
  for (const [a, b] of edges) {
    link(String(a), String(b));
    link(String(b), String(a));
  }
  return adj;
}

function shortestPath(adj, source, target) {
  source = String(source);
  target = String(target);
  if (source === target) return [source];
  if (!adj.has(source) || !adj.has(target)) return null;

  const parent = new Map([[source, null]]);
  const queue = [source];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const next of adj.get(cur) || []) {
      if (parent.has(next)) continue;
      parent.set(next, cur);
      if (next === target) {
        const path = [];
        for (let n = target; n !== null; n = parent.get(n)) path.push(n);
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

// Everyone reachable within `maxDepth` hops, with their distance.
function withinDegrees(adj, source, maxDepth = 2) {
  source = String(source);
  const dist = new Map([[source, 0]]);
  const queue = [source];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (dist.get(cur) >= maxDepth) continue;
    for (const next of adj.get(cur) || []) {
      if (dist.has(next)) continue;
      dist.set(next, dist.get(cur) + 1);
      queue.push(next);
    }
  }
  dist.delete(source);
  return dist;
}

module.exports = { buildGraph, shortestPath, withinDegrees };
