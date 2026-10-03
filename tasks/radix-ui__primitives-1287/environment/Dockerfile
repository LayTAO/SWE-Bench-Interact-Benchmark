FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG NODE_VERSION=16.20.2
ARG REPO_URL=https://github.com/radix-ui/primitives.git
ARG BASE_COMMIT=ddde23eaf8d143340f2bd61cc3212e29ba17bef9
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
RUN yarn install --immutable && yarn cypress install
