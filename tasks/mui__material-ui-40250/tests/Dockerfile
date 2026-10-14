FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG NODE_VERSION=24.15.0
ARG REPO_URL=https://github.com/mui/material-ui.git
ARG BASE_COMMIT=2dc145f2d2bece8f30293137e276bdbdb4cda294
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
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate && pnpm install --frozen-lockfile && pnpm exec playwright install chromium

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts
RUN npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-save --ignore-scripts --no-audit --no-fund \
  prop-types@15.8.1 clsx@2.1.1 react-is@19.2.4 react-transition-group@4.4.5 \
  @popperjs/core@2.11.8 @babel/runtime@7.29.2 @emotion/cache@11.14.0 \
  @emotion/serialize@1.3.3 @emotion/sheet@1.4.0 @emotion/react@11.14.0 \
  @emotion/styled@11.14.1 csstype@3.2.3
RUN test -x /tests/canonical_repro/legacy/public/repro/tooling/node_modules/.bin/vite \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/playwright-core \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/@vitejs/plugin-react \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/@babel/plugin-transform-react-jsx-self \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/prop-types
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && test -x /ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell && test -x /ms-playwright/chromium-1208/chrome-linux64/chrome
