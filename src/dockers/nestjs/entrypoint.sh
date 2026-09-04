#!/usr/bin/env sh

set -eu

run_suexec() {
  if [ $# -lt 3 ]; then
    echo "requires alleast three arguments to run_suexec() UID and GID and commands" >&2
    return 1
  fi

  arg_uid=$1
  arg_gid=$2
  shift 2

  if [ "${arg_uid}" -ne 0 ]; then
    su-exec "${arg_uid}:${arg_gid}" "$@"
  else
    "$@"
  fi
  return 0
}

export POSTGRES_PASSWORD="$(cat ${POSTGRES_PASSWORD_FILE})"
export NESTJS_JWT_SECRET_KEY="$(cat ${NESTJS_JWT_SECRET_FILE})"
export NESTJS_JWT_REFRESH_SECRET_KEY="$(cat ${NESTJS_JWT_REFRESH_SECRET_FILE})"

WORK_DIRECTORY=/app
NESTJS_DIR=${WORK_DIRECTORY}/nestjs

mkdir -p ${NESTJS_DIR}

USER_ID=${PUID:-$(stat -c '%u' "$NESTJS_DIR" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "$NESTJS_DIR" 2>/dev/null || echo 1000)}

USER_NAME=appuser
USER_GROUP=appgroup
if [ "${USER_ID}" -ne 0 ]; then

  if ! getent group "${GROUP_ID}"; then
    groupadd -g "${GROUP_ID}" "${USER_NAME}"
    #addgroup -g "${GROUP_ID}" "${GROUP_NAME}"
  else
    USER_GROUP=$(getent group "${GROUP_ID}" | grep -oP "^.*?(?=:)")
  fi
  
  if ! getent passwd "${USER_ID}" ; then
    useradd -u "${USER_ID}" -g "${GROUP_ID}" -m -s /bin/sh "${USER_NAME}"
    #adduser -u "${USER_ID}" -G "${GROUP_NAME}" -D -s /bin/sh "${USER_NAME}"
  else
    USER_NAME=$(getent passwd "${USER_ID}" | cut -d: -f1)
  fi
  
  chown -R "${USER_ID}:${GROUP_ID}" /app
fi

cd ${NESTJS_DIR}
if [ ! -f "package.json" ]; then
  printf "Create new project\n"
  cd ${WORK_DIRECTORY}
  #run_suexec ${USER_ID} ${GROUP_ID} npx -y @nestjs/cli new nestjs -p npm --strict --skip-git
  run_suexec ${USER_ID} ${GROUP_ID} pnpm dlx @nestjs/cli new nestjs -p pnpm --strict --skip-git
  cd ${NESTJS_DIR}

  run_suexec ${USER_ID} ${GROUP_ID} printf "allowBuilds:\n  argon2: true\n  '@scarf/scarf': true\n" > pnpm-workspace.yaml

  run_suexec ${USER_ID} ${GROUP_ID} pnpm add class-validator class-transformer @nestjs/swagger @nestjs/websockets \
     @nestjs/platform-socket.io @nestjs/typeorm typeorm \
     pg @nestjs/config @nestjs/jwt passport-jwt @nestjs/passport passport passport-local \
     argon2
  run_suexec ${USER_ID} ${GROUP_ID} pnpm add -D @types/bcrypt @types/passport-local @types/passport-jwt \
    @types/ms

  if [ -d "/app/saves" ] && [ -n "$(ls -A /app/saves 2>/dev/null)" ]; then
    printf "Restoring project from /app/saves\n"
    cd ${NESTJS_DIR}
    run_suexec ${USER_ID} ${GROUP_ID} cp -r /app/saves/* ./ || true
  fi
fi

if [ ! -d "${NESTJS_DIR}/node_modules" ] || [ -z "$(ls -A ${NESTJS_DIR}/node_modules)" ]; then
  cd ${NESTJS_DIR}
  printf "Install Dependencies\n"
    run_suexec ${USER_ID} ${GROUP_ID} pnpm install
fi

cd ${NESTJS_DIR}
if [ "${USER_ID}" -ne 0 ]; then
  exec su-exec "${USER_ID}:${GROUP_ID}" "$@"
else
  exec "$@"
fi
