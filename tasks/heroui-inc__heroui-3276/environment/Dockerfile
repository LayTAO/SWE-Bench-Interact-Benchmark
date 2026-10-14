FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG NODE_VERSION=20.18.0
ARG REPO_URL=https://github.com/heroui-inc/heroui.git
ARG BASE_COMMIT=c5ab49afa4b34ff52a7dc95fcc1709f5e3fdaf0b
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/node \
 && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
ENV PATH=/opt/node/bin:$PATH CI=true NODE_ENV=test BABEL_ENV=test \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 PUPPETEER_SKIP_DOWNLOAD=1 \
    CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    npm_config_registry=https://registry.npmmirror.com \
    npm_config_replace_registry_host=always \
    YARN_NPM_REGISTRY_SERVER=https://registry.npmmirror.com
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN npm install --global pnpm@8.7.0 && pnpm install --frozen-lockfile --store-dir /pnpm-store --network-concurrency=4
