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

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
RUN install -D /usr/bin/node /opt/canonical-runtime/bin/node
ENV PATH=/opt/canonical-runtime/bin:$PATH
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts
RUN test -x /tests/canonical_repro/legacy/public/repro/tooling/node_modules/.bin/vite \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/playwright-core \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/@vitejs/plugin-react \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/@babel/plugin-transform-react-jsx-self
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && test -x /root/.cache/Cypress/8.7.0/Cypress/Cypress
