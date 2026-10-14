FROM public.ecr.aws/docker/library/node:22-bookworm AS official_runtime

FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/mui/material-ui.git
ARG BASE_COMMIT=a71da577d99d67680c6654e0ea2ebe20eed633a4
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export COREPACK_HOME=/corepack; corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
COPY --from=official_runtime /usr/local/bin/node /opt/official-runtime/bin/node
ENV COREPACK_HOME=/corepack
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && test -x /opt/official-runtime/bin/node && test -d /tests/canonical_repro/tooling/node_modules/playwright
# The canonical tooling uses Playwright 1.58.2, while the official Vitest
# browser provider in the frozen subject requires Playwright 1.59.1. Keep both
# browser revisions available instead of relying on pnpm exec's CLI choice.
RUN test -f /workspace/repo/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/cli.js \
  && PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
     node /workspace/repo/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/cli.js install chromium
