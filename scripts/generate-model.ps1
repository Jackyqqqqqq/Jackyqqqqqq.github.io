param(
  [string]$SourceImage = "source-avatar.png"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $ProjectRoot "tools\TripoSR\.venv\Scripts\python.exe"
$Prepared = Join-Path $ProjectRoot "tmp\triposr\input.png"
$Output = Join-Path $ProjectRoot "tmp\triposr\output"
$FinalModel = Join-Path $ProjectRoot "public\models\avatar.glb"

if (-not (Test-Path -LiteralPath $Python)) {
  throw "TripoSR environment not found: $Python"
}

& $Python (Join-Path $PSScriptRoot "prepare_triposr_input.py") (Join-Path $ProjectRoot $SourceImage) $Prepared
if ($LASTEXITCODE -ne 0) { throw "Portrait preprocessing failed with exit code $LASTEXITCODE" }
& $Python (Join-Path $ProjectRoot "tools\TripoSR\run.py") $Prepared `
  --output-dir $Output `
  --model-save-format glb `
  --no-remove-bg `
  --chunk-size 4096 `
  --mc-resolution 192
if ($LASTEXITCODE -ne 0) { throw "TripoSR generation failed with exit code $LASTEXITCODE" }

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $FinalModel) | Out-Null
Copy-Item -LiteralPath (Join-Path $Output "0\mesh.glb") -Destination $FinalModel -Force
Write-Host "GLB ready: $FinalModel"
