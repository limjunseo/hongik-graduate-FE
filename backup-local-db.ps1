param(
    [string]$BackendPath = "",
    [string]$DatabaseFile = "",
    [string]$BackupDirectory = ""
)
$ErrorActionPreference = 'Stop'

function Fail([string]$message) {
    Write-Host "[stori backup] $message" -ForegroundColor Red
    exit 1
}

$parent = Split-Path -Parent $PSScriptRoot
if ($BackendPath) {
    $root = (Resolve-Path -LiteralPath $BackendPath -ErrorAction Stop).Path
} elseif (Test-Path -LiteralPath (Join-Path $parent 'hongik-graduate-BE\be')) {
    $root = Join-Path $parent 'hongik-graduate-BE'
} elseif (Test-Path -LiteralPath (Join-Path $parent '졸프\be')) {
    $root = Join-Path $parent '졸프'
} else {
    Fail 'Backend was not found. Clone the BE repository or pass -BackendPath.'
}

$be = Join-Path $root 'be'
if (-not (Test-Path -LiteralPath $be)) {
    Fail "Backend directory does not exist: $be"
}

$base = if ($DatabaseFile) {
    if ([System.IO.Path]::IsPathRooted($DatabaseFile)) {
        $DatabaseFile
    } else {
        Join-Path $be $DatabaseFile
    }
} else {
    Join-Path $be 'data\hongik-graduate'
}

$source = if ($base.EndsWith('.mv.db')) { $base } else { $base + '.mv.db' }
if (-not (Test-Path -LiteralPath $source)) {
    Fail "Database file is missing: $source. Start the backend once to initialize it."
}

$destination = if ($BackupDirectory) { $BackupDirectory } else { Join-Path $be 'data\backups' }
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$stamp = (Get-Date -Format 'yyyyMMdd_HHmmss_fff')
$target = Join-Path $destination ("hongik-graduate_$stamp" + '_' + [Guid]::NewGuid().ToString('N').Substring(0, 6) + '.mv.db')

# Exclusive access prevents an unsafe file-level backup while H2 is writing.
# If running, stop the backend with Ctrl+C and retry; do not copy an open .mv.db file.
try {
    $inputStream = [System.IO.File]::Open($source, [System.IO.FileMode]::Open,
        [System.IO.FileAccess]::Read, [System.IO.FileShare]::None)
} catch [System.IO.IOException] {
    Fail 'Database is in use. Stop the Spring Boot backend, then run this backup again.'
}
try {
    if ($inputStream.Length -lt 1024) {
        Fail 'The database file is empty or incomplete. Backup was not created.'
    }
    $outputStream = [System.IO.File]::Open($target, [System.IO.FileMode]::CreateNew,
        [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
        $inputStream.CopyTo($outputStream)
        $outputStream.Flush()
    } finally {
        $outputStream.Dispose()
    }
} finally {
    $inputStream.Dispose()
}
Write-Host "[stori backup] Created: $target" -ForegroundColor Green
Write-Host "[stori backup] Preserve this file outside your Git checkout if you plan to delete the repository."
