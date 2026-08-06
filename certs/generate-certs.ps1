# PowerShell script for generating self-signed Ed25519 SSL Certificate and Private Key
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$certPath = Join-Path $scriptDir "server.crt"
$keyPath = Join-Path $scriptDir "server.key"

Write-Host "Generating Ed25519 SSL certificate and key..." -ForegroundColor Cyan

openssl req -x509 -nodes -days 365 -newkey ed25519 `
  -keyout $keyPath `
  -out $certPath `
  -subj "/CN=localhost/O=Test Proxy Passthrough/OU=Development/C=US"

Write-Host "✅ Self-signed Ed25519 certificate (server.crt) and key (server.key) created successfully!" -ForegroundColor Green
