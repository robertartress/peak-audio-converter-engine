#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$ROOT_DIR/dist"

mkdir -p "$OUTPUT_DIR"
docker buildx build \
  --target export \
  --output "type=local,dest=$OUTPUT_DIR" \
  --file "$ROOT_DIR/tools/ffmpeg-wasm/Dockerfile" \
  "$ROOT_DIR/tools/ffmpeg-wasm"
cp "$ROOT_DIR/engine/manifest.json" "$OUTPUT_DIR/manifest.json"

node "$ROOT_DIR/verify.mjs"
