# Builds and runs every C++ module (Windows / PowerShell, needs g++ on PATH).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force -Path bin | Out-Null

$targets = @(
  @{ src = 'search/trie.cpp';            out = 'bin/trie.exe' },
  @{ src = 'search/skill_hashmap.cpp';   out = 'bin/skill_hashmap.exe' },
  @{ src = 'graph/connection_bfs.cpp';   out = 'bin/connection_bfs.exe' },
  @{ src = 'ranking/job_ranking.cpp';    out = 'bin/job_ranking.exe' }
)

foreach ($t in $targets) {
  Write-Host "== Building $($t.src)" -ForegroundColor Cyan
  g++ -std=c++11 -O2 -Wall -Wextra -o $t.out $t.src
  if ($LASTEXITCODE -ne 0) { throw "Build failed: $($t.src)" }
  Write-Host "== Running $($t.out)" -ForegroundColor Green
  # Empty stdin makes connection_bfs fall back to its built-in demo.
  '' | & ".\$($t.out)"
  if ($LASTEXITCODE -ne 0) { throw "Self-test failed: $($t.out)" }
}
Write-Host "`nAll C++ modules built and passed." -ForegroundColor Green
