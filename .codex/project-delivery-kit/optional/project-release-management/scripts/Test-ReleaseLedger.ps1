[CmdletBinding()]
param([string]$LedgerPath = (Join-Path $PSScriptRoot '..\RELEASES.md'))

$result = & (Join-Path $PSScriptRoot 'Get-ReleaseLedger.ps1') -LedgerPath $LedgerPath | ConvertFrom-Json
$allowed = @('draft', 'candidate', 'released', 'withdrawn', 'superseded')
$seen = @{}
foreach ($release in @($result.releases)) {
    if ($seen.ContainsKey($release.version)) { throw "Versão duplicada no Release Ledger: $($release.version)" }
    $seen[$release.version] = $true
    if ($release.state -notin $allowed) { throw "Estado inválido para $($release.version): $($release.state)" }
}
Write-Output "Release Ledger válido. Versão atual: $($result.current ?? 'nenhuma declarada')."
