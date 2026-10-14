
FROM public.ecr.aws/docker/library/node:24-bookworm AS dependency

ARG BASE_COMMIT=d8b16d4f793a813baabdceaf6171750d940bdf06

ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    COREPACK_HOME=/corepack \
    PNPM_HOME=/pnpm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       git \
       libnspr4 \
       ripgrep \
       build-essential \
       python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/repo

# The server build script supplies base/ from an exact, clean upstream checkout.
# It is deliberately outside the Git task tree so the repository does not contain
# a codebase archive or dependency tree.
COPY base/ /workspace/repo/

# Keep the pnpm package store outside the image layers.  The verifier build
# reuses the installed dependency tree from this image, while this cache also
# makes rebuilds avoid downloading the same package tarballs again.
RUN --mount=type=cache,id=swe-bench-interact-vuetify-22850-pnpm-store,target=/pnpm/store,sharing=locked \
    git init -b main \
  && git config user.name "Harbor base snapshot" \
  && git config user.email "harbor-base@example.invalid" \
  && git add -A \
  && git commit -m "base snapshot ${BASE_COMMIT}" \
  && corepack enable \
  && corepack prepare pnpm@10.26.1 --activate \
  && pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

ENV HARBOR_BASE_COMMIT=${BASE_COMMIT}


FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG BASE_COMMIT=d8b16d4f793a813baabdceaf6171750d940bdf06

ENV CI=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    COREPACK_HOME=/corepack \
    PNPM_HOME=/pnpm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       git \
       ripgrep \
       build-essential \
       python3 \
  && rm -rf /var/lib/apt/lists/*

# Build the subject dependencies in the local dependency stage, then
# copy them into the independent browser-enabled verifier stage.
COPY --from=dependency /workspace/repo/ /workspace/base/
COPY --from=dependency /corepack/ /corepack/
COPY test.sh /tests/test.sh
COPY playwright/ /tests/playwright/
COPY verifier/ /tests/verifier/

WORKDIR /workspace/base
# The copied repository contains the dependency tree and the Playwright base
# image already contains the versioned browsers and system dependencies.  The
# verifier selects that browser explicitly via CHROMIUM_EXECUTABLE, so neither
# a second pnpm install nor a second system Chromium installation is needed.
RUN rm -rf /workspace/base/.git \
  && git init -b main \
  && git config user.name "Harbor verifier base snapshot" \
  && git config user.email "harbor-verifier@example.invalid" \
  && git add -A \
  && git commit -m "base snapshot ${BASE_COMMIT}" \
  && corepack enable \
  && COREPACK_HOME=/corepack pnpm --version

COPY playwright/tooling/package.json /tooling/package.json
WORKDIR /tooling
RUN --mount=type=cache,id=swe-bench-interact-vuetify-22850-npm,target=/root/.npm,sharing=locked \
    npm install --ignore-scripts --no-audit --no-fund

RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh
WORKDIR /workspace
