#!/bin/bash
# CI-only setup: Playwright for the wireframe smoke test (no package.json in this repo yet).
set -euo pipefail
npm i --no-save --no-package-lock playwright@1.48.2
npx playwright install --with-deps chromium
