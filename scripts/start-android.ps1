param(
    [string]$Avd = 'AuthorToday_API_36',
    [int]$Port = 8081
)

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDir

$sdkDir = $env:ANDROID_HOME
if (-not $sdkDir) { $sdkDir = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$adb = Join-Path $sdkDir 'platform-tools\adb.exe'
$emulator = Join-Path $sdkDir 'emulator\emulator.exe'
if (-not (Test-Path -LiteralPath $adb) -or -not (Test-Path -LiteralPath $emulator)) {
    throw 'Android SDK is missing. Install platform-tools and emulator, then set ANDROID_HOME.'
}
if (-not (Test-Path -LiteralPath 'node_modules\expo\bin\cli')) {
    throw 'Dependencies are missing. Run npm.cmd ci first.'
}

$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:PATH = "$sdkDir\platform-tools;$sdkDir\emulator;$env:PATH"
& $adb start-server
if ($LASTEXITCODE -ne 0) { throw 'Could not start ADB.' }

$deviceLine = & $adb devices | Where-Object { $_ -match '^emulator-\d+\s+' } | Select-Object -First 1
if (-not $deviceLine) {
    $avds = @(& $emulator -list-avds | Where-Object { $_.Trim() })
    if (-not $avds.Count) { throw 'No Android virtual device found. Create one with Android Device Manager.' }
    if ($Avd -notin $avds) { $Avd = $avds[0] }
    Write-Host "Starting Android emulator: $Avd"
    Start-Process -FilePath $emulator -ArgumentList '-avd', $Avd, '-no-boot-anim', '-gpu', 'auto' | Out-Null
}

Write-Host 'Waiting for Android to finish booting...'
$deadline = (Get-Date).AddMinutes(5)
$serial = $null
while ((Get-Date) -lt $deadline) {
    $readyLine = & $adb devices | Where-Object { $_ -match '^emulator-\d+\s+device\s*$' } | Select-Object -First 1
    if ($readyLine) {
        $serial = ($readyLine -split '\s+')[0]
        $bootComplete = & $adb -s $serial shell getprop sys.boot_completed
        if ($LASTEXITCODE -eq 0 -and "$bootComplete".Trim() -eq '1') { break }
    }
    Start-Sleep -Seconds 2
}
if (-not $serial -or "$bootComplete".Trim() -ne '1') {
    throw 'Android did not finish booting within five minutes. Check the emulator window.'
}

$env:ANDROID_SERIAL = $serial
& $adb -s $serial reverse "tcp:$Port" "tcp:$Port"
if ($LASTEXITCODE -ne 0) { throw 'Could not connect the emulator to Metro.' }

$runningProject = $null
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port" -Headers @{ 'expo-platform' = 'android' } -TimeoutSec 3
    $manifest = [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | ConvertFrom-Json
    $runningProject = $manifest.extra.expoGo.developer.projectRoot
} catch {
    # Metro is not running yet.
}
if ($runningProject -eq $projectDir) {
    Write-Host 'Reusing the running Expo server.'
    & $adb -s $serial shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:$Port`?__expo_disable_fab=1" -p host.exp.exponent
    exit $LASTEXITCODE
}

Write-Host "Opening the app in Expo Go on $serial. Keep this window open."
# ADB reverse connects over IPv4; Node on Windows may otherwise bind only to ::1.
& node.exe --dns-result-order=ipv4first 'node_modules/expo/bin/cli' start --go --localhost --android --port $Port
exit $LASTEXITCODE
