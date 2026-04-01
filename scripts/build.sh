#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "==> Building Python sidecar..."
cd "$ROOT/backend"
uv run pyinstaller openlecture.spec --noconfirm

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
    TARGET_TRIPLE="aarch64-apple-darwin"
elif [ "$ARCH" = "x86_64" ]; then
    TARGET_TRIPLE="x86_64-apple-darwin"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

SIDECAR_SRC="$ROOT/backend/dist/openlecture-server/openlecture-server"
SIDECAR_DST="$ROOT/src-tauri/binaries/openlecture-server-$TARGET_TRIPLE"

echo "==> Copying sidecar to $SIDECAR_DST"
cp "$SIDECAR_SRC" "$SIDECAR_DST"
chmod +x "$SIDECAR_DST"

echo "==> Building Tauri app..."
cd "$ROOT"
cargo tauri build

echo ""
echo "==> Done! DMG is at:"
ls "$ROOT/src-tauri/target/release/bundle/dmg/"*.dmg 2>/dev/null || echo "(check src-tauri/target/release/bundle/)"
