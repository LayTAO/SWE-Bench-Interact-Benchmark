FROM public.ecr.aws/docker/library/node:22-bookworm

ARG REPO_URL=https://github.com/element-plus/element-plus.git
ARG BASE_COMMIT=a4a6a1143235af4dba9bc88121f24e287757ef22
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    COREPACK_HOME=/corepack \
    COREPACK_ENABLE_PROJECT_SPEC=0
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable --install-directory /usr/local/bin \
  && corepack prepare pnpm@11.13.0 --activate \
  && /usr/local/bin/pnpm --version \
  && /usr/local/bin/pnpm config set store-dir /pnpm/store \
  && /usr/local/bin/pnpm install --frozen-lockfile
