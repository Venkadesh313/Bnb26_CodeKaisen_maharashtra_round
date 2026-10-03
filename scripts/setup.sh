#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required." >&2; exit 1; }
node -e 'const major = Number(process.versions.node.split(".")[0]); if (major < 20) { console.error("Node.js 20+ is required."); process.exit(1) }'

if [[ ! -f package-lock.json ]]; then
  npm install
else
  npm ci
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example; review it before deployment."
fi

npm run build
printf '\nRoundtable setup complete.\n'
printf 'Frontend: npm run dev\n'
printf 'Backend:  npm run server\n'
printf 'Health:   http://127.0.0.1:${PORT:-3001}/health\n'
