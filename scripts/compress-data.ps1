param(
  [string]$InputCsv = "data/utd_scores.csv",
  [string]$OutputGzip = "data/utd_scores.csv.gz"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputCsv)) {
  throw "Input file not found: $InputCsv"
}

$outDir = Split-Path -Parent $OutputGzip
if ($outDir -and -not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$inFile = Get-Item $InputCsv

$inStream = [System.IO.File]::OpenRead($InputCsv)
try {
  $outStream = [System.IO.File]::Create($OutputGzip)
  try {
    $gzip = New-Object System.IO.Compression.GZipStream(
      $outStream,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
    try {
      $inStream.CopyTo($gzip)
    } finally {
      $gzip.Dispose()
    }
  } finally {
    $outStream.Dispose()
  }
} finally {
  $inStream.Dispose()
}

$outFile = Get-Item $OutputGzip
$ratio = if ($inFile.Length -gt 0) { [math]::Round(($outFile.Length / $inFile.Length) * 100, 2) } else { 0 }

Write-Host "Compressed:"
Write-Host "  Input : $($inFile.FullName) ($([math]::Round($inFile.Length / 1MB, 2)) MB)"
Write-Host "  Output: $($outFile.FullName) ($([math]::Round($outFile.Length / 1MB, 2)) MB)"
Write-Host "  Size ratio: $ratio%"
