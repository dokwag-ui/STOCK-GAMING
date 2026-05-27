$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$requiredFiles = @("index.html", "styles.css", "data.js", "engine.js", "game.js", "README.md")

foreach ($file in $requiredFiles) {
  $path = Join-Path $root $file
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing required file: $file"
  }
}

$index = Get-Content -LiteralPath (Join-Path $root "index.html") -Raw -Encoding UTF8
$data = Get-Content -LiteralPath (Join-Path $root "data.js") -Raw -Encoding UTF8
$engine = Get-Content -LiteralPath (Join-Path $root "engine.js") -Raw -Encoding UTF8
$game = Get-Content -LiteralPath (Join-Path $root "game.js") -Raw -Encoding UTF8
$styles = Get-Content -LiteralPath (Join-Path $root "styles.css") -Raw -Encoding UTF8

if ($index -notmatch '<script src="data\.js"></script>\s*<script src="engine\.js"></script>\s*<script src="game\.js"></script>') {
  throw "index.html does not load data.js, engine.js, and game.js in order"
}

if ($data -notmatch '2026 Current' -or $data -notmatch 'companyPool') {
  throw "data.js does not define the real-data company pool and 2026 Current step"
}

if (($data | Select-String -Pattern '"realName"' -AllMatches).Matches.Count -lt 35) {
  throw "data.js appears to contain fewer than 35 real companies"
}

if ($engine -notmatch 'Engine\.trade' -or $engine -notmatch 'Engine\.advanceStep' -or $engine -notmatch 'Engine\.rankInvestors' -or $engine -notmatch 'pickActiveCompanyIds') {
  throw "engine.js is missing required game engine functions"
}

if ($game -notmatch 'localStorage' -or $game -notmatch 'renderEndgame' -or $game -notmatch 'stockGameDebug') {
  throw "game.js is missing persistence, endgame rendering, or debug helpers"
}

$hiddenNames = @("Lockheed Martin", "NVIDIA", "Samsung Electronics", "Tesla", "Microsoft", "Alphabet", "NAVER")
foreach ($name in $hiddenNames) {
  if ($index.Contains($name) -or $game.Contains($name)) {
    throw "Hidden company name appears outside data/endgame flow: $name"
  }
}

if ($styles -notmatch 'dashboard-grid' -or $styles -notmatch '@media \(max-width: 680px\)') {
  throw "styles.css is missing dashboard layout or mobile responsive rules"
}

Write-Output "PASS: structure tests completed"
