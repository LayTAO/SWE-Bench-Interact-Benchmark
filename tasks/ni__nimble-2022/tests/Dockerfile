FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG REPO_URL=https://github.com/ni/nimble.git
ARG BASE_COMMIT=0ac9d81713bf9e91e1d89578cabdbc4db0b67009
ARG SNAPSHOT_VERSION=2
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN rm -rf .git \
  && git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

RUN npm ci --ignore-scripts \
  && npm run build -w packages/jasmine-parameterized \
  && npm run build -w packages/nimble-tokens \
  && npm run generate-icons -w packages/nimble-components \
  && npm run generate-workers -w packages/nimble-components

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=npm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/verifier/chrome-no-sandbox.sh
RUN install -m 0755 /tests/verifier/chrome-no-sandbox.sh /usr/local/bin/harbor-chrome
RUN if [ -f /tests/canonical_repro/legacy/public/repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/legacy/public/repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund; fi
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
