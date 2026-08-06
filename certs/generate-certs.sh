#!/bin/sh
# Generate self-signed Ed25519 TLS Certificate and Private Key using OpenSSL
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERTS_DIR="$SCRIPT_DIR"

echo "Generating Ed25519 SSL certificate and key in $CERTS_DIR ..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/server.key" \
  -out "$CERTS_DIR/server.crt" \
  -subj "/CN=localhost/O=Test Proxy Passthrough/OU=Development/C=US"

chmod 644 "$CERTS_DIR/server.crt"
chmod 600 "$CERTS_DIR/server.key"

echo "✅ Self-signed Ed25519 certificate (server.crt) and key (server.key) created successfully!"
