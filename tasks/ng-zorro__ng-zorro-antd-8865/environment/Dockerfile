FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG NODE_VERSION=20.19.4
ARG REPO_URL=https://github.com/NG-ZORRO/ng-zorro-antd.git
ARG BASE_COMMIT=30c25f0201130ccb00c8d2ba2e709763d7bcfd6e
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/node \
 && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
ENV PATH=/opt/node/bin:$PATH CI=true NODE_ENV=test BABEL_ENV=test \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 PUPPETEER_SKIP_DOWNLOAD=1 \
    CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN HUSKY=0 PUPPETEER_SKIP_DOWNLOAD=true npm ci --no-audit --no-fund
