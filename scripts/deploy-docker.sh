#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-roundtable:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-roundtable}"
PORT="${PORT:-3001}"

cd "$ROOT_DIR"
docker build -t "$IMAGE_NAME" .
if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi
docker run -d --name "$CONTAINER_NAME" --restart unless-stopped -e "PORT=3001" -p "${PORT}:3001" "$IMAGE_NAME" >/dev/null
printf 'Deployed %s as %s on port %s\n' "$IMAGE_NAME" "$CONTAINER_NAME" "$PORT"
printf 'Health: http://127.0.0.1:%s/health\n' "$PORT"
