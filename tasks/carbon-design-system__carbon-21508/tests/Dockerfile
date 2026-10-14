FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV GIT_HTTP_VERSION=HTTP/1.1
ENV npm_config_registry=https://registry.npmmirror.com \
    npm_config_replace_registry_host=always \
    YARN_NPM_REGISTRY_SERVER=https://registry.npmmirror.com
ENV CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    PUPPETEER_EXECUTABLE_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome

ARG REPO_URL=https://github.com/carbon-design-system/carbon.git
ARG BASE_COMMIT=f5a7fd697b193da17d127d5726388b6ef2a5e449
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN node .yarn/releases/yarn-4.10.3.cjs install --immutable

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
# Keep the verifier image cache key aligned with the task-specific build gate.
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
