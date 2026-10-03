#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://127.0.0.1:${PORT:-3001}/health}"
response="$(curl --fail --silent --show-error --max-time 10 "$URL")"
node -e 'const body = JSON.parse(process.argv[1]); if (body.ok !== true) process.exit(1); console.log(JSON.stringify(body))' "$response"
