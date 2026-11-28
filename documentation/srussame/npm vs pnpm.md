# JavaScript Package Managers: npm vs. pnpm

A quick reference guide to understanding, installing, and choosing between **npm** and **pnpm** for your JavaScript and Node.js projects.

---

## What is npm?

**npm** (Node Package Manager) is the default package manager for Node.js and the world's largest software registry. It allows developers to install, share, and manage dependencies (libraries and tools) in JavaScript projects.

### How to Install npm
npm comes bundled automatically when you install **Node.js**.
1. Download and install Node.js from the official Node.js website (`nodejs.org`).
2. Verify the installation in your terminal:
   ```bash
   node -v
   npm -v
   ```
3. To update npm to the latest version:
   ```bash
   npm install -g npm@latest
   ```

### Basic npm Usage
* **Initialize a project:** `npm init -y`
* **Install all dependencies:** `npm install`
* **Add a package:** `npm install <package-name>`
* **Add a dev dependency:** `npm install -D <package-name>`
* **Remove a package:** `npm uninstall <package-name>`
* **Run a script:** `npm run <script-name>`

---

## What is pnpm?

**pnpm** (Performant npm) is a fast, disk-space-efficient drop-in replacement for npm. Instead of copying packages into every project's `node_modules` folder, pnpm stores all packages in a single global content-addressable store on your machine and links them to your projects using hard links and symlinks.

### How to Install pnpm
The recommended way to install pnpm on Node.js (v16.13+) is via **Corepack** (built into Node.js):
```bash
corepack enable
corepack prepare pnpm@latest --activate
```
Alternatively, install it globally via npm:
```bash
npm install -g pnpm
```

### Basic pnpm Usage
* **Initialize a project:** `pnpm init`
* **Install all dependencies:** `pnpm install`
* **Add a package:** `pnpm add <package-name>`
* **Add a dev dependency:** `pnpm add -D <package-name>`
* **Remove a package:** `pnpm remove <package-name>`
* **Run a script:** `pnpm <script-name>` (or `pnpm run <script-name>`)

---

## How is pnpm Different from npm?

| Feature | npm | pnpm |
|---|---|---|
| **Storage Mechanism** | Copies files into each project's `node_modules` | Single global store (`~/.pnpm-store`) with hard links |
| **`node_modules` Structure** | Flat (hoisted) directory structure | Nested, non-flat symlinked structure |
| **Phantom Dependencies** | Allows importing undeclared transitive dependencies | Strict isolation; only packages in `package.json` are accessible |
| **Installation Speed** | Standard speed | Up to 2x–3x faster |
| **Monorepo Support** | Basic workspaces (`npm workspaces`) | Advanced built-in workspaces & filtering (`pnpm-workspace.yaml`) |

---

## Why Choose pnpm Over npm?

* **If you have multiple Node.js projects on your machine:** Choose **pnpm** to avoid duplicating gigabytes of identical packages (like `react` or `typescript`) across folders.
* **If you are building a Monorepo:** Choose **pnpm** for its first-class workspace management and fast cross-package linking.
* **If you want faster CI/CD pipelines:** Choose **pnpm** to significantly cut down dependency installation times.
* **If you want stricter dependency safety:** Choose **pnpm** to prevent "phantom dependency" bugs (accidentally importing a sub-dependency you didn't explicitly install).

---

## Pros and Cons of Using pnpm

### Pros
* **Massive Disk Space Savings:** Every version of a package is saved only once on your disk.
* **Blazing Fast:** Outperforms npm in both cold and cached installations.
* **Strict & Safe by Default:** Prevents access to arbitrary sub-dependencies not listed in your `package.json`.
* **Built-in Monorepo Tooling:** Native support for workspace filtering (`pnpm --filter <pkg> <cmd>`).

### Cons
* **Extra Setup Step:** Doesn't come pre-enabled out of the box like npm (requires enabling Corepack or installing globally).
* **Legacy Tooling Compatibility:** A small number of older tools or poorly configured packages assume a flat `node_modules` structure and may break (though this is easily fixed by setting `node-linker=hoisted` in `.npmrc`).
* **Symlink Quirkiness:** Some cloud/serverless deployment environments or Docker setups require specific flags (`pnpm deploy`) to bundle symlinked dependencies properly.