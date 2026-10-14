FROM public.ecr.aws/docker/library/node:22-bookworm
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

ENV COREPACK_HOME=/corepack
RUN cd /workspace/repo && test "$(pnpm --version)" = 10.33.0
