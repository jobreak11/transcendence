#!/usr/bin/env sh

set -eu

usage() {
  echo "Usage: $0 <project_name> <volume_key> <compose_file> [backup_dir]" >&2
  echo "Example: $0 mywebserver uploads_data ./docker-compose.yml ~/docker-backups" >&2
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

COMPOSE_DIR=$(CDPATH= cd -- "$(dirname -- "$COMPOSE_FILE")" && pwd)
COMPOSE_BASE=$(basename -- "$COMPOSE_FILE")

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

# 3. Confirm the volume actually exists on the Docker daemon
if ! docker volume inspect "$ACTUAL_VOLUME" >/dev/null 2>&1; then
  echo "Error: Docker volume '$ACTUAL_VOLUME' does not exist." >&2
  echo "Available volumes:" >&2
  docker volume ls --format "  - {{.Name}}" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_DIR_ABS=$(CDPATH= cd -- "$BACKUP_DIR" && pwd)

# Create a dedicated directory for this volume's raw files
TARGET_DIR="$BACKUP_DIR_ABS"
# mkdir -p "$TARGET_DIR"

echo "Copying raw files from volume '$ACTUAL_VOLUME' to '$TARGET_DIR'..."

docker run --rm \
  -v "${ACTUAL_VOLUME}:/source:ro" \
  -v "${TARGET_DIR}:/target" \
  alpine cp -a /source/. /target/

echo "Backup completed: $TARGET_DIR"
