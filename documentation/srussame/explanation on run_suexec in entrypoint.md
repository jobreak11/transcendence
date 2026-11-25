# Container Entrypoint & UID/GID Mapping Convention

## Overview & Motivation (42 Rootless Docker Compatibility)
On 42 campus workstations, Docker runs in **rootless mode**, where host users are assigned high-numbered `UID` and `GID` values (often derived from LDAP/network directories) that do not cleanly map to standard container users. Without explicit handling, bind-mounted volumes (such as `$NESTJS_DIR` or `/app`) suffer from permission mismatches—causing `EACCES` errors inside the container or leaving root-owned artifacts on the host filesystem.

To guarantee consistent file permissions across both 42 rootless workstations and standard local Docker environments, every container in this project uses a standardized `entrypoint.sh` convention powered by `su-exec`.

---

## How It Works

### 1. Dynamic UID/GID Resolution
At startup, the script determines the target `USER_ID` and `GROUP_ID` using the following priority:
1. Explicit environment variables (`PUID` and `PGID`) if provided.
2. Automatic detection via `stat` on the mounted project directory (`$NESTJS_DIR`).
3. Fallback to standard non-root defaults (`1000:1000`).

```sh
USER_ID=${PUID:-$(stat -c '%u' "$NESTJS_DIR" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "$NESTJS_DIR" 2>/dev/null || echo 1000)}
```

### 2. Idempotent User & Group Provisioning
If the resolved `USER_ID` is non-root (`!= 0`), the script ensures a matching user and group exist inside the container before launching the application:
* **Group Check:** Queries `getent group "${GROUP_ID}"`. If absent, creates the group via `groupadd` (or `addgroup` on Alpine-based images).
* **User Check:** Queries `getent passwd "${USER_ID}"`. If absent, creates `appuser` mapped to `USER_ID` and `GROUP_ID` via `useradd` (or `adduser` on Alpine).
* **Ownership Alignment:** Runs `chown -R "${USER_ID}:${GROUP_ID}" /app` so the runtime user has full read/write access to the working directory.

```sh
USER_NAME=appuser
USER_GROUP=appgroup

if [ "${USER_ID}" -ne 0 ]; then
  if ! getent group "${GROUP_ID}"; then
    groupadd -g "${GROUP_ID}" "${USER_NAME}"
    # Alpine alternative: addgroup -g "${GROUP_ID}" "${GROUP_NAME}"
  else
    USER_GROUP=$(getent group "${GROUP_ID}" | grep -oP "^.*?(?=:)")
  fi
  
  if ! getent passwd "${USER_ID}" ; then
    useradd -u "${USER_ID}" -g "${GROUP_ID}" -m -s /bin/sh "${USER_NAME}"
    # Alpine alternative: adduser -u "${USER_ID}" -G "${GROUP_NAME}" -D -s /bin/sh "${USER_NAME}"
  else
    USER_NAME=$(getent passwd "${USER_ID}" | cut -d: -f1)
  fi
  
  chown -R "${USER_ID}:${GROUP_ID}" /app
fi
```

### 3. Privilege Drop via `run_suexec`
All container commands are executed through the `run_suexec` wrapper function:

```sh
run_suexec() {
  if [ $# -lt 3 ]; then
    echo "requires at least three arguments to run_suexec() UID and GID and commands" >&2
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
```

* **Non-root execution (`UID != 0`):** Uses `su-exec` to step down from `root` and execute the command directly under `${USER_ID}:${GROUP_ID}` without spawning unnecessary subshells (preserving PID 1 signal handling when paired with `exec`).
* **Root/Rootless remap (`UID == 0`):** If the container runtime already maps the host user to `UID 0` inside the user namespace, it executes `"$@"` directly without redundant privilege switching.

---

## Usage Convention
Every command invoked inside `entrypoint.sh` (migrations, build steps, or the main server process) must be prefixed with `run_suexec`:

```sh
run_suexec "${USER_ID}" "${GROUP_ID}" <command> [args...]
```

---

## Key Points for Evaluation
* **Why not hardcode `USER node` or `UID 1000` in the `Dockerfile`?** Hardcoded build-time UIDs fail when a 42 workstation mounts a host directory owned by a high LDAP UID, or when rootless Docker maps namespaces dynamically at runtime.
* **Why `su-exec` instead of `su` or `sudo`?** `su-exec` is a lightweight C binary (~10KB) that switches UID/GID and executes the target binary directly in the same process space, avoiding TTY issues and ensuring clean `SIGTERM`/`SIGINT` propagation in Docker.