FROM public.ecr.aws/docker/library/node@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=1b7eb8ace9921b524ef5187052e744a261ebf163
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export COREPACK_HOME=/corepack; corepack enable && corepack prepare pnpm@11.9.0 --activate && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile
