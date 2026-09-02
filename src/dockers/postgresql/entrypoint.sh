#!/usr/bin/env sh

set -eu

# this script aim is for this container to 
# work with all machine and avoid permission conflict
# when using bind mount for data persistence
#
# Also i heard some said always solves problem with chmod 777 
# is very bad practices and might create security risks it someone can break
# from container
#
# this entrypoint script will change the postgres user to match the
# bind mount directory


mkdir -p "${PGDATA}"
# PGDATA is the bind mount path
USER_ID=${PUID:-$(stat -c '%u' "${PGDATA}" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "${PGDATA}" 2>/dev/null || echo 1000)}

USER_NAME=postgres
USER_GROUP=postgres
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
  
  chown -R "${USER_ID}:${GROUP_ID}" "${PGDATA}"
fi

printf "docker-entrypoint.sh ${USER_ID} ${GROUP_ID} $@\n"
exec docker-entrypoint.sh "$@"
