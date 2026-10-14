FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN find /etc/apt -type f \( -name 'sources.list' -o -name '*.list' \) -exec sed -i -e 's|deb.debian.org/debian|archive.debian.org/debian|g' -e 's|security.debian.org/debian-security|archive.debian.org/debian-security|g' {} + && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99interactrepair-archive && apt-get -o Acquire::Check-Valid-Until=false update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/* /etc/apt/apt.conf.d/99interactrepair-archive

ARG LEGACY_NODE_VERSION=18.20.8
RUN curl -fsSLO "https://nodejs.org/dist/v${LEGACY_NODE_VERSION}/node-v${LEGACY_NODE_VERSION}-linux-x64.tar.gz" \
 && mkdir -p /opt/legacy-node \
 && tar -xzf "node-v${LEGACY_NODE_VERSION}-linux-x64.tar.gz" -C /opt/legacy-node --strip-components=1 \
 && rm "node-v${LEGACY_NODE_VERSION}-linux-x64.tar.gz"

ARG REPO_URL=https://github.com/mui/material-ui.git
ARG BASE_COMMIT=7c29d28ac9ec1cbd5684069f949b00c95dd34fa4
ENV CI=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CYPRESS_INSTALL_BINARY=0 \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN export YARN_CACHE_FOLDER=/yarn-cache; yarn --version && yarn install --frozen-lockfile --non-interactive

RUN apt-get update && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/*
ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund --ignore-scripts
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs
