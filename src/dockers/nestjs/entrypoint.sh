#!/usr/bin/env sh

set -eux

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
export TRANSCENDENCE_ADMIN_PASSWORD="$(cat ${TRANSCENDENCE_ADMIN_PASSWORD_SECRET_FILE})"

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

run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-lock.yaml "${NESTJS_DIR}/pnpm-lock.yaml"
run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-workspace.yaml "${NESTJS_DIR}/pnpm-workspace.yaml"

cd ${NESTJS_DIR}
if [ ! -f "package.json" ]; then
  printf "Create new project\n"
  cd ${WORK_DIRECTORY}
  #run_suexec ${USER_ID} ${GROUP_ID} npx -y @nestjs/cli new nestjs -p npm --strict --skip-git
  run_suexec ${USER_ID} ${GROUP_ID} pnpm dlx @nestjs/cli@12.0.15 new nestjs -p pnpm --strict --skip-git --skip-install --skip-skills --no-observe
  cd ${NESTJS_DIR}

  if [ -d "/app/saves" ] && [ -n "$(ls -A /app/saves 2>/dev/null)" ]; then
    printf "Restoring project from /app/saves\n"
    cd ${NESTJS_DIR}
    run_suexec ${USER_ID} ${GROUP_ID} cp -r /app/saves/* ./ || true
  fi

  run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-lock.yaml "${NESTJS_DIR}/pnpm-lock.yaml"
  run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-workspace.yaml "${NESTJS_DIR}/pnpm-workspace.yaml"
  run_suexec ${USER_ID} ${GROUP_ID} cp /app/package.json "${NESTJS_DIR}/package.json"
  run_suexec ${USER_ID} ${GROUP_ID} pnpm install --frozen-lockfile

  cd ${NESTJS_DIR}
  # run_suexec ${USER_ID} ${GROUP_ID} pnpm drizzle-kit push
  # Need to insert atleast 1 admin user automatically

fi

if [ ! -d "${NESTJS_DIR}/node_modules" ] || [ -z "$(ls -A ${NESTJS_DIR}/node_modules)" ]; then
  cd ${NESTJS_DIR}
  printf "Install Dependencies\n"
    CI=true run_suexec ${USER_ID} ${GROUP_ID} pnpm install --frozen-lockfile
fi

chown -R ${USER_ID}:${GROUP_ID} /transcend_storage


cd ${NESTJS_DIR}
run_suexec ${USER_ID} ${GROUP_ID} pnpm drizzle-kit push
run_suexec ${USER_ID} ${GROUP_ID} pnpm tsx "src/infrastructure/drizzle/seed.ts"

if [ $# -ne 0 ]; then
  if [ "${USER_ID}" -ne 0 ]; then
    exec su-exec "${USER_ID}:${GROUP_ID}" "$@"
  else
    exec "$@"
  fi
else

  if [ "${TRANSCENDENCE_PRODUCTION_MODE}" = "FALSE" ]; then
    if [ "${USER_ID}" -ne 0 ]; then
      exec su-exec "${USER_ID}:${GROUP_ID}" npm run start:dev
    else
      exec npm run start:dev
    fi
  else

    if [ "${USER_ID}" -ne 0 ]; then
      exec su-exec "${USER_ID}:${GROUP_ID}" npm run start
    else
      exec npm run start
    fi
  fi

fi

