#!/usr/bin/env sh

set -eux

run_suexec() {
  if [ $# -lt 3 ]; then
    echo "requires atleast three arguments to run_suexec() UID and GID and commands" >&2
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

NEXTJS_DIR=/app/nextjs
NEXTJS_PORT=${TRANSCENDENCE_NEXTJS_EXPOSE_PORT:-3000}
NEXTJS_DOMAIN_NAME_TRANSC=${TRANSCENDENCE_DOMAIN_NAME:-localhost}

mkdir -p "${NEXTJS_DIR}"

USER_ID=${PUID:-$(stat -c '%u' "${NEXTJS_DIR}" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "${NEXTJS_DIR}" 2>/dev/null || echo 1000)}

USER_NAME=appuser
USER_GROUP=appgroup
if [ "${USER_ID}" -ne 0 ]; then

  if ! getent group "${GROUP_ID}"; then
    groupadd -g "${GROUP_ID}" "${USER_NAME}"
  else
    USER_GROUP=$(getent group "${GROUP_ID}" | grep -oP "^.*?(?=:)")
  fi
  
  if ! getent passwd "${USER_ID}" ; then
    useradd -u "${USER_ID}" -g "${GROUP_ID}" -m -s /bin/sh "${USER_NAME}"
  else
    USER_NAME=$(getent passwd "${USER_ID}" | cut -d: -f1)
  fi
  
  chown -R "${USER_ID}:${GROUP_ID}" /app
fi

cd "${NEXTJS_DIR}"

if [ ! -d "./node_modules" ] || [ -z "$(ls -A ./node_modules)" ]; then

  run_suexec ${USER_ID} ${GROUP_ID} mkdir -p src/app src/public node_modules

  # 1. Restore saved source files first (so we don't overwrite package.json/lockfile after configuring them)
  if [ -d "/app/saves" ] && [ -n "$(ls -A /app/saves 2>/dev/null)" ]; then
    printf "Restoring project from /app/saves\n"
    cp -r /app/saves/* ./ || true
  fi

  # 2. Copy the locked package.json and pnpm-lock.yaml from /app
  run_suexec ${USER_ID} ${GROUP_ID} cp /app/package.json "${NEXTJS_DIR}/package.json"
  run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-lock.yaml "${NEXTJS_DIR}/pnpm-lock.yaml"
  # If you also use a pnpm-workspace.yaml for Next.js, uncomment the line below:
  # [ -f /app/pnpm-workspace.yaml ] && run_suexec ${USER_ID} ${GROUP_ID} cp /app/pnpm-workspace.yaml "${NEXTJS_DIR}/pnpm-workspace.yaml"

  # 3. Dynamically configure "scripts" in package.json (safe for --frozen-lockfile!)
  run_suexec ${USER_ID} ${GROUP_ID} node -e "
    const fs = require(\"fs\");
    const filePath = \"./package.json\";
    const pkg = JSON.parse(fs.readFileSync(filePath, \"utf8\"));
    const port = process.env.TRANSCENDENCE_NEXTJS_EXPOSE_PORT || \"3000\";
    const nestPort = process.env.TRANSCENDENCE_NESTJS_EXPOSE_PORT || \"3001\";

    pkg.scripts = {
      \"dev\": \`next dev -p \${port}\`,
      \"build\": \"next build\",
      \"start\": \`next start -p \${port}\`,
      \"lint\": \"eslint\",
      \"lint:fix\": \"eslint --fix\",
      \"generate:types\": \`openapi-typescript http://nestjs:\${nestPort}/admin/api-docs-json -o src/types/api.d.ts\`
    };

    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + \"\n\");
  "

  # 4. Install exact versions from pnpm-lock.yaml
  run_suexec ${USER_ID} ${GROUP_ID} pnpm install --frozen-lockfile

  # 5. Generate config files if not already provided by /app/saves
  run_suexec ${USER_ID} ${GROUP_ID} node -e '
    const fs = require("fs");
    fs.writeFileSync("./postcss.config.mjs", "export default {\n  plugins: {\n    \"@tailwindcss/postcss\": {},\n  },\n};\n");
  '

  cat <<EOF > ./next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '${TRANSCENDENCE_DOMAIN_NAME}',
    '${TRANSCENDENCE_LOCAL_IP_ADDRESS}.sslip.io',
    'localhost',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        '${TRANSCENDENCE_DOMAIN_NAME}',
        '${TRANSCENDENCE_LOCAL_IP_ADDRESS}.sslip.io',
        'localhost',
      ],
    },
  },
};

module.exports = nextConfig;
EOF

  [ ! -f "./tsconfig.json" ] && run_suexec ${USER_ID} ${GROUP_ID} touch ./tsconfig.json

  if [ -z "$(ls -A ./src/app)" ]; then
    cat <<EOF > ./src/app/layout.tsx
import React from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

    cat <<EOF > ./src/app/page.tsx
export default function Page() {
  return <h1>Hello world</h1>
}
EOF

    cat <<EOF > ./src/app/globals.css
@import "tailwindcss";
EOF
  fi

  if [ "${USER_ID}" -ne 0 ]; then
    chown -R "${USER_ID}:${GROUP_ID}" "${NEXTJS_DIR}"
  fi

fi

run_suexec ${USER_ID} ${GROUP_ID} pnpm generate:types

if [ $# -ne 0 ]; then
  if [ "${USER_ID}" -ne 0 ]; then
    exec su-exec "${USER_ID}:${GROUP_ID}" "$@"
  else
    exec "$@"
  fi
else
  if [ "${TRANSCENDENCE_PRODUCTION_MODE}" = "FALSE" ]; then
    if [ "${USER_ID}" -ne 0 ]; then
      exec su-exec "${USER_ID}:${GROUP_ID}" npm run dev
    else
      exec npm run dev
    fi
  else
    run_suexec ${USER_ID} ${GROUP_ID} npm run build

    if [ "${USER_ID}" -ne 0 ]; then
      exec su-exec "${USER_ID}:${GROUP_ID}" npm run start
    else
      exec npm run start
    fi
  fi
fi
