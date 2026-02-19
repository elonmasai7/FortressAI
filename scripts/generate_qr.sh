#!/usr/bin/env bash
set -euo pipefail

curl -sSf http://localhost:8000/qr > frontend/public/demo-qr.png
echo "QR saved to frontend/public/demo-qr.png"
