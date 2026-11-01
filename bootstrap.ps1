[CmdletBinding()]
param(
    [string]$WorkspaceRoot = (Join-Path $env:USERPROFILE 'stori-workspace'),
    [switch]$NoBrowser,
    [switch]$SkipInstall,
    [switch]$SkipLaunch,
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'

# Windows 10/11 one-command setup. Never deletes DB files or overwrites secrets.
function Info([string]$m) { Write-Host "[stori setup] $m" -ForegroundColor Cyan }
function Die([string]$m) { Write-Host "[stori setup] ERROR: $m" -ForegroundColor Red; exit 1 }
function Has([string]$name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }
function NodeMajor {
    if (-not (Has 'node.exe')) { return 0 }
    try { if ((& node.exe --version | Out-String) -match 'v(\d+)') { return [int]$Matches[1] } } catch {}
    return 0
}
function JavaMajor {
    if (-not (Has 'java.exe')) { return 0 }
    try {
        $v = (cmd.exe /c 'java -version 2>&1' | Out-String)
        if ($v -match 'version\s+"(?:1\.)?(\d+)' -or $v -match 'openjdk\s+(\d+)') {
            return [int]$Matches[1]
        }
    } catch {}
    return 0
}
function GitReady {
    if (-not (Has 'git.exe')) { return $false }
    try { & git.exe --version | Out-Null; return ($LASTEXITCODE -eq 0) } catch { return $false }
}
function RefreshPath {
    $parts = New-Object 'System.Collections.Generic.List[string]'
    foreach ($scope in @('Machine', 'User', 'Process')) {
        $value = [Environment]::GetEnvironmentVariable('Path', $scope)
        if ($value) {
            foreach ($entry in ($value -split ';')) {
                if ($entry.Trim() -and -not $parts.Contains($entry.Trim())) { [void]$parts.Add($entry.Trim()) }
            }
        }
    }
    $common = @((Join-Path $env:ProgramFiles 'Git\cmd'), (Join-Path $env:ProgramFiles 'nodejs'))
    $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
    if (-not $javaHome) { $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User') }
    if ($javaHome) { $env:JAVA_HOME = $javaHome; $common += (Join-Path $javaHome 'bin') }
    $microsoft = Join-Path $env:ProgramFiles 'Microsoft'
    if (Test-Path -LiteralPath $microsoft) {
        $common += @(Get-ChildItem $microsoft -Directory -Filter 'jdk*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'bin' })
    }
    foreach ($entry in $common) {
        if ($entry -and (Test-Path -LiteralPath $entry) -and -not $parts.Contains($entry)) { $parts.Insert(0, $entry) }
    }
    $env:Path = ($parts -join ';')
}
function Install([string]$name, [string]$id) {
    if ($SkipInstall) { Die "$name is missing and -SkipInstall was supplied." }
    if (-not (Has 'winget.exe')) { Die 'winget was not found. Install Microsoft App Installer, then retry.' }
    Info "Installing $name using winget ($id). Windows may request administrator approval."
    & winget.exe install --id $id --exact --source winget --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { Die "winget installation of $name failed (code $LASTEXITCODE)." }
    RefreshPath
}
function Git([string[]]$arguments) {
    & git.exe @arguments
    if ($LASTEXITCODE -ne 0) { Die ("Git failed: " + ($arguments -join ' ')) }
}
Info 'Windows one-command bootstrap'
Info "Workspace: $WorkspaceRoot"
RefreshPath
$gitReady = GitReady
$nodeVersion = NodeMajor
$javaVersion = JavaMajor
if ($DryRun) {
    Info ("Git: " + $(if ($gitReady) { 'ready' } else { 'install Git.Git' }))
    Info ("Node.js: " + $(if ($nodeVersion -ge 22) { "v$nodeVersion ready" } else { 'install OpenJS.NodeJS.LTS' }))
    Info ("Java: " + $(if ($javaVersion -ge 17) { "v$javaVersion ready" } else { 'install Microsoft.OpenJDK.17' }))
    Info 'Dry run complete. No installation, cloning or servers.'
    exit 0
}
if (-not $gitReady) {
    Install 'Git' 'Git.Git'
    if (-not (GitReady)) { Die 'Git installed but unavailable in PATH. Restart terminal and retry.' }
} else { Info 'Git already installed.' }
if ($nodeVersion -lt 22) {
    Install 'Node.js 22+' 'OpenJS.NodeJS.LTS'
    if ((NodeMajor) -lt 22) { Die 'Node.js 22+ unavailable after install. Restart terminal or remove an older Node.js.' }
} else { Info "Node.js $nodeVersion already installed." }
if ($javaVersion -lt 17) {
    Install 'JDK 17+' 'Microsoft.OpenJDK.17'
    if ((JavaMajor) -lt 17) { Die 'JDK 17+ unavailable after install. Restart terminal and check PATH.' }
} else { Info "Java $javaVersion already installed." }

$WorkspaceRoot = [IO.Path]::GetFullPath($WorkspaceRoot)
if (-not (Test-Path -LiteralPath $WorkspaceRoot)) {
    New-Item -ItemType Directory -Path $WorkspaceRoot -Force | Out-Null
}
$fe = Join-Path $WorkspaceRoot 'hongik-graduate-FE'
$repoUrl = 'https://github.com/limjunseo/hongik-graduate-FE.git'
if (-not (Test-Path -LiteralPath $fe)) {
    Info 'Cloning frontend repository...'
    Git @('clone', '--', $repoUrl, $fe)
} else {
    if (-not (Test-Path -LiteralPath (Join-Path $fe '.git'))) { Die "Not a Git checkout: $fe" }
    $origin = (& git.exe -C $fe remote get-url origin | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $origin -notmatch '(?i)(^https://github\.com/|^git@github\.com:)limjunseo/hongik-graduate-FE(?:\.git)?$') {
        Die "Existing folder does not belong to our frontend repository: $fe"
    }
    $branch = (& git.exe -C $fe branch --show-current | Out-String).Trim()
    $dirty = (& git.exe -C $fe status --porcelain | Out-String).Trim()
    if ($branch -eq 'main' -and -not $dirty) {
        Info 'Updating existing frontend with fast-forward only...'
        Git @('-C', $fe, 'pull', '--ff-only', 'origin', 'main')
    } else {
        Info 'Local changes or another branch detected. Skipping automatic update to protect your files.'
    }
}
$be = Join-Path $WorkspaceRoot 'hongik-graduate-BE'
$beRepoUrl = 'https://github.com/limjunseo/hongik-graduate-BE.git'
if (-not (Test-Path -LiteralPath $be)) {
    Info 'Cloning backend repository...'
    Git @('clone', '--', $beRepoUrl, $be)
} else {
    if (-not (Test-Path -LiteralPath (Join-Path $be '.git'))) { Die "Not a Git checkout: $be" }
    $beOrigin = (& git.exe -C $be remote get-url origin | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $beOrigin -notmatch '(?i)(^https://github\.com/|^git@github\.com:)limjunseo/hongik-graduate-BE(?:\.git)?$') {
        Die "Existing folder does not belong to our backend repository: $be"
    }
    $beBranch = (& git.exe -C $be branch --show-current | Out-String).Trim()
    $beDirty = (& git.exe -C $be status --porcelain | Out-String).Trim()
    if ($beBranch -eq 'main' -and -not $beDirty) {
        Info 'Updating backend with fast-forward only...'
        Git @('-C', $be, 'pull', '--ff-only', 'origin', 'main')
    } else {
        Info 'Backend has local changes or another branch; keeping local files unchanged.'
    }
}
$launcher = Join-Path $fe 'start-local.ps1'
if (-not (Test-Path -LiteralPath $launcher)) { Die "Launcher not found: $launcher" }
if ($SkipLaunch) {
    Info 'Skipped server launch (-SkipLaunch).'
} else {
    Info 'Starting backend and frontend. Backend will be cloned if missing.'
    & $launcher -NoBrowser:$NoBrowser
    if ($LASTEXITCODE -ne 0) { Die "Local launcher failed (code $LASTEXITCODE)." }
}
Info "Setup completed. Frontend: $fe"
Info 'Open http://localhost:5173 after both servers are ready.'
