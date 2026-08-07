#!/usr/bin/env sh

set -eu

NEXTJS_DIR=/nextjs
NEXTJS_PORT=${TRANSCENDENCE_NEXTJS_EXPOSE_PORT}
NEXTJS_DOMAIN_NAME_TRANSC=${TRANSCENDENCE_DOMAIN_NAME}

cd "${NEXTJS_DIR}"

if [ ! -d "./node_modules" ] || [ -z "$(ls -A ./node_modules)" ]; then

mkdir -p app node_modules

npm i next@latest react@latest react-dom@latest

node -e '
  const fs = require("fs");
  const filePath = "./package.json";
  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const port = process.env.TRANSCENDENCE_NEXTJS_EXPOSE_PORT || "3000" ;

  pkg.scripts = {
    "dev": `next dev -p ${port}`,
    "build": "next build",
    "start": `next start -p ${port}`,
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  };

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + "\n");
'

npm i tailwindcss @tailwindcss/postcss postcss autoprefixer motion @babylonjs/core @babylonjs/loaders

node -e '
  const fs = require("fs");
  fs.writeFileSync("./postcss.config.mjs", "export default {\n plugins: {\n   \"@tailwindcss/postcss\": {},\n },\n};\n");
'

cat <<EOF > ./next.config.js
module.exports = {
    allowedDevOrigins: ['${TRANSCENDENCE_DOMAIN_NAME}'],
}
EOF

touch ./tsconfig.json

mkdir -p ./app
mkdir -p ./public

if [ -z $(ls -A ./app) ]; then

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

cat <<EOF > ./app/page.tsx

export default function Page() {
  return <h1>Hello world</h1>
}

EOF

fi

fi

exec npm run dev
