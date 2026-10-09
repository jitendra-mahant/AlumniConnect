// Connection graph + BFS: shortest path / degrees of separation between members.
// JS counterpart used by the API: backend/dsa/graph.js
//
// Build:  g++ -std=c++11 -O2 -o ../bin/connection_bfs connection_bfs.cpp
// Run:    ../bin/connection_bfs                    (demo + self-test)
//         ../bin/connection_bfs  < edges.txt       (reads "N M" then M lines "a b", then "source target")
#include <algorithm>
#include <cassert>
#include <iostream>
#include <queue>
#include <vector>

class ConnectionGraph {
    std::vector<std::vector<int> > adj;

public:
    explicit ConnectionGraph(int n) : adj(n) {}

    void addConnection(int a, int b) {  // undirected: accepted connections go both ways
        adj[a].push_back(b);
        adj[b].push_back(a);
    }

    // Shortest path via BFS in O(V + E). Empty vector if unreachable.
    std::vector<int> shortestPath(int source, int target) const {
        std::vector<int> parent(adj.size(), -2);  // -2 = unvisited
        std::queue<int> q;
        parent[source] = -1;
        q.push(source);
        while (!q.empty()) {
            int cur = q.front();
            q.pop();
            if (cur == target) break;
            for (size_t i = 0; i < adj[cur].size(); ++i) {
                int nxt = adj[cur][i];
                if (parent[nxt] != -2) continue;
                parent[nxt] = cur;
                q.push(nxt);
            }
        }
        std::vector<int> path;
        if (parent[target] == -2) return path;
        for (int n = target; n != -1; n = parent[n]) path.push_back(n);
        std::reverse(path.begin(), path.end());
        return path;
    }

    // Members reachable within maxDepth hops (e.g. "people you may know" = depth 2).
    std::vector<int> withinDegrees(int source, int maxDepth) const {
        std::vector<int> dist(adj.size(), -1), out;
        std::queue<int> q;
        dist[source] = 0;
        q.push(source);
        while (!q.empty()) {
            int cur = q.front();
            q.pop();
            if (dist[cur] == maxDepth) continue;
            for (size_t i = 0; i < adj[cur].size(); ++i) {
                int nxt = adj[cur][i];
                if (dist[nxt] != -1) continue;
                dist[nxt] = dist[cur] + 1;
                out.push_back(nxt);
                q.push(nxt);
            }
        }
        return out;
    }
};

int main() {
    int n = 0, m = 0;
    if (std::cin >> n >> m && n > 0) {
        ConnectionGraph g(n);
        for (int i = 0; i < m; ++i) { int a, b; std::cin >> a >> b; g.addConnection(a, b); }
        int s, t;
        std::cin >> s >> t;
        std::vector<int> p = g.shortestPath(s, t);
        if (p.empty()) std::cout << "No path\n";
        else { for (size_t i = 0; i < p.size(); ++i) std::cout << p[i] << (i + 1 < p.size() ? " -> " : "\n"); }
        return 0;
    }

    // Demo: 0=student A, 1=alumna P, 2=student B, 3=alumnus K, 4=alumna M (isolated)
    ConnectionGraph g(6);
    g.addConnection(0, 1);
    g.addConnection(2, 1);
    g.addConnection(2, 3);

    std::vector<int> p = g.shortestPath(0, 3);
    assert(p.size() == 4);          // 0 -> 1 -> 2 -> 3  (3 hops)
    assert(g.shortestPath(0, 4).empty());
    assert(g.shortestPath(2, 2).size() == 1);
    assert(g.withinDegrees(0, 2).size() == 2);  // alumna P (1 hop) and student B (2 hops)

    std::cout << "Path 0 -> 3: ";
    for (size_t i = 0; i < p.size(); ++i) std::cout << p[i] << (i + 1 < p.size() ? " -> " : "\n");
    std::cout << "Connection BFS self-test passed.\n";
    return 0;
}
