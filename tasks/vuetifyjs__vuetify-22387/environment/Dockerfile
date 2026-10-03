FROM public.ecr.aws/docker/library/node:24-bookworm
ENV COREPACK_HOME=/corepack
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/vuetifyjs/vuetify.git
ARG BASE_COMMIT=b90b7984d0a693eb116ac5608e57ba46b908177d
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN apt-get update && apt-get install -y --no-install-recommends chromium xvfb libgtk-3-0 libgbm1 libnss3 libasound2 && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export COREPACK_HOME=/corepack; corepack enable && corepack prepare pnpm@10.26.1 --activate && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile
