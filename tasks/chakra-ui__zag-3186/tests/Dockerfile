FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG REPO_URL=https://github.com/chakra-ui/zag.git
ARG BASE_COMMIT=2e2526447a2ebd9e6e7bffd6ea1ff22c19a57586
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    COREPACK_HOME=/corepack \
    COREPACK_ENABLE_PROJECT_SPEC=0
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN corepack enable --install-directory /usr/local/bin \
  && corepack prepare pnpm@11.3.0 --activate \
  && /usr/local/bin/pnpm --version \
  && /usr/local/bin/pnpm config set store-dir /pnpm/store \
  && /usr/local/bin/pnpm install --frozen-lockfile --ignore-scripts --trust-lockfile

# The repository locks @playwright/test 1.60.0 while the base image also
# carries older browsers for the canonical reproduction. Install the matching
# Chromium bundle so the official runner does not mix client and browser
# versions.
RUN cd /workspace/repo \
  && PLAYWRIGHT_BROWSERS_PATH=/ms-playwright PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 \
     pnpm exec playwright install chromium

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
# The Playwright base image supplies browsers, but not the Playwright test CLI.
# Install the matching test runner without downloading a second browser bundle.
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --global @playwright/test@1.58.2 --no-audit --no-fund \
  && playwright --version
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
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh
