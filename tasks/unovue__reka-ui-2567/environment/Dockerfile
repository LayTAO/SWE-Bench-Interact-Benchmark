FROM public.ecr.aws/docker/library/node:22-bookworm
ENV COREPACK_HOME=/corepack
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/unovue/reka-ui.git
ARG BASE_COMMIT=1eb104fd1907e96294aa3d3b3d6bcf7d49762200
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
RUN export COREPACK_HOME=/corepack; corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile
