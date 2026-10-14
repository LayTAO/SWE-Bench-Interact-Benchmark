FROM mcr.microsoft.com/playwright:v1.58.2-noble
ARG NODE_VERSION=16.20.2
RUN curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
  && mkdir -p /opt/node16 \
  && tar -xzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /opt/node16 --strip-components=1 \
  && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"
ENV PATH=/opt/node16/bin:$PATH \
  CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep && rm -rf /var/lib/apt/lists/*
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
  && npm install --global yarn@1.22.22 \
  && test "$(yarn --version)" = "1.22.22"
WORKDIR /subject
WORKDIR /workspace/repo
COPY base/ /workspace/repo/
RUN git init \
  && git config user.name 'Harbor base snapshot' \
  && git config user.email 'harbor-base@example.invalid' \
  && git add -A \
  && git commit -qm 'base snapshot'
RUN yarn install --frozen-lockfile --non-interactive
WORKDIR /workspace/repo

ENV HARBOR_PACKAGE_MANAGER=yarn
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/verifier/chrome-no-sandbox.sh
RUN install -m 0755 /tests/verifier/chrome-no-sandbox.sh /usr/local/bin/harbor-chrome
RUN if [ -f /tests/canonical_repro/tooling/package-lock.json ]; then npm ci --prefix /tests/canonical_repro/tooling --no-audit --no-fund; elif [ -f /tests/canonical_repro/tooling/package.json ]; then npm install --prefix /tests/canonical_repro/tooling --no-audit --no-fund; fi
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh && ln -sfn /tests/verifier/inprocess-engine.sh /usr/local/bin/docker && ln -sfn /tests/verifier /benchmark && mkdir -p /state-cache /logs

# Additional browser/runtime preparation.
ENV PATH=/usr/bin:/usr/local/bin:/usr/sbin:/sbin:/bin
RUN rmdir /subject
RUN npm install --prefix /opt/canonical-tooling --no-audit --no-fund --ignore-scripts \
  @playwright/test@1.58.2 vite@4.5.14 @vitejs/plugin-react@4.3.4
COPY test.sh /tests/test.sh
COPY canonical_repro/ /tests/canonical_repro/
COPY verifier/ /tests/verifier/
RUN chmod 0755 /tests/test.sh /tests/verifier/*.sh /tests/canonical_repro/scripts/*.sh
