#!/usr/bin/env bash
# Renders a Remotion config outside OneDrive to avoid cloud-eviction failures.
# Usage: ./scripts/render-safe.sh <config-id>
# Example: ./scripts/render-safe.sh ad-20s
set -e

CONFIG="${1:?Usage: render-safe.sh <config-id>}"
VIDEO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RENDER_DIR="/tmp/krafo-render"

echo "▸ Syncing source to $RENDER_DIR…"
rsync -a \
  --exclude='node_modules' --exclude='node_modules.bak' \
  --exclude='out' --exclude='.node_modules*' \
  "$VIDEO_DIR/" "$RENDER_DIR/"

echo "▸ Installing packages (local)…"
npm install --prefix "$RENDER_DIR" --silent

echo "▸ Rendering $CONFIG…"
~/.local/bin/tsx "$RENDER_DIR/scripts/render.ts" "$CONFIG"

echo "▸ Copying output back…"
mkdir -p "$VIDEO_DIR/out"
cp "$RENDER_DIR/out/$CONFIG.mp4" "$VIDEO_DIR/out/$CONFIG.mp4"

echo "✓ $VIDEO_DIR/out/$CONFIG.mp4"
