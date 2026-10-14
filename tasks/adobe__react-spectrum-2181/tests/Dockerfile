FROM mcr.microsoft.com/playwright@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d

ARG REPO_URL=https://github.com/adobe/react-spectrum.git
ARG BASE_COMMIT=f847cd08b59ec7aa42b5f8bdd6b456738b9497ed
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
# The verifier base intentionally keeps the pinned Playwright runtime (Node 24),
# while this historical lockfile pins sharp 0.31.2, whose install script invokes
# an incompatible node-gyp path on Node 24.  The verifier's canonical and
# official tests do not import sharp; skip dependency lifecycle scripts here so
# the locked JavaScript dependencies remain available without changing the
# accepted test contract.
RUN export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive --ignore-engines --ignore-scripts
RUN export YARN_CACHE_FOLDER=/yarn-cache; yarn build:icons && ./node_modules/.bin/patch-package

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
