FROM mcr.microsoft.com/playwright:v1.52.0-jammy

ARG REPO_URL=https://github.com/radix-ui/primitives.git
ARG BASE_COMMIT=73f489df31458a3c8ab6cc3789da54b21a63387e
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable \
  && corepack prepare pnpm@11.5.0 --activate \
  && pnpm install --frozen-lockfile

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
# The Playwright base image already contains the pinned Chromium executable.
# This repository revision has no root-level Playwright CLI, so attempting the
# install command fails before the verifier files are copied into the image.
ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN npm install --prefix /tests/canonical_repro/legacy/public/repro/tooling --no-audit --no-fund --ignore-scripts
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN test -x /tests/canonical_repro/legacy/public/repro/tooling/node_modules/.bin/vite \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/playwright-core \
  && test -d /tests/canonical_repro/legacy/public/repro/tooling/node_modules/@vitejs/plugin-react
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
RUN npm install --prefix /opt/radix-canonical-tooling --no-audit --no-fund --ignore-scripts \
  @vitejs/plugin-react@4.7.0 playwright-core@1.58.2 tslib@2.8.1 vite@5.4.21
ARG CHROME_URL=https://storage.googleapis.com/chrome-for-testing-public/149.0.7827.115/linux64/chrome-linux64.zip
ARG CHROME_SHA256=4adece5eeaaf9ca95bd2c87792163e34652097c29a253e8bf9e4c58fcab28884
RUN curl --fail --location --silent --show-error "$CHROME_URL" --output /tmp/chrome-linux64.zip \
  && echo "$CHROME_SHA256  /tmp/chrome-linux64.zip" | sha256sum --check - \
  && mkdir -p /opt/chrome-149 \
  && python3 -m zipfile -e /tmp/chrome-linux64.zip /opt/chrome-149 \
  && rm /tmp/chrome-linux64.zip \
  && chmod 0755 /opt/chrome-149/chrome-linux64/chrome /opt/chrome-149/chrome-linux64/chrome_crashpad_handler \
  && test -x /opt/chrome-149/chrome-linux64/chrome
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN rm -rf /tests/canonical_repro/legacy/public/repro/tooling/node_modules \
  && ln -s /opt/radix-canonical-tooling/node_modules \
    /tests/canonical_repro/legacy/public/repro/tooling/node_modules
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh
