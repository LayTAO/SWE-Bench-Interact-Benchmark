# syntax=docker/dockerfile:1.7

FROM public.ecr.aws/docker/library/node:24-bookworm

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
