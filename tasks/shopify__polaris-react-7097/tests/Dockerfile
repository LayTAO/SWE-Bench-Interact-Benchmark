FROM mcr.microsoft.com/playwright:v1.58.2-noble
ENV GIT_HTTP_VERSION=HTTP/1.1
ARG NODE_VERSION=16.20.2
ARG REPO_URL=https://github.com/Shopify/polaris-react.git
ARG BASE_COMMIT=8e16d15d1249591e9e854ae294ec8ce8ab3e3594
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/node \
 && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node --strip-components=1 \
 && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
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

RUN npm install --global yarn@1.22.22 \
 && sed -i 's#https://registry.yarnpkg.com#https://registry.npmmirror.com#g; s#https://registry.npmjs.org#https://registry.npmmirror.com#g' yarn.lock \
 && yarn install --frozen-lockfile --ignore-engines --registry https://registry.npmmirror.com
RUN yarn workspace @shopify/polaris-tokens build
RUN sed -i "/    input: 'src\\/index.ts',/i\\    maxParallelFileReads: 32," polaris-icons/rollup.config.mjs \
 && yarn workspace @shopify/polaris-icons build

ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN for tooling_dir in /tests/canonical_repro/tooling /tests/canonical_repro/legacy/public/repro/tooling; do if [ -f "$tooling_dir/package-lock.json" ]; then npm ci --prefix "$tooling_dir" --no-audit --no-fund; elif [ -f "$tooling_dir/package.json" ]; then npm install --prefix "$tooling_dir" --no-audit --no-fund; fi; done
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
