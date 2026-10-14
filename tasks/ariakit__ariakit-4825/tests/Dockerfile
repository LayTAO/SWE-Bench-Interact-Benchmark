FROM mcr.microsoft.com/playwright:v1.58.2-noble

ARG DEBIAN_MIRROR=deb.debian.org
ARG DEBIAN_SECURITY_MIRROR=security.debian.org

RUN apt-get update -o Acquire::Retries=3 -o Acquire::http::Timeout=60 \
  && apt-get install -y --no-install-recommends \
    ca-certificates git python3 \
    libasound2t64 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 \
    libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxkbcommon0 \
    libxrandr2 xvfb fonts-noto-color-emoji fonts-unifont \
    libfontconfig1 libfreetype6 xfonts-scalable fonts-liberation \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-tlwg-loma-otf \
    fonts-freefont-ttf \
  && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/ariakit/ariakit.git
ARG BASE_COMMIT=b166c1a7fe8dc9eeca41af5fd420179df5bac493
ARG NPM_REGISTRY=https://registry.npmjs.org

WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init -b main \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'

ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY}
RUN corepack enable \
  && corepack prepare pnpm@10.32.1 --activate \
  && pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm install --frozen-lockfile

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN cd site && pnpm exec playwright install chromium

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=pnpm
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
RUN npm install --prefix /opt/canonical-tooling --no-audit --no-fund --ignore-scripts \
  @playwright/test@1.58.2 vite@5.4.21 @vitejs/plugin-react@4.7.0
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh
