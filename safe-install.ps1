# safe-pnpm-install.ps1
# Ejecutar en la raíz del proyecto (donde está pnpm-lock.yaml)
# Ejemplo: pwsh .\safe-pnpm-install.ps1

param(
  [string[]] $Packages = @("@types/node@^20"),  # paquetes a instalar (editar)
  [int] $TimeoutSec = 11180,                      # timeout por intento (segundos)
  [int] $MaxAttempts = 4,                       # intentos por paquete
  [int] $SleepBetweenSec = 3                    # espera entre intentos (segundos)
)

# --- comprobación inicial ---
if (-not (Test-Path -Path "pnpm-lock.yaml")) {
  Write-Error "No se encontró pnpm-lock.yaml en el directorio actual. Este script asume pnpm."
  exit 1
}

# opcional: ajustar config de pnpm para reintentos y timeouts más tolerantes
try {
  pnpm config set fetch-retries 5 | Out-Null
  pnpm config set fetch-retry-factor 2 | Out-Null
  pnpm config set fetch-retry-mintimeout 20000 | Out-Null
  pnpm config set fetch-retry-maxtimeout 600000 | Out-Null
} catch {
  Write-Warning "No se pudo ajustar la configuración de pnpm (quizá pnpm no está en PATH). Seguiré de todos modos."
}

foreach ($pkg in $Packages) {
  $attempt = 1
  $succeeded = $false

  while ($attempt -le $MaxAttempts -and -not $succeeded) {
    Write-Host "==> Instalando $pkg (intento $attempt/$MaxAttempts, timeout ${TimeoutSec}s)..."

    # network-timeout en pnpm se pasa en ms
    $netTimeoutMs = $TimeoutSec * 1000

    $args = @("add","-D",$pkg,"--network-timeout",$netTimeoutMs)

    try {
      $proc = Start-Process -FilePath "pnpm" -ArgumentList $args -NoNewWindow -PassThru
    } catch {
      Write-Warning "No se pudo lanzar pnpm: $_.Verbosity"
      break
    }

    $finished = $proc.WaitForExit($TimeoutSec * 1000)
    if ($finished -and $proc.ExitCode -eq 0) {
      Write-Host "  ✅ $pkg instalado correctamente."
      $succeeded = $true
      break
    } else {
      Write-Warning "  ⚠️  Intento $attempt falló o timeout. ExitCode: $($proc.ExitCode)"
      if (-not $finished) {
        try { $proc.Kill() -ErrorAction SilentlyContinue } catch {}
      }
      Start-Sleep -Seconds $SleepBetweenSec
      $attempt++
    }
  }

  if (-not $succeeded) {
    Write-Error "❌ No se pudo instalar $pkg después de $MaxAttempts intentos."
    exit 1
  }
}

Write-Host "Todas las instalaciones completadas correctamente."
