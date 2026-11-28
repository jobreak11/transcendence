#!/usr/bin/env sh

set -eu

usage() {
  echo "Usage: $0 <project_name> <volume_key> <compose_file> [backup_dir]" >&2
  echo "Example: $0 transcendence_poker shared_storage ./src/docker-compose.yml ./backup/storage" >&2
  exit 1
}

if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
  usage
fi

PROJECT_NAME="$1"
VOLUME_KEY="$2"
COMPOSE_FILE="$3"
BACKUP_DIR="${4:-$HOME/docker-backups}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
  echo "Error: Backup directory '$BACKUP_DIR' does not exist or is empty. Aborting restore." >&2
  exit 1
fi

COMPOSE_DIR=$(CDPATH= cd -- "$(dirname -- "$COMPOSE_FILE")" && pwd)
COMPOSE_BASE=$(basename -- "$COMPOSE_FILE")
BACKUP_DIR_ABS=$(CDPATH= cd -- "$BACKUP_DIR" && pwd)

# 1. Verify the volume key exists in the resolved Compose configuration
DEFINED_VOLUMES=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DIR/$COMPOSE_BASE" config --volumes)

if ! printf '%s\n' "$DEFINED_VOLUMES" | grep -Fqx "$VOLUME_KEY"; then
  echo "Error: Volume '$VOLUME_KEY' is not defined in $COMPOSE_FILE." >&2
  echo "Defined volumes: $(printf '%s ' $DEFINED_VOLUMES)" >&2
  exit 1
fi

# 2. Check if Compose config specifies a custom or external volume name; otherwise default to <project>_<key>
RESOLVED_NAME=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DIR/$COMPOSE_BASE" config 2>/dev/null | awk -v key="$VOLUME_KEY" '
  /^volumes:/ { in_vols=1; next }
  in_vols && /^[^[:space:]]/ { in_vols=0 }
  in_vols && $0 ~ ("^  " key ":") { in_target=1; next }
  in_vols && in_target && /^  [^[:space:]]/ { in_target=0 }
  in_vols && in_target && /^[[:space:]]+name:[[:space:]]*/ {
    sub(/^[[:space:]]+name:[[:space:]]*/, "")
    gsub(/["'\'']/, "")
    print $0
    exit
  }
')

if [ -n "$RESOLVED_NAME" ]; then
  ACTUAL_VOLUME="$RESOLVED_NAME"
else
  ACTUAL_VOLUME="${PROJECT_NAME}_${VOLUME_KEY}"
fi

# 3. Confirm the volume exists on the Docker daemon
if ! docker volume inspect "$ACTUAL_VOLUME" >/dev/null 2>&1; then
  echo "Error: Docker volume '$ACTUAL_VOLUME' does not exist." >&2
  echo "Available volumes:" >&2
  docker volume ls --format "  - {{.Name}}" >&2
  exit 1
fi

echo "Restoring files from '$BACKUP_DIR_ABS' into volume '$ACTUAL_VOLUME'..."

docker run --rm \
  -e PUID="${PUID:-}" \
  -e PGID="${PGID:-}" \
  -v "${BACKUP_DIR_ABS}:/source:ro" \
  -v "${ACTUAL_VOLUME}:/target" \
  alpine sh -euxc '
    USER_ID="${PUID:-$(stat -c "%u" /source 2>/dev/null || echo 1000)}"
    GROUP_ID="${PGID:-$(stat -c "%g" /source 2>/dev/null || echo 1000)}"

    # Clear existing volume contents so deleted files do not linger
    rm -rf /target/* /target/.[!.]* /target/..?* 2>/dev/null || true

    # Copy backup preserving permissions/timestamps and set ownership
    cp -a /source/. /target/
    if [ "${USER_ID}" -ne 0 ]; then
      chown -R "${USER_ID}:${GROUP_ID}" /target
    fi
  '

echo "Restore completed into volume: $ACTUAL_VOLUME"
