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

NEXTJS_DIR=/app/nextjs
NEXTJS_PORT=${TRANSCENDENCE_NEXTJS_EXPOSE_PORT}
NEXTJS_DOMAIN_NAME_TRANSC=${TRANSCENDENCE_DOMAIN_NAME}

USER_ID=${PUID:-$(stat -c '%u' "${NEXTJS_DIR}" 2>/dev/null || echo 1000)}
GROUP_ID=${PGID:-$(stat -c '%g' "${NEXTJS_DIR}" 2>/dev/null || echo 1000)}

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


cd "${NEXTJS_DIR}"

if [ ! -d "./node_modules" ] || [ -z "$(ls -A ./node_modules)" ]; then

run_suexec ${USER_ID} ${GROUP_ID} mkdir -p src/app node_modules

run_suexec ${USER_ID} ${GROUP_ID} pnpm add next@latest react@latest react-dom@latest


run_suexec ${USER_ID} ${GROUP_ID} node -e "
  const fs = require(\"fs\");
  const filePath = \"./package.json\";
  const pkg = JSON.parse(fs.readFileSync(filePath, \"utf8\"));
  const port = process.env.TRANSCENDENCE_NEXTJS_EXPOSE_PORT || \"3000\" ;

  pkg.scripts = {
    \"dev\": \`next dev -p \${port}\`,
    \"build\": \"next build\",
    \"start\": \`next start -p \${port}\`,
    \"lint\": \"eslint\",
    \"lint:fix\": \"eslint --fix\",
    \"generate:types\": \"openapi-typescript http://nestjs:${TRANSCENDENCE_NESTJS_EXPOSE_PORT}/api-docs-json -o src/types/api.d.ts\"
  };

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + \"\n\");
"

run_suexec ${USER_ID} ${GROUP_ID} pnpm add tailwindcss @tailwindcss/postcss postcss  \
  autoprefixer motion three@latest \
  @types/three @react-three/fiber@latest \
  @react-three/drei@latest clsx use-sound \
  leva @react-three/rapier openapi-typescript \
  socket.io-client zod

run_suexec ${USER_ID} ${GROUP_ID} node -e '
  const fs = require("fs");
  fs.writeFileSync("./postcss.config.mjs", "export default {\n plugins: {\n   \"@tailwindcss/postcss\": {},\n },\n};\n");
'

cat <<EOF > ./next.config.js

/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        '${TRANSCENDENCE_DOMAIN_NAME}',
        'localhost',
      ],
      transpilePackages: ['three'],
    },
  },
};

module.exports = nextConfig;

EOF

run_suexec ${USER_ID} ${GROUP_ID} touch ./tsconfig.json

run_suexec ${USER_ID} ${GROUP_ID} mkdir -p ./src
run_suexec ${USER_ID} ${GROUP_ID} mkdir -p ./src/public
run_suexec ${USER_ID} ${GROUP_ID} mkdir -p ./src/app

cp -r /app/saves/* ./ || true
# chmod -R 777 ./app || true
# chmod -R 777 ./public || true

if [ -z $(ls -A ./src/app) ]; then

cat <<EOF > ./app/layout.tsx
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
    chown -R "${USER_ID}:${GROUP_ID}" ${NEXTJS_DIR}
  fi

fi

run_suexec ${USER_ID} ${GROUP_ID} npm run generate:types

if [ "${USER_ID}" -ne 0 ]; then
  exec su-exec "${USER_ID}:${GROUP_ID}" "$@"
else
  exec "$@"
fi
