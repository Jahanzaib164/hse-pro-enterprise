#!/bin/bash
set -e

echo ""
echo "  ============================================"
echo "   HSE Pro Enterprise - Starting..."
echo "  ============================================"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
    echo "  ERROR: Node.js is not installed!"
    echo ""
    echo "  Install it with one of these:"
    echo ""
    echo "  Mac:   brew install node"
    echo "         or download from https://nodejs.org"
    echo ""
    echo "  Linux: sudo apt install nodejs npm   (Ubuntu/Debian)"
    echo "         sudo dnf install nodejs       (Fedora)"
    echo "         or download from https://nodejs.org"
    echo ""
    exit 1
fi

NODE_MAJOR=$(node --version | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "  ERROR: Node.js 18+ required. You have $(node --version)"
    echo "  Download latest from https://nodejs.org"
    exit 1
fi

echo "  Node.js $(node --version) found ✓"

# Install launcher deps if needed
if [ ! -d "launcher/node_modules" ]; then
    echo "  Installing dependencies (first time only - please wait)..."
    cd launcher
    npm install --prefer-offline
    cd ..
fi

echo "  Starting HSE Pro Enterprise..."
echo "  The app will open in your browser automatically."
echo "  Login: admin@hse-pro.com / Password123!"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

node launcher/index.js
