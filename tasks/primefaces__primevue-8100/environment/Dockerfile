FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils && rm -rf /var/lib/apt/lists/*
ARG NODE_VERSION=22.23.1
ARG REPO_URL=https://github.com/primefaces/primevue.git
ARG BASE_COMMIT=1a28898c88905869c44f0c9f9d39f19c5af4dc0b
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
 && mkdir -p /opt/node \
 && tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.xz"
ENV PATH=/opt/node/bin:$PATH \
    CI=true \
    NODE_ENV=test \
    BABEL_ENV=test \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    CYPRESS_INSTALL_BINARY=0 \
    CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable && pnpm install --frozen-lockfile
