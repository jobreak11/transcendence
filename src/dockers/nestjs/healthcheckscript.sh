#!/usr/bin/env sh

set -eu

# health check script for checking the nextjs
# server is actually running

if netstat -tulnp | grep -E -q ":${PORT}"; then
  exit 0
else
  exit 1
fi
