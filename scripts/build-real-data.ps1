$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputPath = Join-Path $root "data.js"
$startDate = [DateTimeOffset]::Parse("2012-01-01T00:00:00Z").ToUnixTimeSeconds()
$endDate = [DateTimeOffset]::Parse("2026-05-28T00:00:00Z").ToUnixTimeSeconds()
$baseGamePrice = 10000

$companies = @(
  @{ id="def-a"; theme="Defense"; aliasBase="Defense"; realName="Lockheed Martin"; symbol="LMT"; market="USA"; hint="Large aerospace and defense contractor" },
  @{ id="def-b"; theme="Defense"; aliasBase="Defense"; realName="RTX"; symbol="RTX"; market="USA"; hint="Aerospace, engines, missiles, and defense systems" },
  @{ id="def-c"; theme="Defense"; aliasBase="Defense"; realName="Northrop Grumman"; symbol="NOC"; market="USA"; hint="Aerospace, space, and defense electronics" },
  @{ id="def-d"; theme="Defense"; aliasBase="Defense"; realName="General Dynamics"; symbol="GD"; market="USA"; hint="Defense platforms and mission systems" },
  @{ id="def-e"; theme="Defense"; aliasBase="Defense"; realName="Huntington Ingalls Industries"; symbol="HII"; market="USA"; hint="Naval shipbuilding and defense contracts" },

  @{ id="semi-a"; theme="Semiconductor"; aliasBase="Semiconductor"; realName="NVIDIA"; symbol="NVDA"; market="USA"; hint="GPU and AI accelerator leader" },
  @{ id="semi-b"; theme="Semiconductor"; aliasBase="Semiconductor"; realName="AMD"; symbol="AMD"; market="USA"; hint="CPU and GPU semiconductor competitor" },
  @{ id="semi-c"; theme="Semiconductor"; aliasBase="Semiconductor"; realName="Intel"; symbol="INTC"; market="USA"; hint="Traditional PC and server chip company" },
  @{ id="semi-d"; theme="Semiconductor"; aliasBase="Semiconductor"; realName="Qualcomm"; symbol="QCOM"; market="USA"; hint="Mobile chips and wireless licensing" },
  @{ id="semi-e"; theme="Semiconductor"; aliasBase="Semiconductor"; realName="TSMC"; symbol="TSM"; market="Taiwan/ADR"; hint="Global foundry leader" },

  @{ id="auto-a"; theme="Automotive"; aliasBase="Automotive"; realName="Tesla"; symbol="TSLA"; market="USA"; hint="Electric vehicles and energy storage" },
  @{ id="auto-b"; theme="Automotive"; aliasBase="Automotive"; realName="Toyota"; symbol="TM"; market="Japan/ADR"; hint="Hybrid strength and global vehicle scale" },
  @{ id="auto-c"; theme="Automotive"; aliasBase="Automotive"; realName="General Motors"; symbol="GM"; market="USA"; hint="US automaker and EV transition" },
  @{ id="auto-d"; theme="Automotive"; aliasBase="Automotive"; realName="Ford"; symbol="F"; market="USA"; hint="Trucks, mass-market vehicles, and EV transition" },
  @{ id="auto-e"; theme="Automotive"; aliasBase="Automotive"; realName="Stellantis"; symbol="STLA"; market="Europe/USA"; hint="Global multi-brand automaker" },

  @{ id="ship-a"; theme="Shipbuilding"; aliasBase="Shipbuilding"; realName="Mitsubishi Heavy Industries"; symbol="7011.T"; market="Japan"; hint="Heavy industry, shipbuilding, defense, and energy equipment" },
  @{ id="ship-b"; theme="Shipbuilding"; aliasBase="Shipbuilding"; realName="Kawasaki Heavy Industries"; symbol="7012.T"; market="Japan"; hint="Ships, rail, and aerospace heavy industry" },
  @{ id="ship-c"; theme="Shipbuilding"; aliasBase="Shipbuilding"; realName="IHI"; symbol="7013.T"; market="Japan"; hint="Heavy industry, aero engines, and marine equipment" },
  @{ id="ship-d"; theme="Shipbuilding"; aliasBase="Shipbuilding"; realName="Mitsui E&S"; symbol="7003.T"; market="Japan"; hint="Shipbuilding and marine engineering cycle exposure" },
  @{ id="ship-e"; theme="Shipbuilding"; aliasBase="Shipbuilding"; realName="Nippon Yusen"; symbol="9101.T"; market="Japan"; hint="Shipping and vessel-cycle exposure" },

  @{ id="bio-a"; theme="Bio"; aliasBase="Bio"; realName="Pfizer"; symbol="PFE"; market="USA"; hint="Large pharmaceutical portfolio and vaccine events" },
  @{ id="bio-b"; theme="Bio"; aliasBase="Bio"; realName="Gilead Sciences"; symbol="GILD"; market="USA"; hint="Antiviral therapies and drug pipeline" },
  @{ id="bio-c"; theme="Bio"; aliasBase="Bio"; realName="Amgen"; symbol="AMGN"; market="USA"; hint="Biologic medicines and cash-flow stability" },
  @{ id="bio-d"; theme="Bio"; aliasBase="Bio"; realName="Regeneron"; symbol="REGN"; market="USA"; hint="Antibody therapies and R&D events" },
  @{ id="bio-e"; theme="Bio"; aliasBase="Bio"; realName="Biogen"; symbol="BIIB"; market="USA"; hint="Neurology drugs and clinical-event sensitivity" },

  @{ id="ent-a"; theme="Entertainment"; aliasBase="Entertainment"; realName="Netflix"; symbol="NFLX"; market="USA"; hint="Streaming platform and original content" },
  @{ id="ent-b"; theme="Entertainment"; aliasBase="Entertainment"; realName="Disney"; symbol="DIS"; market="USA"; hint="IP, parks, studios, and streaming" },
  @{ id="ent-c"; theme="Entertainment"; aliasBase="Entertainment"; realName="Warner Bros. Discovery"; symbol="WBD"; market="USA"; hint="Media networks and streaming transition" },
  @{ id="ent-d"; theme="Entertainment"; aliasBase="Entertainment"; realName="Live Nation Entertainment"; symbol="LYV"; market="USA"; hint="Concerts, ticketing, and live events" },
  @{ id="ent-e"; theme="Entertainment"; aliasBase="Entertainment"; realName="Sony"; symbol="SONY"; market="Japan/ADR"; hint="Games, music, films, and IP" },

  @{ id="aiit-a"; theme="AI/IT"; aliasBase="AI/IT"; realName="Microsoft"; symbol="MSFT"; market="USA"; hint="Cloud and productivity software base" },
  @{ id="aiit-b"; theme="AI/IT"; aliasBase="AI/IT"; realName="Alphabet"; symbol="GOOGL"; market="USA"; hint="Search advertising and AI research base" },
  @{ id="aiit-c"; theme="AI/IT"; aliasBase="AI/IT"; realName="Apple"; symbol="AAPL"; market="USA"; hint="Consumer devices, services, silicon, and AI features" },
  @{ id="aiit-d"; theme="AI/IT"; aliasBase="AI/IT"; realName="IBM"; symbol="IBM"; market="USA"; hint="Enterprise IT, consulting, and hybrid cloud" },
  @{ id="aiit-e"; theme="AI/IT"; aliasBase="AI/IT"; realName="Oracle"; symbol="ORCL"; market="USA"; hint="Databases and cloud infrastructure" }
)

function Get-QuarterLabel([DateTime]$date) {
  $quarter = [Math]::Ceiling($date.Month / 3)
  return "$($date.Year) Q$quarter"
}

function Get-Steps {
  $items = @()
  for ($year = 2012; $year -le 2025; $year++) {
    for ($quarter = 1; $quarter -le 4; $quarter++) {
      $items += [ordered]@{ id = $items.Count; year = $year; quarter = $quarter; label = "$year Q$quarter" }
    }
  }
  $items += [ordered]@{ id = $items.Count; year = 2026; quarter = "Current"; label = "2026 Current" }
  return $items
}

function Get-YahooRows($symbol) {
  $encodedSymbol = [Uri]::EscapeDataString($symbol)
  $url = "https://query1.finance.yahoo.com/v8/finance/chart/$encodedSymbol`?period1=$startDate&period2=$endDate&interval=1d&events=history&includeAdjustedClose=true"
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing
  $json = $response.Content | ConvertFrom-Json
  if ($null -eq $json.chart.result -or $json.chart.result.Count -eq 0) {
    throw "No chart data for $symbol"
  }
  $result = $json.chart.result[0]
  $timestamps = $result.timestamp
  $adjclose = $result.indicators.adjclose[0].adjclose
  $rows = @()
  for ($i = 0; $i -lt $timestamps.Count; $i++) {
    if ($null -eq $adjclose[$i]) { continue }
    $date = ([DateTimeOffset]::FromUnixTimeSeconds([int64]$timestamps[$i])).UtcDateTime.Date
    $rows += [ordered]@{ date = $date; close = [double]$adjclose[$i] }
  }
  return $rows
}

function Convert-ToQuarterPrices($rows, $steps) {
  $byQuarter = @{}
  foreach ($row in $rows) {
    $label = Get-QuarterLabel $row.date
    if ($row.date.Year -lt 2012) { continue }
    if ($row.date.Year -gt 2026) { continue }
    $byQuarter[$label] = $row
    if ($row.date.Year -eq 2026) {
      $byQuarter["2026 Current"] = $row
    }
  }

  $baseRow = $byQuarter["2012 Q1"]
  if ($null -eq $baseRow) {
    throw "Missing 2012 Q1 base price"
  }

  $lastKnown = $null
  $prices = @()
  foreach ($step in $steps) {
    $row = $byQuarter[$step.label]
    if ($null -eq $row) {
      if ($null -eq $lastKnown) {
        throw "Missing required price for $($step.label)"
      }
      $row = $lastKnown
    }
    $normalized = [Math]::Max(100, [Math]::Round(($row.close / $baseRow.close) * $baseGamePrice))
    $prices += [int]$normalized
    $lastKnown = $row
  }
  return $prices
}

$steps = Get-Steps
$themes = @("Defense", "Semiconductor", "Automotive", "Shipbuilding", "Bio", "Entertainment", "AI/IT")
$builtCompanies = @()

foreach ($company in $companies) {
  Write-Host "Fetching $($company.symbol) - $($company.realName)"
  $rows = Get-YahooRows $company.symbol
  $prices = Convert-ToQuarterPrices $rows $steps
  $letterIndex = [int][char]($company.id.Substring($company.id.Length - 1).ToUpper()) - [int][char]'A'
  $alias = "$($company.aliasBase)-$([char]([int][char]'A' + $letterIndex))"
  $builtCompanies += [ordered]@{
    id = $company.id
    theme = $company.theme
    alias = $alias
    realName = $company.realName
    symbol = $company.symbol
    market = $company.market
    descriptionHint = $company.hint
    prices = $prices
    events = [ordered]@{
      "0" = "The game starts from real 2012 Q1 quarter-end adjusted close data."
      "32" = "The 2020 market shock period is reflected from real adjusted prices."
      "44" = "Theme differences widen after 2023. Watch the real price trend."
      "56" = "Final current step. Hidden company names will be revealed soon."
    }
  }
}

$payload = [ordered]@{
  source = [ordered]@{
    provider = "Yahoo Finance chart endpoint"
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    priceBasis = "Daily adjusted close, sampled at quarter-end and normalized to 2012 Q1 = 10000"
  }
  initialCash = 100000000
  themes = $themes
  steps = $steps
  companyPool = $builtCompanies
}

$jsonText = $payload | ConvertTo-Json -Depth 20
$content = @"
(function () {
  window.STOCK_GAME_DATA = $jsonText;
})();
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding UTF8
Write-Host "Wrote $outputPath"
