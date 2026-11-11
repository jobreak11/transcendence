#!/usr/bin/env sh

set -eu

# This script will create a self-signed
# Inside

TRANSCENDENCE_EXPOSE_PORT=${TRANSCENDENCE_NGINX_EXPOSE_PORT}
NEXTJS_PORT=${TRANSCENDENCE_NEXTJS_EXPOSE_PORT}
NESTJS_PORT=${TRANSCENDENCE_NESTJS_EXPOSE_PORT}
DOZZLE_PORT=${TRANSCENDENCE_DOZZLE_EXPOSE_PORT}
REDIS_INSIGHT_PORT=${TRANSCENDENCE_REDIS_INSIGHT_EXPOSE_PORT}
NGINX_DOMAIN_NAME_TRANSC=${TRANSCENDENCE_DOMAIN_NAME}

TRANSCENDENCE_INIT_FILE="./transcendence_nginx_init"

if [ ! -f "${TRANSCENDENCE_INIT_FILE}" ]; then

## Check the cert directory

## then generate the key and self-signed certificate using openssl
#openssl req -x509 -noenc -days 365 -newkey rsa:2048 \
#	-keyout "${CERT_DIR}/server.key" \
#	-out "${CERT_DIR}/server.crt" \
#	-subj "/CN=${NGINX_DOMAIN_NAME_TRANSC}"

#chmod 644 "${CERT_DIR}/server.crt"
#chmod 600 "${CERT_DIR}/server.key"


TRANSCENDENCE_NGINX_CONF_PATH="/etc/nginx/conf.d/default.conf"

# now modifying the nginx configuration file
sed -i -E -e "s|^([[:space:]]+)ssl_certificate[[:space:]]+.*;$|\1ssl_certificate /nginx/server.crt;|" \
  -e "s|^([[:space:]]+)ssl_certificate_key[[:space:]]+.*;$|\1ssl_certificate_key /nginx/server.key;|" \
  -e "s|^([[:space:]]+)listen[[:space:]]+[0-9]+[[:space:]]ssl;$|\1listen ${TRANSCENDENCE_NGINX_EXPOSE_PORT} ssl;|" \
  -e "s|^([[:space:]]+)listen[[:space:]]+\[\:\:\]\:[0-9]+[[:space:]]ssl;$|\1listen [::]:${TRANSCENDENCE_NGINX_EXPOSE_PORT} ssl;|" \
  -e "s|^([[:space:]]+)proxy_pass[[:space:]]+http://nextjs:[0-9]+(.*);$|\1proxy_pass http://nextjs:${NEXTJS_PORT}\2;|" \
  -e "s|^([[:space:]]+)proxy_pass[[:space:]]+http://nestjs:[0-9]+(.*);$|\1proxy_pass http://nestjs:${NESTJS_PORT}\2;|" \
  -e "s|^([[:space:]]+)proxy_pass[[:space:]]+http://dozzle:[0-9]+(.*);$|\1proxy_pass http://dozzle:${DOZZLE_PORT}\2;|" \
  -e "s|^([[:space:]]+)proxy_pass[[:space:]]+http://redis-commander:[0-9]+(.*);$|\1proxy_pass http://redis-commander:${REDIS_INSIGHT_PORT}\2;|" \
  -e "s|^([[:space:]]+)server_name[[:space:]]+.*;$|\1server_name ${NGINX_DOMAIN_NAME_TRANSC};|" \
  "${TRANSCENDENCE_NGINX_CONF_PATH}"

touch "${TRANSCENDENCE_INIT_FILE}"

fi


