$ErrorActionPreference = "Stop"

$path = "C:\Applications\bins\MinimalShot.exe"
$temp = "C:\Applications\bins\MinimalShot.exe.new"

Invoke-WebRequest `
  -Uri "https://github.com/22-2/minimalshot/releases/download/v0.0.0-dev/MinimalShot_dev_x64.exe" `
  -OutFile $temp

$processes = Get-Process -Name MinimalShot -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Stop-Process
    $processes | Wait-Process -Timeout 15
}

Copy-Item -LiteralPath $temp -Destination $path -Force
Remove-Item -LiteralPath $temp
Start-Process -FilePath $path