# Quick Start Script for DK Executive Engineers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DK Executive Engineers - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
Write-Host "⚠ Make sure PostgreSQL is installed and running" -ForegroundColor Yellow
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Edit .env file and configure:" -ForegroundColor Yellow
    Write-Host "  1. DATABASE_URL with your PostgreSQL connection" -ForegroundColor Yellow
    Write-Host "  2. NEXTAUTH_SECRET with a secure random value" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to continue after configuring .env..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Push database schema
Write-Host "Pushing database schema..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push database schema" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database schema pushed successfully" -ForegroundColor Green
Write-Host ""

# Seed database
Write-Host "Seeding database with initial data..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database seeded successfully" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup completed successfully! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Cyan
Write-Host "  Admin: admin@dkexecutive.com / Admin123!" -ForegroundColor White
Write-Host "  Customer: customer@example.com / Customer123!" -ForegroundColor White
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser" -ForegroundColor Cyan
Write-Host ""
