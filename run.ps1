<#
.SYNOPSIS
    One-click setup and startup script for VandiVerse on Windows.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             🗺️  VANDIVERSE - ROAD TRIP APP             " -ForegroundColor Yellow
Write-Host "       AI-Powered Family Travel Companion & Planner       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python installation
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "      Detected $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not detected in your PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://www.python.org/downloads/ and check 'Add Python to PATH'." -ForegroundColor Yellow
    Exit 1
}

# 2. Create virtual environment if missing
$venvPath = Join-Path $PSScriptRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[2/5] Creating virtual environment (.venv)..." -ForegroundColor Cyan
    python -m venv .venv
    Write-Host "      Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "[2/5] Virtual environment already exists." -ForegroundColor Gray
}

# 3. Activate virtual environment
Write-Host "[3/5] Activating virtual environment..." -ForegroundColor Cyan
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    Write-Host "      Virtual environment active." -ForegroundColor Green
} else {
    Write-Host "ERROR: Could not find activation script at $activateScript" -ForegroundColor Red
    Exit 1
}

# 4. Install dependencies
Write-Host "[4/5] Installing/verifying dependencies from requirements.txt..." -ForegroundColor Cyan
pip install -q -r requirements.txt
Write-Host "      Dependencies installed." -ForegroundColor Green

# 5. Environment configuration (.env)
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "      Created .env from .env.example." -ForegroundColor Green
        Write-Host "      [NOTE] Add your GROQ_API_KEY into .env to enable AI features!" -ForegroundColor Yellow
    }
} else {
    Write-Host "      .env configuration file found." -ForegroundColor Gray
}

# 6. Launch Server
Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Server starting at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host " API Docs available: http://127.0.0.1:8000/api/docs" -ForegroundColor Yellow
Write-Host " Press Ctrl+C in this window to stop the server." -ForegroundColor Gray
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
