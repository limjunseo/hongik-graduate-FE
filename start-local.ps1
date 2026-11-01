param(
    [string]$BackendPath = "",
    [switch]$FrontendOnly,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$feRoot = $PSScriptRoot
$parent = Split-Path -Parent $feRoot

function Note([string]$msg) { Write-Host "[stori] $msg" -ForegroundColor Cyan }
function Fail([string]$msg) { Write-Host "[stori] $msg" -ForegroundColor Red; exit 1 }
function Require-Command([string]$command, [string]$help) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { Fail "$command not found. $help" }
}
function Port-InUse([int]$port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $result = $client.BeginConnect("127.0.0.1", $port, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne(450)) { return $false }
        $client.EndConnect($result)
        return $true
    } catch { return $false }
    finally { $client.Close() }
}
function Launch-Terminal([string]$directory, [string]$command, [string]$title) {
    $escaped = $directory.Replace("'", "''")
    $script = "[Console]::Title = '$title'; Set-Location -LiteralPath '$escaped'; $command"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $script
    ) | Out-Null
}

Note 'Checking local development tools...'
Require-Command 'node.exe' 'Install Node.js 22+ from https://nodejs.org/'
Require-Command 'npm.cmd' 'Install Node.js with npm.'
$nodeMajor = [int]((node.exe --version) -replace '^v(\d+).*$', '$1')
if ($nodeMajor -lt 22) { Fail 'Node.js 22+ is required for this frontend.' }

if (-not $FrontendOnly) {
    Require-Command 'git.exe' 'Install Git from https://git-scm.com/'
    Require-Command 'java.exe' 'Install a JDK (17 or newer).'
    $versionText = (cmd.exe /c 'java -version 2>&1' | Out-String)
    if ($versionText -notmatch 'version\s+"(?:1\.)?(\d+)') {
        Fail 'Java version could not be detected. Please configure JDK 17+.'
    }
    if ([int]$Matches[1] -lt 17) { Fail 'Java 17 or newer is required.' }

    if ($BackendPath) {
        $beRoot = (Resolve-Path -LiteralPath $BackendPath -ErrorAction Stop).Path
    } elseif (Test-Path -LiteralPath (Join-Path $parent 'hongik-graduate-BE\be\mvnw.cmd')) {
        $beRoot = Join-Path $parent 'hongik-graduate-BE'
    } elseif (Test-Path -LiteralPath (Join-Path $parent '졸프\be\mvnw.cmd')) {
        $beRoot = Join-Path $parent '졸프'
    } else {
        $beRoot = Join-Path $parent 'hongik-graduate-BE'
        Note "Backend repository is missing. Cloning to $beRoot"
        & git.exe clone 'https://github.com/limjunseo/hongik-graduate-BE.git' $beRoot
        if ($LASTEXITCODE -ne 0) { Fail 'Backend clone failed. Check Git/network access.' }
    }
    $beDir = Join-Path $beRoot 'be'
    if (-not (Test-Path -LiteralPath (Join-Path $beDir 'mvnw.cmd'))) {
        Fail "Backend Maven Wrapper not found: $beDir"
    }
    $secretFile = Join-Path $beDir '.env-local'
    if (-not (Test-Path -LiteralPath $secretFile)) {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $secret = [Convert]::ToBase64String($bytes)
        [System.IO.File]::WriteAllText($secretFile, "JWT_SECRET=$secret" + [Environment]::NewLine)
        Note 'Generated local JWT secret in be/.env-local (git-ignored).'
        Note 'Optional: add AI_API_KEY=... to that file to enable AI generation.'
    } else {
        $configText = [System.IO.File]::ReadAllText($secretFile)
        if ($configText -notmatch '(?m)^\s*JWT_SECRET=\S+') {
            $bytes = New-Object byte[] 32
            $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
            try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
            $secret = [Convert]::ToBase64String($bytes)
            [System.IO.File]::AppendAllText($secretFile, [Environment]::NewLine + "JWT_SECRET=$secret" + [Environment]::NewLine)
            Note 'Added a missing local JWT secret without altering other settings.'
        }
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $feRoot 'node_modules\.package-lock.json'))) {
    Note 'Installing frontend packages with npm ci...'
    Push-Location $feRoot
    try {
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Fail 'npm ci failed. Check Node.js and network access.' }
    } finally { Pop-Location }
}

function Is-Our-Backend([int]$port) {
    try {
        $r = Invoke-WebRequest -Uri ("http://127.0.0.1:" + $port + "/v3/api-docs") -UseBasicParsing -TimeoutSec 4
        return ($r.StatusCode -eq 200 -and $r.Content.Contains('/api/experiences'))
    } catch { return $false }
}

$backendPort = 8080
if (-not $FrontendOnly) {
    if (Port-InUse 8080) {
        if (Is-Our-Backend 8080) {
            Note 'An existing stori backend is listening on port 8080; reusing it.'
        } else {
            Note 'Port 8080 belongs to another service. Looking for an existing stori backend.'
            $existingBackendPort = $null
            foreach ($candidate in 8081..8090) {
                if ((Port-InUse $candidate) -and (Is-Our-Backend $candidate)) {
                    $existingBackendPort = $candidate
                    break
                }
            }
            if ($null -ne $existingBackendPort) {
                $backendPort = $existingBackendPort
                Note "Reusing existing stori backend on port $backendPort."
            } else {
                $backendPort = 8081
                while ($backendPort -le 8090 -and (Port-InUse $backendPort)) {
                    $backendPort++
                }
                if ($backendPort -gt 8090) { Fail 'No available backend port in 8081-8090.' }
                Note "Selected free backend port $backendPort."
            }
        }
    }
    if (-not (Port-InUse $backendPort)) {
        Note "Starting Spring Boot in a separate terminal (port $backendPort)..."
        $startBe = '$env:SERVER_PORT="' + $backendPort + '"; & .\mvnw.cmd spring-boot:run'
        Launch-Terminal $beDir $startBe 'stori BACKEND'
    }
}
if (Port-InUse 5173) {
    try {
        $front = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 4
        if ($front.StatusCode -ne 200 -or -not $front.Content.Contains('stori')) {
            Fail 'Port 5173 belongs to a different application. Close it and run the script again.'
        }
    } catch {
        Fail 'Port 5173 is occupied but the frontend is not responding. Close it and retry.'
    }
    Note 'Reusing existing stori frontend on 5173. If backend changed, restart the frontend window.'
} else {
    Note 'Starting Vite in a separate terminal (port 5173)...'
    $startFe = '$env:LOCAL_BACKEND_PORT="' + $backendPort + '"; & npm.cmd run dev'
    Launch-Terminal $feRoot $startFe 'stori FRONTEND'
}

Note 'Frontend URL: http://localhost:5173'
Note "Backend URL:  http://localhost:$backendPort/swagger-ui.html"
Note 'A fresh local install may need time for Maven dependencies. Watch both terminal windows.'
Note 'To stop servers: close their terminal windows or press Ctrl+C in each.'
if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process 'http://localhost:5173' | Out-Null
}
