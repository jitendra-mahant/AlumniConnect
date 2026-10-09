# C++ data-structure modules

Standalone C++11 implementations of the algorithms AlumniConnect uses. The Node API runs equivalent JS versions
(`backend/dsa/`) so no compiler is needed to run the app. Each program ends with `assert`-based self-tests.

| Folder | File | Algorithm |
|---|---|---|
| `search/` | `trie.cpp` | Trie with frequency-ranked prefix autocomplete |
| `search/` | `skill_hashmap.cpp` | `unordered_map` skill → alumni index with multi-skill intersection |
| `graph/` | `connection_bfs.cpp` | Undirected connection graph, BFS shortest path and "within N degrees" |
| `ranking/` | `job_ranking.cpp` | `std::priority_queue` max-heap job ranking |

```powershell
./build.ps1     # Windows: build + run all (needs g++)
make test       # Linux / macOS
```

Programs build into `bin/` (git-ignored). `connection_bfs` also reads a graph from stdin:
`N M`, then `M` lines `a b`, then `source target`.
