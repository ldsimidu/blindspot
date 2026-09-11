[CmdletBinding()]
param([string]$LedgerPath = (Join-Path $PSScriptRoot '..\RELEASES.md'))

$path = [IO.Path]::GetFullPath($LedgerPath)
if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Release ledger não encontrado: $path" }
$content = Get-Content -LiteralPath $path -Raw
$records = [regex]::Matches($content, '(?ms)^# Release (?<version>.+?)\r?\n(?<body>.*?)(?=^# Release |\z)') | ForEach-Object {
    $state = [regex]::Match($_.Groups['body'].Value, '(?m)^Estado:\s*`(?<state>[^`]+)`')
    [pscustomobject]@{ version = $_.Groups['version'].Value.Trim(); state = if ($state.Success) { $state.Groups['state'].Value } else { $null } }
}
$current = @($records | Where-Object state -eq 'released' | Select-Object -First 1)
[pscustomobject]@{ ledgerPath = $path; current = if ($current.Count) { $current[0].version } else { $null }; releases = @($records) } | ConvertTo-Json -Depth 3
