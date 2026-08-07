#!/usr/bin/env sh

set -eu

# health check script for checking the nextjs
# server is actually running

NEXTJS_PORT=${TRANSCENDENCE_NEXTJS_EXPOSE_PORT}

if netstat -tulnp | grep -E -q ":${NEXTJS_PORT}[[:space:]]+"; then
  exit 0
else
  exit 1
fi

