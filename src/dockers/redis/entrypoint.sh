#!/usr/bin/env sh

set -eu

#ABLE to set because of persistent data
REDIS_DATA_DIR=/data
REDIS_PORT=${TRANSCENDENCE_REDIS_PORT}

USER_ID=${PUID:-$(stat -c '%u' "${REDIS_DATA_DIR}" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "${REDIS_DATA_DIR}" 2>/dev/null || echo 1000)}

USER_NAME=redis
USER_GROUP=redis


# fix the .conf file
REDIS_CONF_FILE=/usr/local/etc/redis/redis.conf

sed -i -E \
  -e "s|^bind[[:space:]]+.*$|bind 0.0.0.0|" \
  -e "s|^port[[:space:]]+.*$|port ${REDIS_PORT}|" \
  "${REDIS_CONF_FILE}"

if [ "${USER_ID}" -ne 0 ]; then

  groupmod -o -g "${GROUP_ID}" "${USER_GROUP}"


  #if ! getent group "${GROUP_ID}"; then
  #  groupadd -g "${GROUP_ID}" "${USER_NAME}"
  #  #addgroup -g "${GROUP_ID}" "${GROUP_NAME}"
  #else
  #  USER_GROUP=$(getent group "${GROUP_ID}" grep -oP "^.*?(?=:)")
  #fi

  usermod -o -u "${USER_ID}" -g "${GROUP_ID}" "${USER_NAME}"
  
  #if ! id -nu "${USER_ID}"; then
  #  useradd -u "${USER_ID}" -g "${GROUP_ID}" -m -s /bin/sh "${USER_NAME}"
  #  #adduser -u "${USER_ID}" -G "${GROUP_NAME}" -D -s /bin/sh "${USER_NAME}"
  #else
  #  USER_NAME=$(id -nu "${USER_ID}")
  #fi
  
fi

chown -R "${USER_ID}:${GROUP_ID}" "${REDIS_DATA_DIR}"

export SKIP_FIX_PERMS=1
export SKIP_DROP_PRIVS=1

exec su-exec "${USER_ID}:${GROUP_ID}" docker-entrypoint.sh "$@"
